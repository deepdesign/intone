import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasBrandAccess } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getBrandIdFromSlug } from "@/lib/db/brand";
import { z } from "zod";

export const runtime = "nodejs";

const createVariantSchema = z.object({
  name: z.string().min(1),
  content: z.string(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ brandSlug: string; snippetId: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { brandSlug, snippetId } = await params;
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

    const body = await req.json();
    const data = createVariantSchema.parse(body);

    // Check if variant name already exists for this snippet
    const existing = await prisma.snippetVariant.findUnique({
      where: {
        snippetId_name: {
          snippetId,
          name: data.name,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A variant with this name already exists" },
        { status: 409 }
      );
    }

    // Create variant
    const variant = await prisma.snippetVariant.create({
      data: {
        snippetId,
        name: data.name,
        content: data.content,
      },
    });

    return NextResponse.json(variant, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating variant:", error);
    return NextResponse.json(
      { error: "Failed to create variant" },
      { status: 500 }
    );
  }
}

