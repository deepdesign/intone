import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasBrandAccess } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getBrandIdFromSlug } from "@/lib/db/brand";
import { z } from "zod";

export const runtime = "nodejs";

const updateSnippetSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  url: z.string().url().optional().or(z.literal("")),
});

export async function GET(
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

    // Fetch snippet with variants
    const snippet = await prisma.snippet.findFirst({
      where: {
        id: snippetId,
        brandId,
      },
      include: {
        variants: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!snippet) {
      return NextResponse.json({ error: "Snippet not found" }, { status: 404 });
    }

    return NextResponse.json(snippet);
  } catch (error) {
    console.error("Error fetching snippet:", error);
    return NextResponse.json(
      { error: "Failed to fetch snippet" },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const body = await req.json();
    const data = updateSnippetSchema.parse(body);

    // Check if snippet exists
    const existing = await prisma.snippet.findFirst({
      where: {
        id: snippetId,
        brandId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Snippet not found" }, { status: 404 });
    }

    // If slug is being updated, check for conflicts
    if (data.slug && data.slug !== existing.slug) {
      const conflict = await prisma.snippet.findUnique({
        where: {
          brandId_slug: {
            brandId,
            slug: data.slug,
          },
        },
      });

      if (conflict) {
        return NextResponse.json(
          { error: "A snippet with this slug already exists" },
          { status: 409 }
        );
      }
    }

    // Update snippet
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.slug) updateData.slug = data.slug;
    if (data.url !== undefined) updateData.url = data.url || null;

    const snippet = await prisma.snippet.update({
      where: { id: snippetId },
      data: updateData,
      include: {
        variants: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return NextResponse.json(snippet);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating snippet:", error);
    return NextResponse.json(
      { error: "Failed to update snippet" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Check if snippet exists
    const existing = await prisma.snippet.findFirst({
      where: {
        id: snippetId,
        brandId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Snippet not found" }, { status: 404 });
    }

    // Delete snippet (variants will be cascade deleted)
    await prisma.snippet.delete({
      where: { id: snippetId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting snippet:", error);
    return NextResponse.json(
      { error: "Failed to delete snippet" },
      { status: 500 }
    );
  }
}

