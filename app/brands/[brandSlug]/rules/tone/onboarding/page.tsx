"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TONE_ONBOARDING_STEPS, getNextStep, getPrevStep } from "@/lib/rules/onboarding";
import LanguageLocaleStep from "./steps/language-locale";
import FormalityStep from "./steps/formality";
import ConfidenceStep from "./steps/confidence";
import DirectnessStep from "./steps/directness";
import EnthusiasmStep from "./steps/enthusiasm";
import HumourStep from "./steps/humour";
import EmpathyStep from "./steps/empathy";
import CustomVariantStep from "./steps/custom-variant";
import SummaryStep from "./steps/summary";

const STEP_COMPONENTS: Record<string, React.ComponentType<any>> = {
  locale: LanguageLocaleStep,
  formality: FormalityStep,
  confidence: ConfidenceStep,
  directness: DirectnessStep,
  enthusiasm: EnthusiasmStep,
  humour: HumourStep,
  empathy: EmpathyStep,
  "custom-variant": CustomVariantStep,
  summary: SummaryStep,
};

export default function ToneOnboardingPage() {
  const params = useParams();
  const router = useRouter();
  const brandId = params.brandId as string;
  const [currentStep, setCurrentStep] = useState("locale");
  const [progress, setProgress] = useState(0);
  const [values, setValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  const stepIndex = TONE_ONBOARDING_STEPS.findIndex((s) => s.id === currentStep);
  const totalSteps = TONE_ONBOARDING_STEPS.length;

  useEffect(() => {
    setProgress(((stepIndex + 1) / totalSteps) * 100);
  }, [stepIndex, totalSteps]);

  useEffect(() => {
    // Load existing progress
    fetch(`/api/brands/${brandId}/rules/tone/onboarding`)
      .then(async (res) => {
        if (!res.ok) {
          return null; // No existing progress
        }
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.values) {
          setValues(data.values);
        }
      })
      .catch((error) => {
        console.error("Error loading progress:", error);
      });
  }, [brandId]);

  const handleNext = async (stepValues: Record<string, any>) => {
    setLoading(true);
    const newValues = { ...values, ...stepValues };

    try {
      await fetch(`/api/brands/${brandId}/rules/tone/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: currentStep,
          values: newValues,
        }),
      });

      setValues(newValues);

      const next = getNextStep(currentStep);
      if (next) {
        setCurrentStep(next.id);
      } else {
        // Completed - redirect to settings
        router.push(`/brands/${brandId}/rules/tone/settings`);
      }
    } catch (error) {
      console.error("Error saving progress:", error);
      alert("Failed to save progress. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    const prev = getPrevStep(currentStep);
    if (prev) {
      setCurrentStep(prev.id);
    }
  };

  const StepComponent = STEP_COMPONENTS[currentStep];
  const currentStepData = TONE_ONBOARDING_STEPS[stepIndex];

  if (!StepComponent || !currentStepData) {
    return <div>Invalid step</div>;
  }

  return (
    <div className="container mx-auto py-12 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Tone of voice setup</h1>
        <p className="text-muted-foreground">
          Step {stepIndex + 1} of {totalSteps}: {currentStepData.title}
        </p>
        <Progress value={progress} className="mt-4" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{currentStepData.title}</CardTitle>
          <CardDescription>{currentStepData.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <StepComponent
            initialValues={values}
            onNext={handleNext}
            onBack={handleBack}
            loading={loading}
            isFirst={stepIndex === 0}
            isLast={stepIndex === totalSteps - 1}
          />
        </CardContent>
      </Card>
    </div>
  );
}
