import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasBrandAccess } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getBrandIdFromSlug } from "@/lib/db/brand";
import { z } from "zod";
import { RuleType, RuleStatus, RuleScope, RuleSeverity, EnforcementLevel } from "@/lib/rules/types";

export const runtime = "nodejs";

const createTerminologyRuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(["FORBIDDEN_WORDS", "TERMINOLOGY"]).default("TERMINOLOGY"),
  pattern: z.string().optional(),
  replacement: z.string().optional(),
  surfaces: z.array(z.string()).optional(),
  severity: z.nativeEnum(RuleSeverity).optional(),
  rationale: z.string().optional(),
  examples: z.object({
    do: z.array(z.string()),
    dont: z.array(z.string()),
  }).optional(),
  suggestions: z.array(z.string()).optional(),
  exceptions: z.array(z.string()).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ brandSlug: string }> }
) {
  try {
    const { brandSlug } = await params;
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userOrgIds = user.memberships?.map((m) => m.orgId) || [];
    const brandId = await getBrandIdFromSlug(brandSlug, userOrgIds);

    if (!brandId) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    if (!(await hasBrandAccess(user.id, brandId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get terminology rules (FORBIDDEN_WORDS and TERMINOLOGY types)
    const rules = await prisma.rule.findMany({
      where: {
        brandId,
        type: {
          in: ["FORBIDDEN_WORDS", "TERMINOLOGY"],
        },
        status: "ACTIVE",
      },
      orderBy: [
        { priority: "asc" },
        { name: "asc" },
      ],
    });

    return NextResponse.json(rules);
  } catch (error) {
    console.error("Error fetching terminology rules:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      {
        error: "Internal server error",
        message: process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

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

    if (!(await hasBrandAccess(user.id, brandId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data = createTerminologyRuleSchema.parse(body);

    // Get brand for default locale
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Build detectors from pattern if provided
    const detectors = data.pattern
      ? [{ kind: "REGEX", pattern: data.pattern }]
      : undefined;

    // Map severity
    const severity = data.severity || (data.type === "FORBIDDEN_WORDS" ? RuleSeverity.MINOR : RuleSeverity.INFO);

    const rule = await prisma.rule.create({
      data: {
        brandId,
        name: data.name,
        type: data.type as any,
        status: RuleStatus.ACTIVE,
        scope: RuleScope.GLOBAL,
        surfaces: data.surfaces || [],
        channels: [],
        components: [],
        locales: [brand.locale || "en-GB"],
        severity: severity,
        enforcement: EnforcementLevel.WARN,
        description: data.description,
        rationale: data.rationale,
        examples: data.examples,
        suggestions: data.replacement ? [data.replacement] : (data.suggestions || []),
        exceptions: data.exceptions || [],
        detectors: detectors,
        version: 1,
        createdBy: user.id,
        owners: [],
        priority: 0,
        source: "manual",
      },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error("Error creating terminology rule:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }

    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      {
        error: "Internal server error",
        message: process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

