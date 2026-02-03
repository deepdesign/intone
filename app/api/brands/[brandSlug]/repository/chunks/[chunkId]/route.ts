import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasBrandAccess } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getBrandIdFromSlug } from "@/lib/db/brand";
import { z } from "zod";

export const runtime = "nodejs";

const updateChunkSchema = z.object({
  status: z.enum(["INFERRED", "APPROVED", "DEPRECATED"]).optional(),
  category: z.string().optional(),
  intent: z.string().optional(),
  channel: z.string().optional(),
  toneTags: z.array(z.string()).optional(),
  locked: z.boolean().optional(),
  canonical: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ brandSlug: string; chunkId: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { brandSlug, chunkId } = await params;
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

    const chunk = await prisma.repositoryChunk.findFirst({
      where: {
        id: chunkId,
        brandId,
      },
      include: {
        cluster: {
          include: {
            chunks: {
              take: 10,
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    });

    if (!chunk) {
      return NextResponse.json({ error: "Chunk not found" }, { status: 404 });
    }

    return NextResponse.json(chunk);
  } catch (error) {
    console.error("Error fetching chunk:", error);
    return NextResponse.json(
      { error: "Failed to fetch chunk" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ brandSlug: string; chunkId: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { brandSlug, chunkId } = await params;
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
    const data = updateChunkSchema.parse(body);

    // Check if chunk exists and is not locked
    const existing = await prisma.repositoryChunk.findFirst({
      where: {
        id: chunkId,
        brandId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Chunk not found" }, { status: 404 });
    }

    if (existing.locked && data.status !== undefined) {
      return NextResponse.json(
        { error: "Cannot modify locked chunk" },
        { status: 403 }
      );
    }

    // Build update data
    const updateData: any = {};
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === "APPROVED") {
        updateData.approvedAt = new Date();
        updateData.approvedBy = user.id;
      } else if (data.status === "DEPRECATED") {
        updateData.deprecatedAt = new Date();
        updateData.deprecatedBy = user.id;
      }
    }
    if (data.category !== undefined) updateData.category = data.category;
    if (data.intent !== undefined) updateData.intent = data.intent;
    if (data.channel !== undefined) updateData.channel = data.channel;
    if (data.toneTags !== undefined) updateData.toneTags = data.toneTags;
    if (data.locked !== undefined) updateData.locked = data.locked;
    if (data.canonical !== undefined) {
      // Only approved chunks can be canonical
      if (data.canonical && existing.status !== "APPROVED") {
        return NextResponse.json(
          { error: "Only approved chunks can be canonical" },
          { status: 400 }
        );
      }
      updateData.canonical = data.canonical;
    }

    const updated = await prisma.repositoryChunk.update({
      where: { id: chunkId },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating chunk:", error);
    return NextResponse.json(
      { error: "Failed to update chunk" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ brandSlug: string; chunkId: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { brandSlug, chunkId } = await params;
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

    const existing = await prisma.repositoryChunk.findFirst({
      where: {
        id: chunkId,
        brandId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Chunk not found" }, { status: 404 });
    }

    if (existing.locked) {
      return NextResponse.json(
        { error: "Cannot delete locked chunk" },
        { status: 403 }
      );
    }

    await prisma.repositoryChunk.delete({
      where: { id: chunkId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting chunk:", error);
    return NextResponse.json(
      { error: "Failed to delete chunk" },
      { status: 500 }
    );
  }
}

