import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasBrandAccess } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getBrandIdFromSlug } from "@/lib/db/brand";
import { z } from "zod";
import { RuleStatus, RuleScope, RuleSeverity, EnforcementLevel } from "@/lib/rules/types";

export const runtime = "nodejs";

const updateRuleSchema = z.object({
  name: z.string().min(1).optional(),
  status: z.nativeEnum(RuleStatus).optional(),
  scope: z.nativeEnum(RuleScope).optional(),
  surfaces: z.array(z.string()).optional(),
  channels: z.array(z.string()).optional(),
  components: z.array(z.string()).optional(),
  locales: z.array(z.string()).optional(),
  severity: z.nativeEnum(RuleSeverity).optional(),
  enforcement: z.nativeEnum(EnforcementLevel).optional(),
  description: z.string().optional(),
  rationale: z.string().optional(),
  examples: z.object({
    do: z.array(z.string()),
    dont: z.array(z.string()),
  }).optional(),
  suggestions: z.array(z.string()).optional(),
  exceptions: z.array(z.string()).optional(),
  edgeNotes: z.string().optional(),
  detectors: z.array(z.any()).optional(),
  findingTemplate: z.string().optional(),
  rewriteTemplate: z.string().optional(),
  changeLog: z.string().optional(),
  priority: z.number().optional(),
  // Legacy fields
  value: z.any().optional(),
  controlType: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ brandSlug: string; ruleId: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { brandSlug, ruleId } = await params;

    // OPTIMIZATION: Extract org IDs from user object (already loaded)
    const userOrgIds = user.memberships?.map((m: { orgId: string }) => m.orgId) || [];
    const brandId = await getBrandIdFromSlug(brandSlug, userOrgIds);

    if (!brandId) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const hasAccess = await hasBrandAccess(user.id, brandId, userOrgIds);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rule = await prisma.rule.findFirst({
      where: {
        id: ruleId,
        brandId,
      },
    });

    if (!rule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    return NextResponse.json(rule);
  } catch (error) {
    console.error("Error fetching rule:", error);
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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ brandSlug: string; ruleId: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { brandSlug, ruleId } = await params;

    // OPTIMIZATION: Extract org IDs from user object
    const userOrgIds = user.memberships?.map((m: { orgId: string }) => m.orgId) || [];
    const brandId = await getBrandIdFromSlug(brandSlug, userOrgIds);

    if (!brandId) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const hasAccess = await hasBrandAccess(user.id, brandId, userOrgIds);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data = updateRuleSchema.parse(body);

    // OPTIMIZATION: Fetch existing rule and update in one operation
    // We need existing rule for version calculation, so fetch first
    const existingRule = await prisma.rule.findUnique({
      where: { 
        id: ruleId,
        brandId,
      },
      select: {
        status: true,
        severity: true,
        enforcement: true,
        version: true,
      },
    });

    if (!existingRule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    // Update rule
    const updatedRule = await prisma.rule.update({
      where: { id: ruleId },
      data: {
        ...data,
        // Increment version if significant changes
        version: data.status !== existingRule.status || 
                data.severity !== existingRule.severity ||
                data.enforcement !== existingRule.enforcement
          ? existingRule.version + 1
          : existingRule.version,
      },
    });

    return NextResponse.json(updatedRule);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }
    console.error("Error updating rule:", error);
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ brandSlug: string; ruleId: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { brandSlug, ruleId } = await params;

    // OPTIMIZATION: Extract org IDs from user object (already loaded)
    const userOrgIds = user.memberships?.map((m: { orgId: string }) => m.orgId) || [];
    const brandId = await getBrandIdFromSlug(brandSlug, userOrgIds);

    if (!brandId) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const hasAccess = await hasBrandAccess(user.id, brandId, userOrgIds);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data = updateRuleSchema.parse(body);

    // OPTIMIZATION: Update directly (Prisma will error if rule doesn't exist or wrong brandId)
    // This combines the "check if exists" and "update" into one query
    const updatedRule = await prisma.rule.update({
      where: { 
        id: ruleId,
        brandId, // Ensures rule belongs to this brand
      },
      data: {
        ...data,
      },
    });

    return NextResponse.json(updatedRule);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }
    // Prisma will throw if rule not found or wrong brandId
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }
    console.error("Error updating rule:", error);
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ brandSlug: string; ruleId: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { brandSlug, ruleId } = await params;

    // OPTIMIZATION: Extract org IDs from user object (already loaded)
    const userOrgIds = user.memberships?.map((m: { orgId: string }) => m.orgId) || [];
    const brandId = await getBrandIdFromSlug(brandSlug, userOrgIds);

    if (!brandId) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const hasAccess = await hasBrandAccess(user.id, brandId, userOrgIds);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if rule exists
    const rule = await prisma.rule.findFirst({
      where: {
        id: ruleId,
        brandId,
      },
    });

    if (!rule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    // Delete rule (cascade will handle findings)
    await prisma.rule.delete({
      where: { id: ruleId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting rule:", error);
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

