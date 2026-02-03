"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ORG_ONBOARDING_STEPS, getNextOrgStep, getPrevOrgStep } from "@/lib/org-onboarding";
import OrganizationStep from "./steps/organization";
import LocaleStep from "./steps/locale";
import BrandStep from "./steps/brand";
import SummaryStep from "./steps/summary";

const STEP_COMPONENTS: Record<string, React.ComponentType<any>> = {
  organization: OrganizationStep,
  locale: LocaleStep,
  brand: BrandStep,
  summary: SummaryStep,
};

export default function OrgOnboardingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = useState("organization");
  const [progress, setProgress] = useState(0);
  const [values, setValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingOrgs, setCheckingOrgs] = useState(true);

  const handleSignOut = async () => {
    try {
      await signOut({ 
        callbackUrl: "/",
        redirect: true 
      });
    } catch (error) {
      console.error("Sign out error:", error);
      // Fallback: redirect to landing page
      window.location.href = "/";
    }
  };

  const stepIndex = ORG_ONBOARDING_STEPS.findIndex((s) => s.id === currentStep);
  const totalSteps = ORG_ONBOARDING_STEPS.length;

  useEffect(() => {
    setProgress(((stepIndex + 1) / totalSteps) * 100);
  }, [stepIndex, totalSteps]);

  // Check if user already has an org - if so, redirect to dashboard
  useEffect(() => {
    fetch("/api/orgs", {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    })
      .then(async (res) => {
        if (!res.ok) {
          setCheckingOrgs(false);
          return;
        }
        const orgs = await res.json();
        if (Array.isArray(orgs) && orgs.length > 0) {
          // User already has an org, redirect to dashboard
          router.replace("/app/dashboard");
          return;
        }
        setCheckingOrgs(false);
      })
      .catch((error) => {
        console.error("Error checking orgs:", error);
        setCheckingOrgs(false);
      });
  }, [router]);

  if (checkingOrgs) {
    return (
      <div className="container mx-auto py-12 max-w-3xl">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const handleNext = async (stepValues: Record<string, any>) => {
    const updatedValues = { ...values, ...stepValues };
    setValues(updatedValues);

    // If we're on the last step, complete onboarding
    if (stepIndex === totalSteps - 1) {
      await handleComplete(updatedValues);
      return;
    }

    // Move to next step
    const nextStep = getNextOrgStep(currentStep);
    if (nextStep) {
      setCurrentStep(nextStep.id);
    }
  };

  const handleBack = () => {
    const prevStep = getPrevOrgStep(currentStep);
    if (prevStep) {
      setCurrentStep(prevStep.id);
    }
  };

  const handleComplete = async (allValues: Record<string, any>) => {
    setLoading(true);
    setError(null);
    try {
      // Skip session check for now - the API route will handle authentication
      // The issue is that auth() isn't reading sessions correctly, but the API route
      // should still work if cookies are sent

      // Create organization
      const orgResponse = await fetch("/api/orgs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Ensure cookies are sent
        body: JSON.stringify({
          name: allValues.orgName,
          slug: allValues.orgSlug,
        }),
      });

      if (!orgResponse.ok) {
        const error = await orgResponse.json();
        throw new Error(error.error || "Failed to create organization");
      }

      const org = await orgResponse.json();

      // If brand details were provided, create the first brand
      if (allValues.brandName && allValues.locale && !allValues.skipBrand) {
        const brandResponse = await fetch("/api/brands", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // Ensure cookies are sent
          body: JSON.stringify({
            name: allValues.brandName,
            slug: allValues.brandSlug || allValues.brandName.toLowerCase().replace(/\s+/g, "-"),
            orgId: org.id,
            locale: allValues.locale,
            template: allValues.template || "product-ui",
          }),
        });

        if (brandResponse.ok) {
          const brand = await brandResponse.json();
          // Redirect to brand tone onboarding
          router.push(`/brands/${brand.id}/rules/tone/onboarding`);
          return;
        }
      }

      // No brand created, go to dashboard
      router.push("/app/dashboard");
    } catch (error) {
      console.error("Error completing onboarding:", error);
      setError(error instanceof Error ? error.message : "Failed to complete onboarding");
      setLoading(false);
    }
  };

  const currentStepData = ORG_ONBOARDING_STEPS[stepIndex];
  const StepComponent = STEP_COMPONENTS[currentStep];

  if (!StepComponent) {
    return <div>Invalid step</div>;
  }

  return (
    <div className="container mx-auto py-12 max-w-3xl">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Welcome! Let's get you set up</h1>
          <p className="text-muted-foreground">
            Step {stepIndex + 1} of {totalSteps}: {currentStepData.title}
          </p>
          <Progress value={progress} className="mt-4" />
        </div>
        {session && (
          <div className="flex flex-col items-end gap-2">
            <p className="text-sm text-muted-foreground">
              Signed in as {session.user?.email || session.user?.name}
            </p>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{currentStepData.title}</CardTitle>
          <CardDescription>{currentStepData.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md border border-destructive/50">
              {error}
            </div>
          )}
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

