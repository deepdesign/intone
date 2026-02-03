import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasBrandAccess } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getBrandIdFromSlug } from "@/lib/db/brand";
import { z } from "zod";

export const runtime = "nodejs";

const updateFontSchema = z.object({
  name: z.string().min(1).optional(),
  variant: z.string().min(1).optional(),
  downloadUrl: z.string().url().optional().nullable().or(z.literal("")),
  fileUrl: z.string().optional().nullable(),
  fileType: z.string().optional().nullable(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ brandSlug: string; fontId: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { brandSlug, fontId } = await params;
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

    const font = await prisma.brandFont.findFirst({
      where: {
        id: fontId,
        brandId,
      },
    });

    if (!font) {
      return NextResponse.json({ error: "Font not found" }, { status: 404 });
    }

    return NextResponse.json(font);
  } catch (error) {
    console.error("Error fetching font:", error);
    return NextResponse.json(
      { error: "Failed to fetch font" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ brandSlug: string; fontId: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { brandSlug, fontId } = await params;
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
    const data = updateFontSchema.parse(body);

    // Check if font exists
    const existing = await prisma.brandFont.findFirst({
      where: {
        id: fontId,
        brandId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Font not found" }, { status: 404 });
    }

    // At least one URL must be provided
    const downloadUrl = data.downloadUrl === "" ? null : (data.downloadUrl ?? existing.downloadUrl);
    const fileUrl = data.fileUrl ?? existing.fileUrl;
    if (!downloadUrl && !fileUrl) {
      return NextResponse.json(
        { error: "Either downloadUrl or fileUrl must be provided" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.variant !== undefined) updateData.variant = data.variant;
    if (data.downloadUrl !== undefined) updateData.downloadUrl = downloadUrl;
    if (data.fileUrl !== undefined) updateData.fileUrl = data.fileUrl;
    if (data.fileType !== undefined) updateData.fileType = data.fileType;

    const font = await prisma.brandFont.update({
      where: { id: fontId },
      data: updateData,
    });

    return NextResponse.json(font);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating font:", error);
    return NextResponse.json(
      { error: "Failed to update font" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ brandSlug: string; fontId: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { brandSlug, fontId } = await params;
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

    // Check if font exists
    const existing = await prisma.brandFont.findFirst({
      where: {
        id: fontId,
        brandId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Font not found" }, { status: 404 });
    }

    // TODO: Delete file if fileUrl is local
    // if (existing.fileUrl && existing.fileUrl.startsWith("/uploads/")) {
    //   await deleteFile(existing.fileUrl);
    // }

    await prisma.brandFont.delete({
      where: { id: fontId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting font:", error);
    return NextResponse.json(
      { error: "Failed to delete font" },
      { status: 500 }
    );
  }
}

