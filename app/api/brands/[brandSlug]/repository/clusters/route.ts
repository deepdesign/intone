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

    const clusters = await prisma.repositoryCluster.findMany({
      where: { brandId },
      include: {
        chunks: {
          orderBy: [
            { canonical: "desc" },
            { status: "desc" },
            { usageCount: "desc" },
          ],
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ clusters });
  } catch (error) {
    console.error("Error fetching clusters:", error);
    return NextResponse.json(
      { error: "Failed to fetch clusters" },
      { status: 500 }
    );
  }
}

