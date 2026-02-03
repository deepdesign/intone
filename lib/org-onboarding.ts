export interface OrgOnboardingStep {
  id: string;
  title: string;
  description: string;
}

export const ORG_ONBOARDING_STEPS: OrgOnboardingStep[] = [
  {
    id: "organization",
    title: "Organisation details",
    description: "Tell us about your organisation.",
  },
  {
    id: "locale",
    title: "Language and locale",
    description: "Choose the primary language and region for your organisation.",
  },
  {
    id: "brand",
    title: "Create your first brand",
    description: "Set up your first brand to get started with tone rules.",
  },
  {
    id: "summary",
    title: "Review",
    description: "Review your organisation setup and get started.",
  },
];

export function getOrgStepIndex(stepId: string): number {
  return ORG_ONBOARDING_STEPS.findIndex((s) => s.id === stepId);
}

export function getNextOrgStep(stepId: string): OrgOnboardingStep | null {
  const index = getOrgStepIndex(stepId);
  if (index === -1 || index === ORG_ONBOARDING_STEPS.length - 1) {
    return null;
  }
  return ORG_ONBOARDING_STEPS[index + 1];
}

export function getPrevOrgStep(stepId: string): OrgOnboardingStep | null {
  const index = getOrgStepIndex(stepId);
  if (index <= 0) {
    return null;
  }
  return ORG_ONBOARDING_STEPS[index - 1];
}

