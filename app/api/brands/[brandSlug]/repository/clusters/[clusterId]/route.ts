import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasBrandAccess } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getBrandIdFromSlug } from "@/lib/db/brand";
import { z } from "zod";

export const runtime = "nodejs";

const updateClusterSchema = z.object({
  canonicalChunkId: z.string().optional(),
  conceptSummary: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ brandSlug: string; clusterId: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { brandSlug, clusterId } = await params;
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

    const cluster = await prisma.repositoryCluster.findFirst({
      where: {
        id: clusterId,
        brandId,
      },
      include: {
        chunks: {
          orderBy: [
            { canonical: "desc" },
            { status: "desc" },
            { usageCount: "desc" },
          ],
        },
        conflicts: {
          where: { resolved: false },
        },
      },
    });

    if (!cluster) {
      return NextResponse.json({ error: "Cluster not found" }, { status: 404 });
    }

    return NextResponse.json(cluster);
  } catch (error) {
    console.error("Error fetching cluster:", error);
    return NextResponse.json(
      { error: "Failed to fetch cluster" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ brandSlug: string; clusterId: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { brandSlug, clusterId } = await params;
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
    const data = updateClusterSchema.parse(body);

    // Check if cluster exists
    const existing = await prisma.repositoryCluster.findFirst({
      where: {
        id: clusterId,
        brandId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Cluster not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (data.canonicalChunkId !== undefined) {
      // Verify chunk exists and is approved
      if (data.canonicalChunkId) {
        const chunk = await prisma.repositoryChunk.findFirst({
          where: {
            id: data.canonicalChunkId,
            clusterId,
            status: "APPROVED",
          },
        });

        if (!chunk) {
          return NextResponse.json(
            { error: "Chunk must be approved to be canonical" },
            { status: 400 }
          );
        }
      }

      updateData.canonicalChunkId = data.canonicalChunkId;

      // Update chunks: set canonical flag
      await prisma.repositoryChunk.updateMany({
        where: { clusterId },
        data: { canonical: false },
      });

      if (data.canonicalChunkId) {
        await prisma.repositoryChunk.update({
          where: { id: data.canonicalChunkId },
          data: { canonical: true },
        });
      }
    }
    if (data.conceptSummary !== undefined) {
      updateData.conceptSummary = data.conceptSummary;
    }

    const updated = await prisma.repositoryCluster.update({
      where: { id: clusterId },
      data: updateData,
      include: {
        chunks: {
          orderBy: [
            { canonical: "desc" },
            { status: "desc" },
            { usageCount: "desc" },
          ],
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating cluster:", error);
    return NextResponse.json(
      { error: "Failed to update cluster" },
      { status: 500 }
    );
  }
}

