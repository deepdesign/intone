import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasBrandAccess } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getBrandIdFromSlug } from "@/lib/db/brand";
import { z } from "zod";

export const runtime = "nodejs";

const updateCustomRuleSchema = z.object({
  type: z.enum(["forbidden", "preferred", "replacement", "formatting"]).optional(),
  description: z.string().min(1).optional(),
  pattern: z.string().optional(),
  replacement: z.string().optional(),
  appliesTo: z.array(z.string()).optional(),
});

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
    const userOrgIds = user.memberships?.map((m: { orgId: string }) => m.orgId) || [];
    const brandId = await getBrandIdFromSlug(brandSlug, userOrgIds);

    if (!brandId) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    if (!(await hasBrandAccess(user.id, brandId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data = updateCustomRuleSchema.parse(body);

    const existing = await prisma.rule.findFirst({
      where: { id: ruleId, brandId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    const typeMap = {
      forbidden: "FORBIDDEN_WORDS" as const,
      preferred: "TERMINOLOGY" as const,
      replacement: "TERMINOLOGY" as const,
      formatting: "FORMATTING" as const,
    };
    const valueUpdate =
      data.pattern !== undefined || data.replacement !== undefined || data.appliesTo !== undefined
        ? {
            ...(typeof existing.value === "object" && existing.value !== null && !Array.isArray(existing.value) ? (existing.value as Record<string, unknown>) : {}),
            ...(data.pattern !== undefined && { pattern: data.pattern }),
            ...(data.replacement !== undefined && { replacement: data.replacement }),
            ...(data.appliesTo !== undefined && { appliesTo: data.appliesTo }),
          }
        : undefined;

    const rule = await prisma.rule.update({
      where: { id: ruleId },
      data: {
        ...(data.type && { type: typeMap[data.type] }),
        ...(data.description && { description: data.description }),
        ...(valueUpdate !== undefined && { value: valueUpdate }),
      },
    });

    return NextResponse.json(rule);
  } catch (error) {
    console.error("Error updating custom rule:", error);

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
    const userOrgIds = user.memberships?.map((m: { orgId: string }) => m.orgId) || [];
    const brandId = await getBrandIdFromSlug(brandSlug, userOrgIds);

    if (!brandId) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    if (!(await hasBrandAccess(user.id, brandId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existing = await prisma.rule.findFirst({
      where: { id: ruleId, brandId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }
    await prisma.rule.delete({
      where: { id: ruleId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting custom rule:", error);
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

