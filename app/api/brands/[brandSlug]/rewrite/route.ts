import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasBrandAccess } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getBrandIdFromSlug } from "@/lib/db/brand";
import { buildPromptFromRules, buildPromptFromRulesWithChannel, GenerateBrief } from "@/lib/rules/prompt-builder";
import { Rule } from "@/lib/rules/types";
import { generateWithOpenAI } from "@/lib/ai/openai";
import { parseRewriteResponse } from "@/lib/ai/response-parser";
import { decryptApiKey } from "@/lib/encryption";
import { getChannel, getDefaultCharLimit, isStrictLimit } from "@/lib/channels/config";
import { validateLength, trimToFit } from "@/lib/channels/constraints";
import { GenerationGroundingService } from "@/lib/repository/services/grounding-service";
import { z } from "zod";

// Use Node.js runtime for Prisma adapter
export const runtime = "nodejs";

const rewriteSchema = z.object({
  input: z.string().optional(),
  brief: z.object({
    topic: z.string(),
    keyPoints: z.array(z.string()),
    cta: z.string().optional(),
    offer: z.string().optional(),
    links: z.array(z.string()).optional(),
  }).optional(),
  context: z.enum(["ui", "marketing", "support"]).optional().default("ui"),
  mode: z.enum(["rewrite", "generate"]).default("rewrite"),
  channelId: z.string().optional(),
  charLimit: z.number().optional(),
  strictLimit: z.boolean().optional(),
  intent: z.enum(["announce", "educate", "persuade", "invite", "apologise", "summarise", "explain", "compare", "warn"]).optional(),
  audience: z.enum(["general", "informed", "expert"]).optional(),
  formality: z.enum(["casual", "neutral", "formal"]).optional(),
  energy: z.enum(["calm", "confident", "bold"]).optional(),
  variants: z.number().min(1).max(5).optional(),
}).refine(
  (data) => {
    // Either input (rewrite) or brief (generate) must be provided
    if (data.mode === "rewrite") {
      return !!data.input;
    } else {
      return !!data.brief;
    }
  },
  {
    message: "Input is required for rewrite mode, brief is required for generate mode",
  }
);

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

    const hasAccess = await hasBrandAccess(user.id, brandId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = rewriteSchema.parse(body);
    const { 
      input, 
      brief, 
      context, 
      mode, 
      channelId, 
      charLimit, 
      strictLimit,
      intent,
      audience,
      formality,
      energy,
      variants,
    } = parsed;

    // Get brand
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Get active rules for this brand
    const rulesData = await prisma.rule.findMany({
      where: {
        brandId,
        status: "ACTIVE",
        // Filter by channel if provided
        ...(channelId ? {
          OR: [
            { channels: { isEmpty: true } }, // Global rules
            { channels: { has: channelId } }, // Rules that apply to this channel
          ],
        } : {
          // Filter by surface if context matches (backward compatibility)
          OR: [
            { surfaces: { isEmpty: true } }, // Global rules
            { surfaces: { has: context || "ui" } }, // Rules that apply to this context
          ],
        }),
      },
      orderBy: [
        { priority: "asc" },
        { name: "asc" },
      ],
    });

    // Convert Prisma rules to Rule type (cast to handle enum differences)
    const rules = rulesData as any as Rule[];

    // Determine effective character limit
    let effectiveCharLimit: number | null = null;
    let effectiveStrict = false;
    
    if (channelId) {
      const channel = getChannel(channelId);
      if (channel) {
        effectiveCharLimit = charLimit ?? channel.charLimit ?? null;
        effectiveStrict = strictLimit ?? channel.strictLimit ?? false;
      }
    } else if (charLimit) {
      effectiveCharLimit = charLimit;
      effectiveStrict = strictLimit ?? false;
    }

    // Query Repository for grounding chunks
    const queryText = mode === "generate" && brief 
      ? `${brief.topic} ${brief.keyPoints.join(" ")}`
      : (input || "");
    
    const grounding = await GenerationGroundingService.prepareGrounding(
      brandId,
      queryText,
      {
        channel: channelId,
        intent: intent || undefined,
        category: channelId ? undefined : context,
      }
    );

    // Build prompt - use channel-aware builder if channel is provided
    let prompt = channelId
      ? buildPromptFromRulesWithChannel(
          {
            rules: rules,
            locale: brand.locale,
          },
          channelId,
          mode === "generate" && brief ? brief : (input || ""),
          mode,
          {
            charLimit: effectiveCharLimit ?? undefined,
            strict: effectiveStrict,
            intent,
            audience,
            formality,
            energy,
            variants,
          }
        )
      : buildPromptFromRules(
          {
            rules: rules,
            locale: brand.locale,
          },
          context || "ui",
          input || "",
          mode as "rewrite" | "lint" | "generate"
        );

    // Append Repository grounding to prompt
    if (grounding.promptAddition) {
      prompt.systemMessage = (prompt.systemMessage || "") + "\n\n" + grounding.promptAddition;
    }

    // Fetch user's API key
    let userApiKey: string | undefined;
    try {
      const userRecord = await prisma.user.findUnique({
        where: { id: user.id },
        select: { openaiApiKey: true } as any, // Type assertion until Prisma types are regenerated
      });

      if (userRecord && (userRecord as any).openaiApiKey) {
        try {
          const decrypted = decryptApiKey((userRecord as any).openaiApiKey);
          if (decrypted) {
            userApiKey = decrypted;
          } else {
            console.warn("Failed to decrypt user API key - may be due to missing or incorrect ENCRYPTION_KEY");
          }
        } catch (decryptError) {
          console.error("Error decrypting API key:", decryptError);
          // Continue to fall back to env var
        }
      }
    } catch (dbError) {
      console.error("Error fetching user API key from database:", dbError);
      // Continue to fall back to env var
    }

    // Fall back to environment variable if no user key
    const apiKey = userApiKey || process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "OpenAI API key not configured",
          details: "Please set your API key in Settings or configure OPENAI_API_KEY in environment variables.",
        },
        { status: 400 }
      );
    }

    // Validate API key format
    if (!apiKey.startsWith("sk-")) {
      return NextResponse.json(
        {
          error: "Invalid OpenAI API key format",
          details: "API key must start with 'sk-'. Please check your API key in Settings.",
        },
        { status: 400 }
      );
    }

    // Generate variants if requested
    const numVariants = variants && variants > 1 ? variants : 1;
    const responses: any[] = [];

    for (let i = 0; i < numVariants; i++) {
      try {
        const response = await generateWithOpenAI(prompt, {
          apiKey,
          temperature: i > 0 ? 0.8 : 0.7, // Slightly more creative for additional variants
        });
        responses.push(response);
      } catch (openaiError: any) {
        console.error("OpenAI API call failed:", openaiError);
        
        // Extract detailed error information
        let errorMessage = "Unknown OpenAI error";
        let errorDetails: any = {};
        
        if (openaiError instanceof Error) {
          errorMessage = openaiError.message;
        }
        
        // Check for OpenAI API specific errors
        if (openaiError?.response) {
          errorDetails.status = openaiError.response.status;
          errorDetails.statusText = openaiError.response.statusText;
          
          if (openaiError.response.status === 401) {
            errorMessage = "Invalid API key. Please check your API key in Settings.";
          } else if (openaiError.response.status === 429) {
            errorMessage = "Rate limit exceeded. Please try again later.";
          } else if (openaiError.response.status === 500) {
            errorMessage = "OpenAI service error. Please try again later.";
          } else if (openaiError.response.data) {
            errorDetails.apiError = openaiError.response.data;
            if (openaiError.response.data.error?.message) {
              errorMessage = openaiError.response.data.error.message;
            }
          }
        }
        
        // If this is the first variant, return error
        if (i === 0) {
          return NextResponse.json(
            {
              error: "OpenAI API call failed",
              details: errorMessage,
              ...(process.env.NODE_ENV === "development" && Object.keys(errorDetails).length > 0 ? { debug: errorDetails } : {}),
            },
            { status: 500 }
          );
        }
        // Otherwise, break and return what we have
        break;
      }
    }

    // Parse first response
    let result;
    try {
      result = parseRewriteResponse(responses[0]);
      
      // If we have multiple variants, extract them
      if (numVariants > 1 && responses.length > 1) {
        const variantOutputs: string[] = [result.output];
        for (let i = 1; i < responses.length; i++) {
          const variantResult = parseRewriteResponse(responses[i]);
          variantOutputs.push(variantResult.output);
        }
        result.variants = variantOutputs;
      }
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", parseError);
      console.error("Response was:", JSON.stringify(responses[0], null, 2));
      return NextResponse.json(
        {
          error: "Failed to parse AI response",
          details: parseError instanceof Error ? parseError.message : "Invalid response format",
        },
        { status: 500 }
      );
    }

    // Validate and trim if needed
    if (effectiveCharLimit !== null && result.output.length > effectiveCharLimit) {
      if (effectiveStrict) {
        const trimmed = trimToFit(result.output, channelId || "", true);
        result.output = trimmed.text;
        result.trimmedToFit = trimmed.trimmed;
      }
    }

    // Update charCount
    result.charCount = result.output.length;

    // Add Repository grounding metadata
    result.referencedChunks = grounding.chunks.map(c => c.id);
    result.groundedInRepository = grounding.chunks.length > 0;

    // Create lint result for history (only if input provided, not for generate mode)
    let lintResult = null;
    if (input) {
      lintResult = await prisma.lintResult.create({
        data: {
          brandId,
          input,
          output: result.output,
          context: context || "ui",
          surface: context || "ui",
          locale: brand.locale,
          status: "completed",
          triggeredRules: result.changes, // Keep for backward compatibility
        },
      });
    }

    // Create Finding records for each change (only if lintResult exists)
    if (lintResult && result.changes && Array.isArray(result.changes)) {
      for (const change of result.changes) {
        // Find the rule that triggered this change
        const rule = rules.find((r) => r.key === change.ruleKey || r.name === change.ruleKey);
        
        if (rule) {
          await prisma.finding.create({
            data: {
              lintResultId: lintResult.id,
              ruleId: rule.id,
              locationStart: 0, // TODO: Calculate from change.original
              locationEnd: 0, // TODO: Calculate from change.original
              severity: "MINOR", // Default, could be determined from rule
              message: change.reason,
              suggestedFix: change.revised,
            },
          });
        }
      }
    }

    // Track usage (placeholder for future implementation)
    if (brand) {
      // await trackRewrite(brand.orgId, brandId);
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: (error as z.ZodError).issues }, { status: 400 });
    }
    console.error("Error rewriting text:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error stack:", errorStack);
    return NextResponse.json(
      {
        error: "Failed to rewrite text",
        details: errorMessage,
        ...(process.env.NODE_ENV === "development" && errorStack ? { stack: errorStack } : {}),
      },
      { status: 500 }
    );
  }
}
