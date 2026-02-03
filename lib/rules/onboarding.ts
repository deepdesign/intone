import { RuleDefinition } from "./types";

export interface OnboardingStep {
  id: string;
  ruleKey: string;
  title: string;
  description: string;
}

export const TONE_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "locale",
    ruleKey: "tone.locale",
    title: "Language and locale",
    description: "Choose the language and region your brand primarily writes in.",
  },
  {
    id: "formality",
    ruleKey: "tone.formality",
    title: "Formality",
    description: "How formal should your brand sound?",
  },
  {
    id: "confidence",
    ruleKey: "tone.confidence",
    title: "Confidence",
    description: "How confidently should your brand speak?",
  },
  {
    id: "directness",
    ruleKey: "tone.directness",
    title: "Directness",
    description: "How directly should your brand communicate?",
  },
  {
    id: "enthusiasm",
    ruleKey: "tone.enthusiasm",
    title: "Enthusiasm",
    description: "How enthusiastic should your brand sound?",
  },
  {
    id: "humour",
    ruleKey: "tone.humour",
    title: "Humour",
    description: "Should your brand use humour?",
  },
  {
    id: "empathy",
    ruleKey: "tone.empathy",
    title: "Empathy",
    description: "Should your brand use empathetic phrasing?",
  },
  {
    id: "custom-variant",
    ruleKey: "tone.custom_variant",
    title: "Custom tone variant",
    description: "Add any specific tone characteristics unique to your brand.",
  },
  {
    id: "summary",
    ruleKey: "",
    title: "Review",
    description: "Review your tone of voice settings.",
  },
];

export function getStepIndex(stepId: string): number {
  return TONE_ONBOARDING_STEPS.findIndex((s) => s.id === stepId);
}

export function getNextStep(stepId: string): OnboardingStep | null {
  const index = getStepIndex(stepId);
  if (index === -1 || index === TONE_ONBOARDING_STEPS.length - 1) {
    return null;
  }
  return TONE_ONBOARDING_STEPS[index + 1];
}

export function getPrevStep(stepId: string): OnboardingStep | null {
  const index = getStepIndex(stepId);
  if (index <= 0) {
    return null;
  }
  return TONE_ONBOARDING_STEPS[index - 1];
}
