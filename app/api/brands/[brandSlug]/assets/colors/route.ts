import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasBrandAccess } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getBrandIdFromSlug } from "@/lib/db/brand";
import { z } from "zod";

export const runtime = "nodejs";

const createColorSchema = z.object({
  name: z.string().min(1),
  variant: z.string().min(1),
  hex: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color code"),
  cmykC: z.number().int().min(0).max(100).optional(),
  cmykM: z.number().int().min(0).max(100).optional(),
  cmykY: z.number().int().min(0).max(100).optional(),
  cmykK: z.number().int().min(0).max(100).optional(),
  pantone: z.string().optional(),
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

    const colors = await prisma.brandColor.findMany({
      where: { brandId },
      orderBy: [{ variant: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(colors);
  } catch (error) {
    console.error("Error fetching colors:", error);
    return NextResponse.json(
      { error: "Failed to fetch colors" },
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
    const data = createColorSchema.parse(body);

    const color = await prisma.brandColor.create({
      data: {
        brandId,
        name: data.name,
        variant: data.variant,
        hex: data.hex,
        cmykC: data.cmykC ?? null,
        cmykM: data.cmykM ?? null,
        cmykY: data.cmykY ?? null,
        cmykK: data.cmykK ?? null,
        pantone: data.pantone || null,
      },
    });

    return NextResponse.json(color, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating color:", error);
    return NextResponse.json(
      { error: "Failed to create color" },
      { status: 500 }
    );
  }
}

