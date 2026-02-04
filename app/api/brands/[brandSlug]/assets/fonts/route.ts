import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasBrandAccess } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getBrandIdFromSlug } from "@/lib/db/brand";
import { z } from "zod";

export const runtime = "nodejs";

const createFontSchema = z.object({
  name: z.string().min(1),
  variant: z.string().min(1),
  downloadUrl: z.string().url().optional().or(z.literal("")),
  fileUrl: z.string().optional(),
  fileType: z.string().optional(),
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
    const userOrgIds = user.memberships?.map((m: { orgId: string }) => m.orgId) || [];
    const brandId = await getBrandIdFromSlug(brandSlug, userOrgIds);

    if (!brandId) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Check brand access
    const hasAccess = await hasBrandAccess(user.id, brandId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const fonts = await prisma.brandFont.findMany({
      where: { brandId },
      orderBy: [{ variant: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(fonts);
  } catch (error) {
    console.error("Error fetching fonts:", error);
    return NextResponse.json(
      { error: "Failed to fetch fonts" },
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
    const userOrgIds = user.memberships?.map((m: { orgId: string }) => m.orgId) || [];
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
    const data = createFontSchema.parse(body);

    // At least one URL must be provided
    if (!data.downloadUrl && !data.fileUrl) {
      return NextResponse.json(
        { error: "Either downloadUrl or fileUrl must be provided" },
        { status: 400 }
      );
    }

    const font = await prisma.brandFont.create({
      data: {
        brandId,
        name: data.name,
        variant: data.variant,
        downloadUrl: data.downloadUrl || null,
        fileUrl: data.fileUrl || null,
        fileType: data.fileType || null,
      },
    });

    return NextResponse.json(font, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating font:", error);
    return NextResponse.json(
      { error: "Failed to create font" },
      { status: 500 }
    );
  }
}

