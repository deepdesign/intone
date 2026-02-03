import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasBrandAccess } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getBrandIdFromSlug } from "@/lib/db/brand";
import { z } from "zod";
import { RuleType, RuleStatus, RuleScope, RuleSeverity, EnforcementLevel } from "@/lib/rules/types";

// Use Node.js runtime for Prisma adapter
export const runtime = "nodejs";

const createRuleSchema = z.object({
  name: z.string().min(1),
  type: z.nativeEnum(RuleType),
  description: z.string().min(1),
  status: z.nativeEnum(RuleStatus).optional(),
  scope: z.nativeEnum(RuleScope).optional(),
  surfaces: z.array(z.string()).optional(),
  channels: z.array(z.string()).optional(),
  components: z.array(z.string()).optional(),
  locales: z.array(z.string()).optional(),
  severity: z.nativeEnum(RuleSeverity).optional(),
  enforcement: z.nativeEnum(EnforcementLevel).optional(),
  rationale: z.string().optional(),
  examples: z.object({
    do: z.array(z.string()),
    dont: z.array(z.string()),
  }).optional(),
  suggestions: z.array(z.string()).optional(),
  exceptions: z.array(z.string()).optional(),
  detectors: z.array(z.any()).optional(),
  findingTemplate: z.string().optional(),
  rewriteTemplate: z.string().optional(),
  // Legacy fields for backward compatibility
  key: z.string().optional(),
  category: z.string().optional(),
  controlType: z.string().optional(),
  value: z.any().optional(),
  priority: z.number().optional(),
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
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const scope = searchParams.get("scope");
    const surface = searchParams.get("surface");
    const severity = searchParams.get("severity");
    const category = searchParams.get("category"); // Legacy support
    const key = searchParams.get("key"); // Fetch single rule by key

    // OPTIMIZATION: Extract org IDs from user object (already loaded)
    const userOrgIds = user.memberships?.map((m) => m.orgId) || [];
    const brandId = await getBrandIdFromSlug(brandSlug, userOrgIds);

    if (!brandId) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const hasAccess = await hasBrandAccess(user.id, brandId, userOrgIds);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // If key is provided, fetch only that rule (optimized - only select needed fields)
    if (key) {
      const rule = await prisma.rule.findFirst({
        where: {
          brandId,
          key: decodeURIComponent(key),
        },
        select: {
          id: true,
          key: true,
          value: true,
          status: true,
          category: true,
          controlType: true,
          // Only select fields actually used by the client
        },
      });

      if (!rule) {
        return NextResponse.json(null);
      }

      return NextResponse.json(rule);
    }

    // Build where clause
    const where: any = {
      brandId,
    };

    if (type) {
      where.type = type;
    }

    if (status) {
      // If status is explicitly set (including empty string), use it
      // Empty string means fetch all statuses
      if (status === "") {
        // Don't filter by status - fetch all
      } else {
        where.status = status;
      }
    } else {
      // Default to active rules only
      where.status = "ACTIVE";
    }

    if (scope) {
      where.scope = scope;
    }

    if (severity) {
      where.severity = severity;
    }

    if (surface) {
      where.surfaces = {
        has: surface,
      };
    }

    // Legacy category support
    if (category) {
      where.category = category;
    }

    // If only counting is needed (no filters except status), return minimal data
    const needsFullData = type || scope || surface || severity || category;
    
    const rules = await prisma.rule.findMany({
      where,
      select: needsFullData ? undefined : {
        // Only return fields needed for counting/overview
        id: true,
        key: true,
        category: true,
        status: true,
        name: true,
      },
      orderBy: [
        { priority: "asc" },
        { name: "asc" },
      ],
    });

    return NextResponse.json(rules);
  } catch (error) {
    console.error("Error fetching rules:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      {
        error: "Internal server error",
        message: process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
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

    // OPTIMIZATION: Extract org IDs from user object (already loaded)
    const userOrgIds = user.memberships?.map((m) => m.orgId) || [];
    const brandId = await getBrandIdFromSlug(brandSlug, userOrgIds);

    if (!brandId) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const hasAccess = await hasBrandAccess(user.id, brandId, userOrgIds);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data = createRuleSchema.parse(body);

    // Get brand to get default locale
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Create new rule
    const rule = await prisma.rule.create({
      data: {
        brandId,
        name: data.name,
        type: data.type,
        status: data.status || RuleStatus.ACTIVE,
        scope: data.scope || RuleScope.GLOBAL,
        surfaces: data.surfaces || [],
        channels: data.channels || [],
        components: data.components || [],
        locales: data.locales || [brand.locale || "en-GB"],
        severity: data.severity || RuleSeverity.MINOR,
        enforcement: data.enforcement || EnforcementLevel.WARN,
        description: data.description,
        rationale: data.rationale,
        examples: data.examples,
        suggestions: data.suggestions || [],
        exceptions: data.exceptions || [],
        detectors: data.detectors,
        findingTemplate: data.findingTemplate,
        rewriteTemplate: data.rewriteTemplate,
        version: 1,
        createdBy: user.id,
        owners: [],
        // Legacy fields
        key: data.key,
        category: data.category,
        controlType: data.controlType,
        value: data.value,
        priority: data.priority || 0,
        source: "manual",
      },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }
    console.error("Error creating rule:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      {
        error: "Internal server error",
        message: process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
