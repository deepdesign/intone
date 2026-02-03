// Cache for rule definitions to avoid re-importing on every call
import { getRuleDefinition, RuleDefinition } from "./definitions";

const cache = new Map<string, RuleDefinition | null>();

export { RuleDefinition };

export async function getRuleDefinitionCached(key: string): Promise<RuleDefinition | null> {
  if (cache.has(key)) {
    return cache.get(key) || null;
  }
  
  const definition = getRuleDefinition(key);
  cache.set(key, definition);
  return definition;
}

// For synchronous access (used in client components)
export function getRuleDefinitionSync(key: string): RuleDefinition | null {
  if (cache.has(key)) {
    return cache.get(key) || null;
  }
  
  const definition = getRuleDefinition(key);
  cache.set(key, definition);
  return definition;
}

// Alias for backward compatibility
export const getRuleDefinition = getRuleDefinitionCached;



