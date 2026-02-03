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
    const userOrgIds = user.memberships?.map((m) => m.orgId) || [];
    const brandId = await getBrandIdFromSlug(brandSlug, userOrgIds);

    if (!brandId) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    if (!(await hasBrandAccess(user.id, brandId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data = updateCustomRuleSchema.parse(body);

    const customRule = await prisma.customRule.update({
      where: { id: ruleId },
      data: {
        ...(data.type && { type: data.type }),
        ...(data.description && { description: data.description }),
        ...(data.pattern !== undefined && { pattern: data.pattern }),
        ...(data.replacement !== undefined && { replacement: data.replacement }),
        ...(data.appliesTo && { appliesTo: data.appliesTo }),
      },
    });

    return NextResponse.json(customRule);
  } catch (error) {
    console.error("Error updating custom rule:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
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
    const userOrgIds = user.memberships?.map((m) => m.orgId) || [];
    const brandId = await getBrandIdFromSlug(brandSlug, userOrgIds);

    if (!brandId) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    if (!(await hasBrandAccess(user.id, brandId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.customRule.delete({
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

