export interface RewriteResponse {
  output: string;
  charCount: number;
  variants?: string[];
  changes: Array<{
    ruleKey: string;
    reason: string;
    original: string;
    revised: string;
  }>;
  noChanges?: boolean;
  noChangesReason?: string;
  appliedRules?: Array<{
    ruleId: string;
    action: string;
    count: number;
  }>;
  violationsInInput?: Array<{
    ruleId: string;
    snippet: string;
    severity: string;
  }>;
  trimmedToFit?: boolean;
}

export interface LintResponse {
  issues: Array<{
    ruleKey: string;
    reason: string;
    original: string;
    suggested: string;
    severity: "error" | "warning" | "suggestion";
  }>;
}

// GenerateBrief is exported from prompt-builder.ts
export type { GenerateBrief } from "@/lib/rules/prompt-builder";

export function parseRewriteResponse(data: any): RewriteResponse {
  if (typeof data.output !== "string") {
    throw new Error("Invalid response: missing output");
  }

  return {
    output: data.output,
    charCount: data.charCount ?? data.output.length,
    variants: Array.isArray(data.variants) ? data.variants : undefined,
    changes: Array.isArray(data.changes) ? data.changes : [],
    noChanges: data.noChanges ?? false,
    noChangesReason: data.noChangesReason || undefined,
    appliedRules: Array.isArray(data.appliedRules) ? data.appliedRules : undefined,
    violationsInInput: Array.isArray(data.violationsInInput) ? data.violationsInInput : undefined,
    trimmedToFit: data.trimmedToFit ?? false,
  };
}

export function parseGenerateResponse(data: any): RewriteResponse {
  // Generate mode uses the same response format as rewrite
  return parseRewriteResponse(data);
}

export function parseLintResponse(data: any): LintResponse {
  if (!Array.isArray(data.issues)) {
    throw new Error("Invalid response: missing issues array");
  }

  return {
    issues: data.issues.map((issue: any) => ({
      ruleKey: issue.ruleKey || "unknown",
      reason: issue.reason || "",
      original: issue.original || "",
      suggested: issue.suggested || "",
      severity: issue.severity || "suggestion",
    })),
  };
}