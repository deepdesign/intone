import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasBrandAccess } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getBrandIdFromSlug } from "@/lib/db/brand";
import { getRuleDefinition } from "@/lib/rules/definitions";

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
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "markdown"; // markdown or json
    const userOrgIds = user.memberships?.map((m: { orgId: string }) => m.orgId) || [];
    const brandId = await getBrandIdFromSlug(brandSlug, userOrgIds);

    if (!brandId) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    if (!(await hasBrandAccess(user.id, brandId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get brand
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Get all active rules
    const rules = await prisma.rule.findMany({
      where: {
        brandId,
        status: "ACTIVE",
      },
      orderBy: [
        { category: "asc" },
        { priority: "asc" },
        { name: "asc" },
      ],
    });

    if (format === "json") {
      // Export as JSON
      const exportData = {
        brand: {
          id: brand.id,
          name: brand.name,
          locale: brand.locale,
        },
        exportedAt: new Date().toISOString(),
        rules: rules.map((rule) => ({
          key: rule.key,
          name: rule.name,
          category: rule.category,
          description: rule.description,
          rationale: rule.rationale,
          value: rule.value,
          controlType: rule.controlType,
          status: rule.status,
          surfaces: rule.surfaces,
          channels: rule.channels,
          examples: rule.examples,
          suggestions: rule.suggestions,
          exceptions: rule.exceptions,
          source: rule.source,
        })),
      };

      return NextResponse.json(exportData, {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${brand.slug}-rules-${new Date().toISOString().split("T")[0]}.json"`,
        },
      });
    } else {
      // Export as Markdown
      let markdown = `# ${brand.name} - Brand Language Rules\n\n`;
      markdown += `**Locale:** ${brand.locale}\n`;
      markdown += `**Exported:** ${new Date().toLocaleDateString()}\n\n`;
      markdown += `---\n\n`;

      // Group rules by category
      const rulesByCategory: Record<string, typeof rules> = {};
      for (const rule of rules) {
        const category = rule.category || "other";
        if (!rulesByCategory[category]) {
          rulesByCategory[category] = [];
        }
        rulesByCategory[category].push(rule);
      }

      // Category names
      const categoryNames: Record<string, string> = {
        tone: "Tone of Voice",
        grammar: "Grammar & Punctuation",
        numbers: "Numbers, Dates & Money",
        terminology: "Words & Terminology",
        other: "Other Rules",
      };

      // Write each category
      for (const [category, categoryRules] of Object.entries(rulesByCategory)) {
        const categoryName = categoryNames[category] || category;
        markdown += `## ${categoryName}\n\n`;

        for (const rule of categoryRules) {
          markdown += `### ${rule.name}\n\n`;
          
          if (rule.description) {
            markdown += `${rule.description}\n\n`;
          }

          if (rule.rationale) {
            markdown += `**Why:** ${rule.rationale}\n\n`;
          }

          // Show rule value/configuration
          if (rule.value !== undefined && rule.value !== null) {
            markdown += `**Setting:** `;
            if (typeof rule.value === "boolean") {
              markdown += rule.value ? "Enabled" : "Disabled";
            } else if (typeof rule.value === "object") {
              markdown += JSON.stringify(rule.value, null, 2);
            } else {
              markdown += String(rule.value);
            }
            markdown += `\n\n`;
          }

          // Show examples
          if (rule.examples) {
            const examples = rule.examples as any;
            if (examples.do && examples.do.length > 0) {
              markdown += `**Do:**\n`;
              for (const ex of examples.do) {
                markdown += `- ${ex}\n`;
              }
              markdown += `\n`;
            }
            if (examples.dont && examples.dont.length > 0) {
              markdown += `**Don't:**\n`;
              for (const ex of examples.dont) {
                markdown += `- ${ex}\n`;
              }
              markdown += `\n`;
            }
          }

          // Show applies to
          if (rule.surfaces && rule.surfaces.length > 0) {
            markdown += `**Applies to:** ${rule.surfaces.join(", ")}\n\n`;
          }

          // Show exceptions
          if (rule.exceptions && rule.exceptions.length > 0) {
            markdown += `**Exceptions:** ${rule.exceptions.join(", ")}\n\n`;
          }

          markdown += `---\n\n`;
        }
      }

      return new NextResponse(markdown, {
        headers: {
          "Content-Type": "text/markdown",
          "Content-Disposition": `attachment; filename="${brand.slug}-rules-${new Date().toISOString().split("T")[0]}.md"`,
        },
      });
    }
  } catch (error) {
    console.error("Error exporting rules:", error);
    return NextResponse.json(
      { error: "Failed to export rules" },
      { status: 500 }
    );
  }
}

