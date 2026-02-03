import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasBrandAccess } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getBrandIdFromSlug } from "@/lib/db/brand";
import { z } from "zod";

export const runtime = "nodejs";

const resolveConflictSchema = z.object({
  resolved: z.boolean(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ brandSlug: string; conflictId: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { brandSlug, conflictId } = await params;
    const userOrgIds = user.memberships?.map((m) => m.orgId) || [];
    const brandId = await getBrandIdFromSlug(brandSlug, userOrgIds);

    if (!brandId) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Check brand access
    const hasAccess = await hasBrandAccess(user.id, brandId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data = resolveConflictSchema.parse(body);

    const existing = await prisma.repositoryConflict.findFirst({
      where: {
        id: conflictId,
        brandId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Conflict not found" }, { status: 404 });
    }

    const updateData: any = {
      resolved: data.resolved,
    };

    if (data.resolved) {
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = user.id;
    } else {
      updateData.resolvedAt = null;
      updateData.resolvedBy = null;
    }

    const updated = await prisma.repositoryConflict.update({
      where: { id: conflictId },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error resolving conflict:", error);
    return NextResponse.json(
      { error: "Failed to resolve conflict" },
      { status: 500 }
    );
  }
}

