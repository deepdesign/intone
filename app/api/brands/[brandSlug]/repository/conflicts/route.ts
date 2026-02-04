import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasBrandAccess } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getBrandIdFromSlug } from "@/lib/db/brand";

export const runtime = "nodejs";

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

    const searchParams = req.nextUrl.searchParams;
    const resolved = searchParams.get("resolved");

    const where: {
      brandId: string;
      resolved?: boolean;
    } = { brandId };
    if (resolved !== null) {
      where.resolved = resolved === "true";
    }

    const conflicts = await prisma.repositoryConflict.findMany({
      where,
      include: {
        cluster: {
          include: {
            chunks: {
              where: {
                id: { in: [] }, // Will be populated below
              },
            },
          },
        },
      },
      orderBy: [
        { severity: "desc" },
        { createdAt: "desc" },
      ],
    });

    // Fetch chunk details for conflicts
    const conflictsWithChunks = await Promise.all(
      conflicts.map(async (conflict) => {
        const [chunk1, chunk2] = await Promise.all([
          prisma.repositoryChunk.findUnique({
            where: { id: conflict.chunkId1 },
          }),
          prisma.repositoryChunk.findUnique({
            where: { id: conflict.chunkId2 },
          }),
        ]);

        return {
          ...conflict,
          chunk1,
          chunk2,
        };
      })
    );

    return NextResponse.json({ conflicts: conflictsWithChunks });
  } catch (error) {
    console.error("Error fetching conflicts:", error);
    return NextResponse.json(
      { error: "Failed to fetch conflicts" },
      { status: 500 }
    );
  }
}

