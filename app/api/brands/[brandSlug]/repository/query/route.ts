import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasBrandAccess } from "@/lib/auth";
import { getBrandIdFromSlug } from "@/lib/db/brand";
import { RepositoryQueryService } from "@/lib/repository/services/query-service";
import { z } from "zod";

export const runtime = "nodejs";

const querySchema = z.object({
  query: z.string().min(1),
  category: z.string().optional(),
  intent: z.string().optional(),
  channel: z.string().optional(),
  limit: z.number().int().min(1).max(20).optional(),
  minSimilarity: z.number().min(0).max(1).optional(),
});

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
    const data = querySchema.parse(body);

    const results = await RepositoryQueryService.querySimilar(
      brandId,
      data.query,
      {
        category: data.category,
        intent: data.intent,
        channel: data.channel,
        limit: data.limit,
        minSimilarity: data.minSimilarity,
      }
    );

    return NextResponse.json({ results });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error querying repository:", error);
    return NextResponse.json(
      { error: "Failed to query repository" },
      { status: 500 }
    );
  }
}

