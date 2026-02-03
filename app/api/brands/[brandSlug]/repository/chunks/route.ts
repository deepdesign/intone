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

    const hasAccess = await hasBrandAccess(user.id, brandId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse query params
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const intent = searchParams.get("intent");
    const channel = searchParams.get("channel");
    const source = searchParams.get("source");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build where clause
    const where: any = { brandId };
    if (status) where.status = status;
    if (category) where.category = category;
    if (intent) where.intent = intent;
    if (channel) where.channel = channel;
    if (source) where.source = source;
    if (search) {
      where.OR = [
        { text: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }

    // Build orderBy
    const orderBy: any = {};
    if (sortBy === "usageCount") {
      orderBy.usageCount = sortOrder;
    } else if (sortBy === "lastUsedAt") {
      orderBy.lastUsedAt = sortOrder;
    } else if (sortBy === "confidenceScore") {
      orderBy.confidenceScore = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    const [chunks, total] = await Promise.all([
      prisma.repositoryChunk.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
        select: {
          id: true,
          text: true,
          category: true,
          subCategory: true,
          channel: true,
          intent: true,
          toneTags: true,
          status: true,
          source: true,
          canonical: true,
          usageCount: true,
          lastUsedAt: true,
          confidenceScore: true,
          createdAt: true,
          clusterId: true,
        },
      }),
      prisma.repositoryChunk.count({ where }),
    ]);

    return NextResponse.json({
      chunks,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching chunks:", error);
    return NextResponse.json(
      { error: "Failed to fetch chunks" },
      { status: 500 }
    );
  }
}

