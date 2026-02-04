import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, hasBrandAccess } from "@/lib/auth";
import { getBrandIdFromSlug } from "@/lib/db/brand";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ brandSlug: string; sessionId: string }>;
  }
) {
  try {
    const { brandSlug, sessionId } = await params;
    const user = await getCurrentUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userOrgIds = user.memberships?.map((m: { orgId: string }) => m.orgId) || [];
    const brandId = await getBrandIdFromSlug(brandSlug, userOrgIds);

    if (!brandId) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    if (!(await hasBrandAccess(user.id, brandId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const session = await prisma.learnSession.findUnique({
      where: { id: sessionId },
      include: {
        discoveredRules: {
          orderBy: { confidence: "desc" },
        },
        _count: {
          select: { discoveredRules: true },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.brandId !== brandId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      id: session.id,
      status: session.status,
      sourceType: session.sourceType,
      sourceUrl: session.sourceUrl,
      fileName: session.fileName,
      totalPages: session.totalPages,
      rulesDiscovered: session.rulesDiscovered,
      discoveredRules: session.discoveredRules,
      createdAt: session.createdAt,
      completedAt: session.completedAt,
    });
  } catch (error) {
    console.error("Error fetching learn session:", error);
    return NextResponse.json(
      { error: "Failed to fetch learn session" },
      { status: 500 }
    );
  }
}

