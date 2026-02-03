import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasBrandAccess } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getBrandIdFromSlug } from "@/lib/db/brand";
import { z } from "zod";

export const runtime = "nodejs";

const createSnippetSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  url: z.string().url().optional().or(z.literal("")),
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

    // Fetch all snippets with variants
    let snippets = await prisma.snippet.findMany({
      where: { brandId },
      include: {
        variants: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // If no snippets exist, create default placeholder snippets
    if (snippets.length === 0) {
      const defaultSnippets = [
        {
          name: "Terms and Conditions",
          slug: "terms-and-conditions",
          variantName: "Full",
          variantContent: "Your Terms and Conditions here",
        },
        {
          name: "Privacy",
          slug: "privacy",
          variantName: "Full",
          variantContent: "Your Privacy Policy here",
        },
      ];

      for (const snippetData of defaultSnippets) {
        // Check if snippet already exists (race condition protection)
        const existing = await prisma.snippet.findUnique({
          where: {
            brandId_slug: {
              brandId,
              slug: snippetData.slug,
            },
          },
        });

        if (!existing) {
          const snippet = await prisma.snippet.create({
            data: {
              brandId,
              name: snippetData.name,
              slug: snippetData.slug,
            },
          });

          // Create default variant with placeholder content
          await prisma.snippetVariant.create({
            data: {
              snippetId: snippet.id,
              name: snippetData.variantName,
              content: snippetData.variantContent,
            },
          });
        }
      }

      // Fetch snippets again after creating defaults
      snippets = await prisma.snippet.findMany({
        where: { brandId },
        include: {
          variants: {
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      });
    }

    return NextResponse.json(snippets);
  } catch (error) {
    console.error("Error fetching snippets:", error);
    return NextResponse.json(
      { error: "Failed to fetch snippets" },
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
    const data = createSnippetSchema.parse(body);

    // Check if slug already exists
    const existing = await prisma.snippet.findUnique({
      where: {
        brandId_slug: {
          brandId,
          slug: data.slug,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A snippet with this slug already exists" },
        { status: 409 }
      );
    }

    // Create snippet
    const snippet = await prisma.snippet.create({
      data: {
        brandId,
        name: data.name,
        slug: data.slug,
        url: data.url || null,
      },
      include: {
        variants: true,
      },
    });

    return NextResponse.json(snippet, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating snippet:", error);
    return NextResponse.json(
      { error: "Failed to create snippet" },
      { status: 500 }
    );
  }
}

