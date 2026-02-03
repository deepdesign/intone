import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasBrandAccess } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getBrandIdFromSlug } from "@/lib/db/brand";
import { z } from "zod";

// Use Node.js runtime for Prisma adapter
export const runtime = "nodejs";

const updateBrandSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  locale: z.string().optional(),
});

export async function GET(
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

    const hasAccess = await hasBrandAccess(user.id, brandId, userOrgIds);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      include: {
        org: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    return NextResponse.json(brand);
  } catch (error) {
    console.error("Error fetching brand:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
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

    const hasAccess = await hasBrandAccess(user.id, brandId, userOrgIds);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data = updateBrandSchema.parse(body);

    const brand = await prisma.brand.update({
      where: { id: brandId },
      data,
    });

    return NextResponse.json(brand);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }
    console.error("Error updating brand:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
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

    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      include: {
        org: {
          include: {
            members: {
              where: {
                userId: user.id,
                role: "owner",
              },
            },
          },
        },
      },
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    if (brand.org.members.length === 0) {
      return NextResponse.json({ error: "Only org owners can delete brands" }, { status: 403 });
    }

    await prisma.brand.delete({
      where: { id: brandId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting brand:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
