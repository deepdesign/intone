import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasBrandAccess } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getBrandIdFromSlug } from "@/lib/db/brand";
import { z } from "zod";

export const runtime = "nodejs";

const updateColorSchema = z.object({
  name: z.string().min(1).optional(),
  variant: z.string().min(1).optional(),
  hex: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color code").optional(),
  cmykC: z.number().int().min(0).max(100).optional().nullable(),
  cmykM: z.number().int().min(0).max(100).optional().nullable(),
  cmykY: z.number().int().min(0).max(100).optional().nullable(),
  cmykK: z.number().int().min(0).max(100).optional().nullable(),
  pantone: z.string().optional().nullable(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ brandSlug: string; colorId: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { brandSlug, colorId } = await params;
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

    const color = await prisma.brandColor.findFirst({
      where: {
        id: colorId,
        brandId,
      },
    });

    if (!color) {
      return NextResponse.json({ error: "Color not found" }, { status: 404 });
    }

    return NextResponse.json(color);
  } catch (error) {
    console.error("Error fetching color:", error);
    return NextResponse.json(
      { error: "Failed to fetch color" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ brandSlug: string; colorId: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { brandSlug, colorId } = await params;
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
    const data = updateColorSchema.parse(body);

    // Check if color exists
    const existing = await prisma.brandColor.findFirst({
      where: {
        id: colorId,
        brandId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Color not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.variant !== undefined) updateData.variant = data.variant;
    if (data.hex !== undefined) updateData.hex = data.hex;
    if (data.cmykC !== undefined) updateData.cmykC = data.cmykC;
    if (data.cmykM !== undefined) updateData.cmykM = data.cmykM;
    if (data.cmykY !== undefined) updateData.cmykY = data.cmykY;
    if (data.cmykK !== undefined) updateData.cmykK = data.cmykK;
    if (data.pantone !== undefined) updateData.pantone = data.pantone;

    const color = await prisma.brandColor.update({
      where: { id: colorId },
      data: updateData,
    });

    return NextResponse.json(color);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating color:", error);
    return NextResponse.json(
      { error: "Failed to update color" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ brandSlug: string; colorId: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { brandSlug, colorId } = await params;
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

    // Check if color exists
    const existing = await prisma.brandColor.findFirst({
      where: {
        id: colorId,
        brandId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Color not found" }, { status: 404 });
    }

    await prisma.brandColor.delete({
      where: { id: colorId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting color:", error);
    return NextResponse.json(
      { error: "Failed to delete color" },
      { status: 500 }
    );
  }
}

