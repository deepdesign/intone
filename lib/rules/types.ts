// Enums matching Prisma schema
export enum RuleType {
  LANGUAGE_LOCALE = "LANGUAGE_LOCALE",
  GRAMMAR_STYLE = "GRAMMAR_STYLE",
  TONE_VOICE = "TONE_VOICE",
  TERMINOLOGY = "TERMINOLOGY",
  FORBIDDEN_WORDS = "FORBIDDEN_WORDS",
  FORMATTING = "FORMATTING",
  INCLUSIVE_LANGUAGE = "INCLUSIVE_LANGUAGE",
  LEGAL_COMPLIANCE = "LEGAL_COMPLIANCE",
  CONTENT_PATTERNS = "CONTENT_PATTERNS",
  CUSTOM = "CUSTOM",
}

export enum RuleStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  DEPRECATED = "DEPRECATED",
}

export enum RuleScope {
  GLOBAL = "GLOBAL",
  SURFACE = "SURFACE",
  CHANNEL = "CHANNEL",
  ASSET = "ASSET",
  INTEGRATION = "INTEGRATION",
}

export enum RuleSeverity {
  INFO = "INFO",
  MINOR = "MINOR",
  MAJOR = "MAJOR",
  CRITICAL = "CRITICAL",
}

export enum EnforcementLevel {
  SUGGEST = "SUGGEST",
  WARN = "WARN",
  BLOCK = "BLOCK",
}

export enum DetectorKind {
  REGEX = "REGEX",
  DICTIONARY = "DICTIONARY",
  STYLE_CHECK = "STYLE_CHECK",
  LLM_CLASSIFIER = "LLM_CLASSIFIER",
  LLM_REWRITE = "LLM_REWRITE",
  LINK_CRAWLER = "LINK_CRAWLER",
  DOC_PARSER = "DOC_PARSER",
}

// Legacy types for backward compatibility
export type RuleCategory = "tone" | "grammar" | "terminology";
export type ControlType = "toggle" | "select" | "slider" | "list";
export type RuleContext = "ui" | "marketing" | "support" | "internal";

// Detector configuration interface
export interface Detector {
  kind: DetectorKind;
  pattern?: string; // regex or token list
  caseSensitivity?: boolean;
  wordBoundary?: boolean;
  languageModelPrompt?: string; // for LLM detectors
  minEvidence?: number; // thresholds, optional
}

// Examples structure
export interface RuleExamples {
  do: string[];
  dont: string[];
}

// Unified Rule interface
export interface Rule {
  id: string;
  brandId: string;
  name: string;
  type: RuleType;
  status: RuleStatus;
  
  // Scope
  scope: RuleScope;
  surfaces: string[];
  channels: string[];
  components: string[];
  locales: string[];
  
  // Severity and enforcement
  severity: RuleSeverity;
  enforcement: EnforcementLevel;
  confidence?: number; // 0-1
  
  // Behavior
  description: string;
  rationale?: string;
  examples?: RuleExamples;
  suggestions: string[];
  exceptions: string[];
  edgeNotes?: string;
  
  // Detection
  detectors?: Detector[];
  
  // Output
  findingTemplate?: string;
  rewriteTemplate?: string;
  references: string[];
  
  // Versioning
  version: number;
  previousRuleId?: string;
  changeLog?: string;
  
  // Ownership
  createdBy: string;
  owners: string[];
  
  // Legacy fields for migration compatibility
  key?: string;
  category?: string;
  controlType?: string;
  value?: any;
  priority: number;
  source: "template" | "manual" | "import";
  
  createdAt: Date;
  updatedAt: Date;
}

// Finding interface for lint results
export interface Finding {
  id: string;
  lintResultId: string;
  ruleId: string;
  locationStart: number;
  locationEnd: number;
  severity: RuleSeverity;
  message: string;
  suggestedFix?: string;
  confidence?: number;
  createdAt: Date;
}

// Rule evaluation result (for backward compatibility)
export interface RuleEvaluationResult {
  ruleKey: string;
  reason: string;
  original: string;
  revised: string;
  severity: "error" | "warning" | "suggestion";
}

// Helper function types
export interface CreateRuleInput {
  brandId: string;
  name: string;
  type: RuleType;
  description: string;
  status?: RuleStatus;
  scope?: RuleScope;
  surfaces?: string[];
  channels?: string[];
  components?: string[];
  locales?: string[];
  severity?: RuleSeverity;
  enforcement?: EnforcementLevel;
  rationale?: string;
  examples?: RuleExamples;
  suggestions?: string[];
  exceptions?: string[];
  detectors?: Detector[];
  findingTemplate?: string;
  rewriteTemplate?: string;
  createdBy: string;
}

export interface UpdateRuleInput {
  name?: string;
  status?: RuleStatus;
  scope?: RuleScope;
  surfaces?: string[];
  channels?: string[];
  components?: string[];
  locales?: string[];
  severity?: RuleSeverity;
  enforcement?: EnforcementLevel;
  description?: string;
  rationale?: string;
  examples?: RuleExamples;
  suggestions?: string[];
  exceptions?: string[];
  edgeNotes?: string;
  detectors?: Detector[];
  findingTemplate?: string;
  rewriteTemplate?: string;
  changeLog?: string;
}
