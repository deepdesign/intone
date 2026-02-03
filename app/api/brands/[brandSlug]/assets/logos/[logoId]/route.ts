import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasBrandAccess } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getBrandIdFromSlug } from "@/lib/db/brand";
import { z } from "zod";

export const runtime = "nodejs";

const updateLogoSchema = z.object({
  name: z.string().min(1).optional(),
  variant: z.string().min(1).optional(),
  format: z.enum(["SVG", "PNG"]).optional(),
  usage: z.enum(["print", "web"]).optional(),
  fileUrl: z.string().min(1).optional(),
  fileSize: z.number().int().optional().nullable(),
  width: z.number().int().optional().nullable(),
  height: z.number().int().optional().nullable(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ brandSlug: string; logoId: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { brandSlug, logoId } = await params;
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

    const logo = await prisma.brandLogo.findFirst({
      where: {
        id: logoId,
        brandId,
      },
    });

    if (!logo) {
      return NextResponse.json({ error: "Logo not found" }, { status: 404 });
    }

    return NextResponse.json(logo);
  } catch (error) {
    console.error("Error fetching logo:", error);
    return NextResponse.json(
      { error: "Failed to fetch logo" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ brandSlug: string; logoId: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { brandSlug, logoId } = await params;
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
    const data = updateLogoSchema.parse(body);

    // Check if logo exists
    const existing = await prisma.brandLogo.findFirst({
      where: {
        id: logoId,
        brandId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Logo not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.variant !== undefined) updateData.variant = data.variant;
    if (data.format !== undefined) updateData.format = data.format;
    if (data.usage !== undefined) updateData.usage = data.usage;
    if (data.fileUrl !== undefined) updateData.fileUrl = data.fileUrl;
    if (data.fileSize !== undefined) updateData.fileSize = data.fileSize;
    if (data.width !== undefined) updateData.width = data.width;
    if (data.height !== undefined) updateData.height = data.height;

    const logo = await prisma.brandLogo.update({
      where: { id: logoId },
      data: updateData,
    });

    return NextResponse.json(logo);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating logo:", error);
    return NextResponse.json(
      { error: "Failed to update logo" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ brandSlug: string; logoId: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { brandSlug, logoId } = await params;
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

    // Check if logo exists
    const existing = await prisma.brandLogo.findFirst({
      where: {
        id: logoId,
        brandId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Logo not found" }, { status: 404 });
    }

    // TODO: Delete file if fileUrl is local
    // if (existing.fileUrl.startsWith("/uploads/")) {
    //   await deleteFile(existing.fileUrl);
    // }

    await prisma.brandLogo.delete({
      where: { id: logoId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting logo:", error);
    return NextResponse.json(
      { error: "Failed to delete logo" },
      { status: 500 }
    );
  }
}

