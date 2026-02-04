import { PrismaClient, Prisma } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { toneRuleDefinitions } from "./seed/rules/tone-rules";
import { grammarRuleDefinitions } from "./seed/rules/grammar-rules";
import { numbersRuleDefinitions } from "./seed/rules/numbers-rules";
import "dotenv/config";

// Create PostgreSQL connection pool for seed script
const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ["error", "warn"],
});

/** Seed rule definition shape (from tone-rules, grammar-rules, numbers-rules) */
type SeedRuleDef = {
  key?: string;
  category?: string;
  controlType?: string;
  label?: string;
  description?: string;
  options?: any;
  defaultValue?: any;
  examplesGood?: any;
  examplesBad?: any;
  appliesToOptions?: string[];
};

/**
 * Transform seed rule definition to Rule create input
 */
function transformRuleDefinitionToRule(
  def: SeedRuleDef,
  brandId: string,
  createdBy: string = "system"
): Prisma.RuleCreateInput {
  // Map category to RuleType
  let ruleType: string;
  switch (def.category) {
    case "tone":
      ruleType = "TONE_VOICE";
      break;
    case "grammar":
      ruleType = "GRAMMAR_STYLE";
      break;
    case "numbers":
      ruleType = "FORMATTING";
      break;
    case "terminology":
      ruleType = "TERMINOLOGY";
      break;
    default:
      ruleType = "CUSTOM";
  }

  // Extract examples
  const examples: { do: string[]; dont: string[] } = { do: [], dont: [] };
  
  if (def.examplesGood) {
    const goodExamples = (def.examplesGood as any)?.examples || [];
    examples.do = goodExamples.map((ex: any) => ex.text || ex || String(ex));
  }
  
  if (def.examplesBad) {
    const badExamples = (def.examplesBad as any)?.examples || [];
    examples.dont = badExamples.map((ex: any) => ex.text || ex || String(ex));
  }

  // Determine severity based on rule importance
  let severity = "MINOR";
  if (def.key?.includes("critical") || def.key?.includes("block")) {
    severity = "CRITICAL";
  } else if (def.key?.includes("major") || def.key?.includes("important")) {
    severity = "MAJOR";
  } else if (def.key?.includes("info") || def.key?.includes("suggestion")) {
    severity = "INFO";
  }

  // Determine enforcement based on severity
  let enforcement = "WARN";
  if (severity === "CRITICAL") {
    enforcement = "BLOCK";
  } else if (severity === "INFO") {
    enforcement = "SUGGEST";
  }

  // Build detectors based on controlType
  const detectors: any[] = [];
  if (def.controlType === "toggle" || def.controlType === "list") {
    detectors.push({ kind: "STYLE_CHECK", pattern: def.key });
  }

  return {
    brand: { connect: { id: brandId } },
    name: def.label || def.key || "Unnamed Rule",
    type: ruleType as any,
    status: "ACTIVE",
    scope: "GLOBAL",
    surfaces: def.appliesToOptions || [],
    channels: [],
    components: [],
    locales: ["en-GB", "en-US"], // Default, can be customized per brand
    severity: severity as any,
    enforcement: enforcement as any,
    description: def.description || "",
    examples: examples.do.length > 0 || examples.dont.length > 0 ? examples : undefined,
    suggestions: [],
    exceptions: [],
    detectors: detectors.length > 0 ? detectors : undefined,
    version: 1,
    createdBy,
    owners: [],
    // Legacy fields
    key: def.key,
    category: def.category,
    controlType: def.controlType,
    value: def.defaultValue,
    priority: 0,
    source: "template",
  };
}

async function main() {
  console.log("Seeding rules...");

  // Get or create a default brand for seeding
  let brand = await prisma.brand.findFirst({
    where: { slug: "example-brand" },
  });

  if (!brand) {
    // Get or create a default org
    let org = await prisma.org.findFirst({
      where: { slug: "example-org" },
    });

    if (!org) {
      org = await prisma.org.create({
        data: {
          name: "Example Organization",
          slug: "example-org",
        },
      });
    }

    brand = await prisma.brand.create({
      data: {
        orgId: org.id,
        name: "Example Brand",
        slug: "example-brand",
        locale: "en-GB",
        template: "product-ui",
      },
    });
  }

  console.log(`Using brand: ${brand.name} (${brand.id})`);

  // Seed tone rules
  console.log("Seeding tone rules...");
  for (const ruleDef of toneRuleDefinitions) {
    // Check if rule already exists
    const existing = await prisma.rule.findFirst({
      where: {
        brandId: brand.id,
        key: ruleDef.key,
      },
    });

    if (!existing) {
      const ruleData = transformRuleDefinitionToRule(ruleDef, brand.id);
      await prisma.rule.create({
        data: ruleData,
      });
      console.log(`✓ Seeded rule: ${ruleDef.key}`);
    } else {
      console.log(`- Skipped existing rule: ${ruleDef.key}`);
    }
  }

  // Seed grammar rules
  console.log("Seeding grammar rules...");
  for (const ruleDef of grammarRuleDefinitions) {
    const existing = await prisma.rule.findFirst({
      where: {
        brandId: brand.id,
        key: ruleDef.key,
      },
    });

    if (!existing) {
      const ruleData = transformRuleDefinitionToRule(ruleDef, brand.id);
      await prisma.rule.create({
        data: ruleData,
      });
      console.log(`✓ Seeded rule: ${ruleDef.key}`);
    } else {
      console.log(`- Skipped existing rule: ${ruleDef.key}`);
    }
  }

  // Seed numbers rules
  console.log("Seeding numbers rules...");
  for (const ruleDef of numbersRuleDefinitions) {
    const existing = await prisma.rule.findFirst({
      where: {
        brandId: brand.id,
        key: ruleDef.key,
      },
    });

    if (!existing) {
      const ruleData = transformRuleDefinitionToRule(ruleDef, brand.id);
      await prisma.rule.create({
        data: ruleData,
      });
      console.log(`✓ Seeded rule: ${ruleDef.key}`);
    } else {
      console.log(`- Skipped existing rule: ${ruleDef.key}`);
    }
  }

  console.log("✓ Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
