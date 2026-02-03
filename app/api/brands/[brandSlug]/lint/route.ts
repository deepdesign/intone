import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasBrandAccess } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getBrandIdFromSlug } from "@/lib/db/brand";
import { buildPromptFromRules } from "@/lib/rules/prompt-builder";
import { generateWithOpenAI } from "@/lib/ai/openai";
import { parseLintResponse } from "@/lib/ai/response-parser";
import { Rule } from "@/lib/rules/types";
import { z } from "zod";

// Use Node.js runtime for Prisma adapter
export const runtime = "nodejs";

const lintSchema = z.object({
  input: z.string().min(1),
  context: z.enum(["ui", "marketing", "support"]).default("ui"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ brandSlug: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { brandSlug } = await params;
    const userOrgIds = user.memberships?.map((m) => m.orgId) || [];
    const brandId = await getBrandIdFromSlug(brandSlug, userOrgIds);

    if (!brandId) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const hasAccess = await hasBrandAccess(user.id, brandId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { input, context } = lintSchema.parse(body);

    // Get brand
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Get active rules for this brand, filtered by context/surface
    const rules = await prisma.rule.findMany({
      where: {
        brandId,
        status: "ACTIVE",
        // Filter by surface if context matches
        OR: [
          { surfaces: { isEmpty: true } }, // Global rules
          { surfaces: { has: context } }, // Rules that apply to this context
        ],
      },
      orderBy: [
        { priority: "asc" },
        { name: "asc" },
      ],
    });

    // Build prompt from rules
    const prompt = buildPromptFromRules(
      {
        rules: rules as any as Rule[],
        locale: brand.locale,
      },
      context,
      input,
      "lint"
    );

    // Call OpenAI
    const response = await generateWithOpenAI(prompt);

    // Parse response
    const result = parseLintResponse(response);

    // Create lint result
    const lintResult = await prisma.lintResult.create({
      data: {
        brandId,
        input,
        context,
        surface: context,
        locale: brand.locale,
        status: "completed",
        triggeredRules: result.issues, // Keep for backward compatibility
      },
    });

    // Create Finding records for each issue
    if (result.issues && Array.isArray(result.issues)) {
      for (const issue of result.issues) {
        // Find the rule that triggered this issue
        const rule = rules.find((r) => r.key === issue.ruleKey || r.name === issue.ruleKey);
        
        if (rule) {
          await prisma.finding.create({
            data: {
              lintResultId: lintResult.id,
              ruleId: rule.id,
              locationStart: 0, // TODO: Calculate from issue.original
              locationEnd: 0, // TODO: Calculate from issue.original
              severity: issue.severity === "error" ? "CRITICAL" : issue.severity === "warning" ? "MAJOR" : "MINOR",
              message: issue.reason,
              suggestedFix: issue.suggested,
            },
          });
        }
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }
    console.error("Error linting text:", error);
    return NextResponse.json(
      {
        error: "Failed to lint text",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
