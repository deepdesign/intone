// Rule definitions - static metadata (not stored in database)
// Import from seed files and provide unified interface

import { grammarRuleDefinitions } from "@/prisma/seed/rules/grammar-rules";
import { toneRuleDefinitions } from "@/prisma/seed/rules/tone-rules";
import { numbersRuleDefinitions } from "@/prisma/seed/rules/numbers-rules";

export interface RuleDefinition {
  key: string;
  category: string;
  controlType: string;
  label: string;
  description: string;
  options?: any;
  defaultValue?: any;
  examplesGood?: any;
  examplesBad?: any;
  appliesToOptions?: string[];
}

// Combine all rule definitions
const allRuleDefinitions: RuleDefinition[] = [
  ...grammarRuleDefinitions.map((def) => ({
    key: def.key,
    category: def.category,
    controlType: def.controlType,
    label: def.label,
    description: def.description,
    options: def.options,
    defaultValue: def.defaultValue,
    examplesGood: def.examplesGood,
    examplesBad: def.examplesBad,
    appliesToOptions: def.appliesToOptions,
  })),
  ...toneRuleDefinitions.map((def) => ({
    key: def.key,
    category: def.category,
    controlType: def.controlType,
    label: def.label,
    description: def.description,
    options: def.options,
    defaultValue: def.defaultValue,
    examplesGood: def.examplesGood,
    examplesBad: def.examplesBad,
    appliesToOptions: def.appliesToOptions,
  })),
  ...numbersRuleDefinitions.map((def) => ({
    key: def.key,
    category: def.category,
    controlType: def.controlType,
    label: def.label,
    description: def.description,
    options: def.options,
    defaultValue: def.defaultValue,
    examplesGood: def.examplesGood,
    examplesBad: def.examplesBad,
    appliesToOptions: def.appliesToOptions,
  })),
];

export function getRuleDefinitions(category: "tone" | "grammar" | "numbers"): RuleDefinition[] {
  return allRuleDefinitions.filter((def) => def.key.startsWith(`${category}.`));
}

export function getRuleDefinition(key: string): RuleDefinition | null {
  return allRuleDefinitions.find((def) => def.key === key) || null;
}



