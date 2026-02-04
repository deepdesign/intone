import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasBrandAccess } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getBrandIdFromSlug } from "@/lib/db/brand";
import { z } from "zod";

// Use Node.js runtime for Prisma adapter
export const runtime = "nodejs";

const saveOnboardingProgressSchema = z.object({
  step: z.string(),
  values: z.record(z.string(), z.any()),
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
    const userOrgIds = user.memberships?.map((m: { orgId: string }) => m.orgId) || [];
    const brandId = await getBrandIdFromSlug(brandSlug, userOrgIds);

    if (!brandId) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const hasAccess = await hasBrandAccess(user.id, brandId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { step, values } = saveOnboardingProgressSchema.parse(body);

    // Get brand to get default locale
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Map of tone rule keys to their metadata
    const toneRuleMetadata: Record<string, { name: string; description: string; controlType: string; surfaces: string[] }> = {
      "tone.locale": {
        name: "Language and Locale",
        description: "Sets the default language and regional variant.",
        controlType: "select",
        surfaces: ["ui", "marketing", "support", "internal"],
      },
      "tone.formality": {
        name: "Formality",
        description: "How formal should your brand sound?",
        controlType: "slider",
        surfaces: ["ui", "marketing", "support", "internal"],
      },
      "tone.confidence": {
        name: "Confidence",
        description: "How confidently should your brand speak?",
        controlType: "slider",
        surfaces: ["ui", "marketing", "support", "internal"],
      },
      "tone.directness": {
        name: "Directness",
        description: "How directly should your brand communicate?",
        controlType: "slider",
        surfaces: ["ui", "marketing", "support", "internal"],
      },
      "tone.enthusiasm": {
        name: "Enthusiasm",
        description: "How enthusiastic should your brand sound?",
        controlType: "slider",
        surfaces: ["ui", "marketing", "support", "internal"],
      },
      "tone.humour": {
        name: "Humour",
        description: "Should your brand use humour?",
        controlType: "slider",
        surfaces: ["ui", "marketing", "support", "internal"],
      },
      "tone.empathy": {
        name: "Empathy",
        description: "Should your brand use empathetic phrasing?",
        controlType: "slider",
        surfaces: ["ui", "marketing", "support", "internal"],
      },
      "tone.custom_variant": {
        name: "Custom Tone Variant",
        description: "Specific tone characteristics unique to your brand.",
        controlType: "textarea",
        surfaces: ["ui", "marketing", "support", "internal"],
      },
    };

    // Get the keys that match the current step
    const stepPrefix = step === "personality" ? "tone.personality" : step === "sentence-behavior" ? "tone.sentence" : step === "ui-specific" ? "tone.ui" : `tone.${step}`;
    
    // Process all values that match the step prefix or are tone values
    const processedKeys: string[] = [];
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined || value === null) continue;
      
      // Check if this key matches the step or is a tone key
      if (!key.startsWith("tone.")) continue;
      if (step !== "summary" && !key.startsWith(stepPrefix)) continue;

      try {
        const metadata = toneRuleMetadata[key] || {
          name: key.split(".").pop()?.replace(/-/g, " ") || "Tone Rule",
          description: `Tone setting for ${key}`,
          controlType: "slider",
          surfaces: ["ui", "marketing", "support", "internal"],
        };

        // Determine severity (tone rules are typically MINOR)
        const severity: "CRITICAL" | "MAJOR" | "MINOR" | "INFO" = "MINOR";
        const enforcement: "BLOCK" | "WARN" | "SUGGEST" = "WARN";

        // Build detectors
        const detectors: Array<{ kind: string; pattern: string }> = [];
        if (metadata.controlType === "toggle" || metadata.controlType === "list" || metadata.controlType === "slider" || metadata.controlType === "textarea") {
          detectors.push({ kind: "STYLE_CHECK", pattern: key });
        }

        // Check if rule already exists
        const existing = await prisma.rule.findFirst({
          where: {
            brandId,
            key: key,
          },
        });

        // Ensure value is JSON-serializable (Prisma Json type accepts any JSON value)
        // For numbers, strings, booleans, arrays, objects - Prisma handles conversion
        const jsonValue = value;

        if (existing) {
          // Update existing rule
          await prisma.rule.update({
            where: { id: existing.id },
            data: {
              status: "ACTIVE",
              value: jsonValue,
              surfaces: metadata.surfaces,
              locales: [brand.locale || "en-GB"],
            },
          });
        } else {
          // Create new rule
          await prisma.rule.create({
            data: {
              brandId,
              name: metadata.name,
              type: "TONE_VOICE",
              status: "ACTIVE",
              scope: "GLOBAL",
              surfaces: metadata.surfaces,
              channels: [],
              components: [],
              locales: [brand.locale || "en-GB"],
              severity: severity,
              enforcement: enforcement,
              description: metadata.description,
              examples: undefined,
              suggestions: [],
              exceptions: [],
              detectors: detectors.length > 0 ? detectors : undefined,
              version: 1,
              createdBy: user.id,
              owners: [],
              // Legacy fields
              key: key,
              category: "tone",
              controlType: metadata.controlType,
              value: jsonValue,
              priority: 0,
              source: "template",
            },
          });
        }
        processedKeys.push(key);
      } catch (ruleError) {
        console.error(`Error processing rule ${key}:`, ruleError);
        // Continue processing other rules even if one fails
      }
    }

    if (processedKeys.length === 0 && step === "summary") {
      // If we're on summary step and no rules were processed, that's okay - values might already be saved
      console.log("No new rules to process on summary step - values may already be saved");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: (error as z.ZodError).issues }, { status: 400 });
    }
    console.error("Error saving onboarding progress:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error stack:", errorStack);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: errorMessage,
        ...(process.env.NODE_ENV === "development" && errorStack ? { stack: errorStack } : {}),
      },
      { status: 500 }
    );
  }
}

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

    const hasAccess = await hasBrandAccess(user.id, brandId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all tone rules for this brand
    const rules = await prisma.rule.findMany({
      where: {
        brandId,
        category: "tone",
      },
    });

    // Format as key-value pairs for easy access
    const values: Record<string, any> = {};
    for (const rule of rules) {
      if (rule.key) {
        values[rule.key] = rule.value;
      }
    }

    return NextResponse.json({ values });
  } catch (error) {
    console.error("Error fetching onboarding progress:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
