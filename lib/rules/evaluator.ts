import { Rule, Finding, Detector, DetectorKind, RuleSeverity } from "./types";

/**
 * Evaluate a rule against text and return findings
 */
export async function evaluateRule(
  rule: Rule,
  text: string,
  context: string
): Promise<Finding[]> {
  const findings: Finding[] = [];

  // Skip if rule is not active
  if (rule.status !== "ACTIVE") {
    return findings;
  }

  // Check if rule applies to this context/surface
  if (rule.surfaces && rule.surfaces.length > 0) {
    if (!rule.surfaces.includes(context)) {
      return findings;
    }
  }

  // Evaluate each detector
  if (rule.detectors && rule.detectors.length > 0) {
    for (const detector of rule.detectors) {
      const detectorFindings = await evaluateDetector(detector, rule, text);
      findings.push(...detectorFindings);
    }
  } else {
    // If no detectors, this is likely a tone/guideline rule that needs LLM evaluation
    // For now, return empty - LLM evaluation happens in prompt-builder
  }

  return findings;
}

/**
 * Evaluate a single detector against text
 */
async function evaluateDetector(
  detector: Detector,
  rule: Rule,
  text: string
): Promise<Finding[]> {
  const findings: Finding[] = [];

  switch (detector.kind) {
    case DetectorKind.REGEX:
      findings.push(...evaluateRegexDetector(detector, rule, text));
      break;
    case DetectorKind.DICTIONARY:
      findings.push(...evaluateDictionaryDetector(detector, rule, text));
      break;
    case DetectorKind.STYLE_CHECK:
      findings.push(...evaluateStyleCheckDetector(detector, rule, text));
      break;
    case DetectorKind.LLM_CLASSIFIER:
    case DetectorKind.LLM_REWRITE:
      // LLM detectors are handled in prompt-builder, not here
      break;
    case DetectorKind.LINK_CRAWLER:
    case DetectorKind.DOC_PARSER:
      // These are handled separately, not in text evaluation
      break;
  }

  return findings;
}

/**
 * Evaluate regex detector
 */
function evaluateRegexDetector(
  detector: Detector,
  rule: Rule,
  text: string
): Finding[] {
  const findings: Finding[] = [];

  if (!detector.pattern) {
    return findings;
  }

  try {
    const flags = detector.caseSensitivity ? "g" : "gi";
    const regex = new RegExp(detector.pattern, flags);
    const matches = text.matchAll(regex);

    for (const match of matches) {
      if (match.index === undefined) continue;

      const start = match.index;
      const end = start + match[0].length;

      // Check word boundary if required
      if (detector.wordBoundary) {
        const before = text[start - 1];
        const after = text[end];
        const wordBoundaryRegex = /\b/;
        if (before && !wordBoundaryRegex.test(before)) continue;
        if (after && !wordBoundaryRegex.test(after)) continue;
      }

      const message = rule.findingTemplate 
        ? rule.findingTemplate.replace("{match}", match[0])
        : `Found "${match[0]}" which violates rule: ${rule.name}`;

      const suggestedFix = rule.suggestions && rule.suggestions.length > 0
        ? rule.suggestions[0]
        : rule.rewriteTemplate
        ? rule.rewriteTemplate.replace("{match}", match[0])
        : undefined;

      findings.push({
        id: "", // Will be set when saved
        lintResultId: "", // Will be set when saved
        ruleId: rule.id,
        locationStart: start,
        locationEnd: end,
        severity: rule.severity,
        message,
        suggestedFix,
        confidence: 1.0, // Regex matches are 100% confident
        createdAt: new Date(),
      });
    }
  } catch (error) {
    console.error(`Error evaluating regex detector for rule ${rule.id}:`, error);
  }

  return findings;
}

/**
 * Evaluate dictionary detector (exact word/phrase matching)
 */
function evaluateDictionaryDetector(
  detector: Detector,
  rule: Rule,
  text: string
): Finding[] {
  const findings: Finding[] = [];

  if (!detector.pattern) {
    return findings;
  }

  // Split pattern into words/phrases
  const terms = detector.pattern.split("|").map((t) => t.trim());

  for (const term of terms) {
    const flags = detector.caseSensitivity ? "g" : "gi";
    const regex = detector.wordBoundary 
      ? new RegExp(`\\b${escapeRegex(term)}\\b`, flags)
      : new RegExp(escapeRegex(term), flags);

    const matches = text.matchAll(regex);

    for (const match of matches) {
      if (match.index === undefined) continue;

      const start = match.index;
      const end = start + match[0].length;

      const message = rule.findingTemplate 
        ? rule.findingTemplate.replace("{match}", match[0])
        : `Found "${match[0]}" which violates rule: ${rule.name}`;

      const suggestedFix = rule.suggestions && rule.suggestions.length > 0
        ? rule.suggestions[0]
        : undefined;

      findings.push({
        id: "",
        lintResultId: "",
        ruleId: rule.id,
        locationStart: start,
        locationEnd: end,
        severity: rule.severity,
        message,
        suggestedFix,
        confidence: 0.9, // Dictionary matches are highly confident
        createdAt: new Date(),
      });
    }
  }

  return findings;
}

/**
 * Evaluate style check detector (basic style rules)
 */
function evaluateStyleCheckDetector(
  detector: Detector,
  rule: Rule,
  text: string
): Finding[] {
  const findings: Finding[] = [];

  // Style checks are typically handled by LLM, but we can do basic checks here
  // For example: check for excessive punctuation, all caps, etc.

  // This is a placeholder - style checks are usually best done via LLM
  // But we can add basic pattern matching here if needed

  return findings;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Calculate confidence score for a finding based on rule and detector
 */
export function calculateConfidence(rule: Rule, detector: Detector): number {
  // Base confidence on detector type
  switch (detector.kind) {
    case DetectorKind.REGEX:
      return 0.95; // Regex is very reliable
    case DetectorKind.DICTIONARY:
      return 0.9; // Dictionary is reliable
    case DetectorKind.STYLE_CHECK:
      return 0.7; // Style checks are less reliable
    case DetectorKind.LLM_CLASSIFIER:
      return rule.confidence || 0.8; // Use rule confidence or default
    case DetectorKind.LLM_REWRITE:
      return rule.confidence || 0.75;
    default:
      return 0.5;
  }
}
