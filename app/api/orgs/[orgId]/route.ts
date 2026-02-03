import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, hasOrgAccess } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const updateOrgSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId } = await params;

    const hasAccess = await hasOrgAccess(user.id, orgId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const org = await prisma.org.findUnique({
      where: { id: orgId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        brands: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            members: true,
            brands: true,
          },
        },
      },
    });

    if (!org) {
      return NextResponse.json({ error: "Organisation not found" }, { status: 404 });
    }

    return NextResponse.json(org);
  } catch (error) {
    console.error("Error fetching org:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId } = await params;

    const hasAccess = await hasOrgAccess(user.id, orgId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data = updateOrgSchema.parse(body);

    // Check if slug is taken (if updating slug)
    if (data.slug) {
      const existing = await prisma.org.findUnique({
        where: { slug: data.slug },
      });

      if (existing && existing.id !== orgId) {
        return NextResponse.json({ error: "Organisation slug already exists" }, { status: 409 });
      }
    }

    const org = await prisma.org.update({
      where: { id: orgId },
      data,
    });

    return NextResponse.json(org);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }
    console.error("Error updating org:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

