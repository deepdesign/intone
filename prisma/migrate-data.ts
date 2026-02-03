/**
 * Data migration script to migrate from RuleDefinition/RuleInstance/CustomRule
 * to unified Rule model.
 * 
 * Run with: tsx prisma/migrate-data.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function migrateData() {
  console.log("Starting data migration to unified Rule model...");

  try {
    // Step 1: Migrate RuleDefinition + RuleInstance combinations
    console.log("Step 1: Migrating RuleDefinition + RuleInstance combinations...");
    
    const ruleInstances = await prisma.ruleInstance.findMany({
      include: {
        ruleDefinition: true,
        brand: true,
      },
    });

    let migratedCount = 0;
    for (const instance of ruleInstances) {
      const def = instance.ruleDefinition;
      
      // Map category to RuleType
      let ruleType: string;
      switch (def.category) {
        case "tone":
          ruleType = "TONE_VOICE";
          break;
        case "grammar":
          ruleType = "GRAMMAR_STYLE";
          break;
        case "terminology":
          ruleType = "TERMINOLOGY";
          break;
        default:
          ruleType = "CUSTOM";
      }

      // Map appliesTo to surfaces
      const surfaces = instance.appliesTo || def.appliesToOptions || [];
      
      // Build examples from examplesGood/examplesBad
      const examples = def.examplesGood || def.examplesBad
        ? {
            do: Array.isArray(def.examplesGood) ? def.examplesGood : def.examplesGood ? [def.examplesGood] : [],
            dont: Array.isArray(def.examplesBad) ? def.examplesBad : def.examplesBad ? [def.examplesBad] : [],
          }
        : undefined;

      // Determine severity based on rule importance
      let severity = "MINOR";
      if (def.key.includes("critical") || def.key.includes("block")) {
        severity = "CRITICAL";
      } else if (def.key.includes("major") || def.key.includes("important")) {
        severity = "MAJOR";
      }

      // Determine enforcement based on severity
      let enforcement = "WARN";
      if (severity === "CRITICAL") {
        enforcement = "BLOCK";
      } else if (severity === "INFO") {
        enforcement = "SUGGEST";
      }

      await prisma.rule.create({
        data: {
          id: instance.id, // Use instance ID to maintain relationships
          brandId: instance.brandId,
          name: def.label,
          type: ruleType as any,
          status: instance.enabled ? "ACTIVE" : "DRAFT",
          scope: "GLOBAL",
          surfaces: surfaces,
          channels: [],
          components: [],
          locales: [instance.brand.locale || "en-GB"],
          severity: severity as any,
          enforcement: enforcement as any,
          description: def.description,
          examples: examples,
          suggestions: [],
          exceptions: [],
          detectors: def.controlType === "toggle" 
            ? [{ kind: "STYLE_CHECK", pattern: def.key }]
            : undefined,
          version: 1,
          createdBy: "system", // Will be updated if we have user info
          owners: [],
          // Legacy fields
          key: def.key,
          category: def.category,
          controlType: def.controlType,
          value: instance.value,
          priority: instance.priority,
          source: instance.source as any,
        },
      });

      migratedCount++;
    }

    console.log(`Migrated ${migratedCount} rule instances.`);

    // Step 2: Migrate CustomRule records
    console.log("Step 2: Migrating CustomRule records...");
    
    const customRules = await prisma.customRule.findMany({
      include: {
        brand: true,
      },
    });

    let customMigratedCount = 0;
    for (const customRule of customRules) {
      // Map CustomRule type to RuleType
      let ruleType: string;
      switch (customRule.type) {
        case "forbidden":
          ruleType = "FORBIDDEN_WORDS";
          break;
        case "preferred":
          ruleType = "TERMINOLOGY";
          break;
        case "replacement":
          ruleType = "TERMINOLOGY";
          break;
        case "formatting":
          ruleType = "FORMATTING";
          break;
        default:
          ruleType = "CUSTOM";
      }

      // Build detectors from pattern
      const detectors = customRule.pattern
        ? [{ kind: "REGEX", pattern: customRule.pattern }]
        : undefined;

      await prisma.rule.create({
        data: {
          id: customRule.id, // Use custom rule ID
          brandId: customRule.brandId,
          name: customRule.description.substring(0, 100), // Use description as name
          type: ruleType as any,
          status: "ACTIVE",
          scope: "GLOBAL",
          surfaces: customRule.appliesTo || [],
          channels: [],
          components: [],
          locales: [customRule.brand.locale || "en-GB"],
          severity: "MINOR",
          enforcement: "WARN",
          description: customRule.description,
          suggestions: customRule.replacement ? [customRule.replacement] : [],
          exceptions: [],
          detectors: detectors,
          version: 1,
          createdBy: "system",
          owners: [],
          // Legacy fields
          value: customRule.replacement ? { replacement: customRule.replacement } : undefined,
          priority: 0,
          source: "manual",
        },
      });

      customMigratedCount++;
    }

    console.log(`Migrated ${customMigratedCount} custom rules.`);

    // Step 3: Verify data integrity
    console.log("Step 3: Verifying data integrity...");
    
    const totalRules = await prisma.rule.count();
    const expectedCount = migratedCount + customMigratedCount;
    
    if (totalRules >= expectedCount) {
      console.log(`✓ Data migration successful!`);
      console.log(`  Total rules created: ${totalRules}`);
      console.log(`  Expected: ${expectedCount}`);
    } else {
      console.warn(`⚠ Warning: Expected ${expectedCount} rules but found ${totalRules}`);
    }

    console.log("Data migration completed successfully!");
  } catch (error) {
    console.error("Error during data migration:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

// Run migration
migrateData()
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });

