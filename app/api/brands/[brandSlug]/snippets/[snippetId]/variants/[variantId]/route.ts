import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasBrandAccess } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getBrandIdFromSlug } from "@/lib/db/brand";
import { z } from "zod";

export const runtime = "nodejs";

const updateVariantSchema = z.object({
  name: z.string().min(1).optional(),
  content: z.string().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ brandSlug: string; snippetId: string; variantId: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { brandSlug, snippetId, variantId } = await params;
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

    // Check if snippet exists and belongs to brand
    const snippet = await prisma.snippet.findFirst({
      where: {
        id: snippetId,
        brandId,
      },
    });

    if (!snippet) {
      return NextResponse.json({ error: "Snippet not found" }, { status: 404 });
    }

    // Check if variant exists
    const existing = await prisma.snippetVariant.findFirst({
      where: {
        id: variantId,
        snippetId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Variant not found" }, { status: 404 });
    }

    const body = await req.json();
    const data = updateVariantSchema.parse(body);

    // If name is being updated, check for conflicts
    if (data.name && data.name !== existing.name) {
      const conflict = await prisma.snippetVariant.findUnique({
        where: {
          snippetId_name: {
            snippetId,
            name: data.name,
          },
        },
      });

      if (conflict) {
        return NextResponse.json(
          { error: "A variant with this name already exists" },
          { status: 409 }
        );
      }
    }

    // Update variant
    const updateData: {
      name?: string;
      content?: string;
    } = {};
    if (data.name) updateData.name = data.name;
    if (data.content !== undefined) updateData.content = data.content;

    const variant = await prisma.snippetVariant.update({
      where: { id: variantId },
      data: updateData,
    });

    return NextResponse.json(variant);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating variant:", error);
    return NextResponse.json(
      { error: "Failed to update variant" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ brandSlug: string; snippetId: string; variantId: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { brandSlug, snippetId, variantId } = await params;
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

    // Check if snippet exists and belongs to brand
    const snippet = await prisma.snippet.findFirst({
      where: {
        id: snippetId,
        brandId,
      },
    });

    if (!snippet) {
      return NextResponse.json({ error: "Snippet not found" }, { status: 404 });
    }

    // Check if variant exists
    const existing = await prisma.snippetVariant.findFirst({
      where: {
        id: variantId,
        snippetId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Variant not found" }, { status: 404 });
    }

    // Delete variant
    await prisma.snippetVariant.delete({
      where: { id: variantId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting variant:", error);
    return NextResponse.json(
      { error: "Failed to delete variant" },
      { status: 500 }
    );
  }
}

