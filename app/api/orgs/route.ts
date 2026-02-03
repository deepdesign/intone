import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Use Node.js runtime for Prisma adapter
export const runtime = "nodejs";

const createOrgSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
});

export async function POST(req: NextRequest) {
  try {
    console.log("POST /api/orgs - Starting request");
    console.log("POST /api/orgs - Request headers:", {
      cookie: req.headers.get("cookie") ? "Present" : "Missing",
      authorization: req.headers.get("authorization") ? "Present" : "Missing",
    });
    const user = await getCurrentUser(req);
    console.log("POST /api/orgs - User:", user ? `Found user ${user.id}` : "No user");
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
      console.log("POST /api/orgs - Request body:", body);
    } catch (error) {
      console.error("POST /api/orgs - Invalid JSON:", error);
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    // Validate input
    let validatedData;
    try {
      validatedData = createOrgSchema.parse(body);
      console.log("POST /api/orgs - Validated data:", validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("POST /api/orgs - Validation error:", error.issues);
        return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
      }
      throw error;
    }

    const { name, slug } = validatedData;

    // Ensure slug is not empty
    if (!slug || slug.trim().length === 0) {
      console.error("POST /api/orgs - Empty slug");
      return NextResponse.json({ error: "Slug cannot be empty" }, { status: 400 });
    }

    // Check if slug is taken
    const existing = await prisma.org.findUnique({
      where: { slug },
    });

    if (existing) {
      console.log("POST /api/orgs - Slug already exists:", slug);
      return NextResponse.json({ error: "Organisation slug already exists" }, { status: 409 });
    }

    // Create org and add user as owner
    console.log("POST /api/orgs - Creating org with:", { name, slug, userId: user.id });
    const org = await prisma.org.create({
      data: {
        name,
        slug,
        members: {
          create: {
            userId: user.id,
            role: "owner",
          },
        },
      },
    });

    console.log("POST /api/orgs - Org created successfully:", org.id);
    return NextResponse.json(org, { status: 201 });
  } catch (error) {
    console.error("POST /api/orgs - Error creating org:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }
    
    // Always return JSON, even for unexpected errors
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error("POST /api/orgs - Full error:", {
      message: errorMessage,
      stack: errorStack,
    });
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        ...(process.env.NODE_ENV === "development" && errorStack ? { stack: errorStack } : {})
      }, 
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    console.log("GET /api/orgs - Starting request");
    const user = await getCurrentUser(req);
    console.log("GET /api/orgs - User:", user ? `Found user ${user.id}` : "No user");
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("GET /api/orgs - Querying database for orgs");
    
    // First, get the member records to find org IDs
    const memberships = await prisma.member.findMany({
      where: {
        userId: user.id,
      },
      select: {
        orgId: true,
      },
    });
    
    const orgIds = memberships.map((m) => m.orgId);
    console.log("GET /api/orgs - Found org IDs:", orgIds);
    
    if (orgIds.length === 0) {
      console.log("GET /api/orgs - No orgs found for user");
      return NextResponse.json([]);
    }
    
    // Then fetch orgs with their data
    const orgs = await prisma.org.findMany({
      where: {
        id: {
          in: orgIds,
        },
      },
      include: {
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
          },
        },
      },
    });

    console.log("GET /api/orgs - Found orgs:", orgs.length);
    return NextResponse.json(orgs);
  } catch (error) {
    console.error("GET /api/orgs - Error fetching orgs:", error);
    
    // Always return JSON, even for unexpected errors
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error("GET /api/orgs - Full error:", {
      message: errorMessage,
      stack: errorStack,
      errorType: error?.constructor?.name,
    });
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        ...(process.env.NODE_ENV === "development" && errorStack ? { stack: errorStack } : {})
      }, 
      { status: 500 }
    );
  }
}
