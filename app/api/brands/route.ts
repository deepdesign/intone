import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Use Node.js runtime for Prisma adapter
export const runtime = "nodejs";

// Lazy load to avoid module initialization errors
async function getAuth() {
  const { getCurrentUser, hasOrgAccess } = await import("@/lib/auth");
  return { getCurrentUser, hasOrgAccess };
}

async function getDb() {
  const { prisma } = await import("@/lib/db");
  return prisma;
}

const createBrandSchema = z.object({
  orgId: z.string(),
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  locale: z.string().default("en-GB"),
  template: z.enum(["product-ui", "marketing", "support"]).default("product-ui"),
});

export async function POST(req: NextRequest) {
  try {
    const { getCurrentUser, hasOrgAccess } = await getAuth();
    const prisma = await getDb();
    
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { orgId, name, slug, locale, template } = createBrandSchema.parse(body);

    // Check access
    const hasAccess = await hasOrgAccess(user.id, orgId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if slug is taken in org
    const existing = await prisma.brand.findUnique({
      where: {
        orgId_slug: {
          orgId,
          slug,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Brand slug already exists in this organisation" }, { status: 409 });
    }

    // Create brand
    const brand = await prisma.brand.create({
      data: {
        orgId,
        name,
        slug,
        locale,
        template,
      },
    });

    // Create initial rule set version
    await prisma.ruleSetVersion.create({
      data: {
        brandId: brand.id,
        version: 1,
        createdBy: user.id,
        summary: "Initial brand setup",
      },
    });

    return NextResponse.json(brand, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }
    console.error("Error creating brand:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: process.env.NODE_ENV === "development" ? errorMessage : undefined
      }, 
      { 
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    console.log("GET /api/brands - Starting request");
    
    let getCurrentUser;
    let prisma;
    try {
      const auth = await getAuth();
      getCurrentUser = auth.getCurrentUser;
      prisma = await getDb();
    } catch (importError) {
      console.error("GET /api/brands - Module import error:", importError);
      return NextResponse.json(
        { 
          error: "Module initialization failed",
          message: process.env.NODE_ENV === "development" 
            ? (importError instanceof Error ? importError.message : "Unknown error")
            : undefined
        }, 
        { 
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
    
    let user;
    try {
      user = await getCurrentUser(req);
      console.log("GET /api/brands - User:", user ? `Found user ${user.id}` : "No user");
    } catch (authError) {
      console.error("GET /api/brands - Auth error:", authError);
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
    }
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let searchParams;
    try {
      const url = new URL(req.url);
      searchParams = url.searchParams;
    } catch (urlError) {
      console.error("GET /api/brands - URL parsing error:", urlError);
      return NextResponse.json({ error: "Invalid request URL" }, { status: 400 });
    }

    const orgId = searchParams.get("orgId");
    console.log("GET /api/brands - OrgId filter:", orgId || "none");

    console.log("GET /api/brands - Querying database for brands");
    let brands;
    try {
      brands = await prisma.brand.findMany({
        where: orgId
          ? {
              orgId,
              org: {
                members: {
                  some: {
                    userId: user.id,
                  },
                },
              },
            }
          : {
              org: {
                members: {
                  some: {
                    userId: user.id,
                  },
                },
              },
            },
        include: {
          org: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });
    } catch (dbError) {
      console.error("GET /api/brands - Database error:", dbError);
      const dbErrorMessage = dbError instanceof Error ? dbError.message : "Database query failed";
      const dbErrorStack = dbError instanceof Error ? dbError.stack : undefined;
      console.error("GET /api/brands - Database error details:", {
        message: dbErrorMessage,
        stack: dbErrorStack,
        errorType: dbError?.constructor?.name,
      });
      return NextResponse.json(
        { 
          error: "Database error",
          message: process.env.NODE_ENV === "development" ? dbErrorMessage : undefined,
          ...(process.env.NODE_ENV === "development" && dbErrorStack ? { stack: dbErrorStack } : {})
        }, 
        { status: 500 }
      );
    }

    console.log("GET /api/brands - Found brands:", brands.length);
    return NextResponse.json(brands, {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("GET /api/brands - Unexpected error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error("GET /api/brands - Full error:", {
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
      { 
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
