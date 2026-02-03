import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasBrandAccess } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getBrandIdFromSlug } from "@/lib/db/brand";
import { z } from "zod";

export const runtime = "nodejs";

const createLogoSchema = z.object({
  name: z.string().min(1),
  variant: z.string().min(1),
  format: z.enum(["SVG", "PNG"]),
  usage: z.enum(["print", "web"]),
  fileUrl: z.string().min(1),
  fileSize: z.number().int().optional(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
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

    // Check brand access
    const hasAccess = await hasBrandAccess(user.id, brandId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const logos = await prisma.brandLogo.findMany({
      where: { brandId },
      orderBy: [{ format: "asc" }, { usage: "asc" }, { variant: "asc" }],
    });

    return NextResponse.json(logos);
  } catch (error) {
    console.error("Error fetching logos:", error);
    return NextResponse.json(
      { error: "Failed to fetch logos" },
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
    const data = createLogoSchema.parse(body);

    const logo = await prisma.brandLogo.create({
      data: {
        brandId,
        name: data.name,
        variant: data.variant,
        format: data.format,
        usage: data.usage,
        fileUrl: data.fileUrl,
        fileSize: data.fileSize || null,
        width: data.width || null,
        height: data.height || null,
      },
    });

    return NextResponse.json(logo, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating logo:", error);
    return NextResponse.json(
      { error: "Failed to create logo" },
      { status: 500 }
    );
  }
}

