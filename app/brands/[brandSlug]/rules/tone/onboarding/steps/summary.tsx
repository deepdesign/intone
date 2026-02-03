"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  initialValues: Record<string, any>;
  onNext: (values: Record<string, any>) => void;
  onBack: () => void;
  loading: boolean;
  isFirst: boolean;
  isLast: boolean;
}

export default function SummaryStep({ initialValues, onNext, onBack, loading }: Props) {
  const params = useParams();
  const router = useRouter();
  const brandId = params.brandId as string;
  const [testInput, setTestInput] = useState("");
  const [testOutput, setTestOutput] = useState("");

  const handleTest = async () => {
    if (!testInput.trim()) return;

    try {
      // First, save the current onboarding values so rules exist in the database
      const response = await fetch(`/api/brands/${brandId}/rules/tone/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "summary",
          values: initialValues,
        }),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const error = await response.json();
          throw new Error(error.details || error.error || "Failed to save onboarding values before testing");
        } else {
          throw new Error(`Failed to save onboarding values: HTTP ${response.status}`);
        }
      }

      // Now test the rewrite
      const rewriteResponse = await fetch(`/api/brands/${brandId}/rewrite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: testInput,
          context: "ui",
          mode: "rewrite",
        }),
      });

      if (!rewriteResponse.ok) {
        const contentType = rewriteResponse.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const error = await rewriteResponse.json();
          throw new Error(error.error || error.details || "Failed to test");
        } else {
          throw new Error(`HTTP error! status: ${rewriteResponse.status}`);
        }
      }

      const contentType = rewriteResponse.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Response is not JSON");
      }

      const data = await rewriteResponse.json();
      setTestOutput(data.output || "");
    } catch (error) {
      console.error("Error testing:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to test";
      alert(`Failed to test: ${errorMessage}. Make sure your OpenAI API key is configured and try again.`);
    }
  };

  const handleComplete = async () => {
    // Save all values one final time before completing
    try {
      await fetch(`/api/brands/${brandId}/rules/tone/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "summary",
          values: initialValues,
        }),
      });
      onNext({});
    } catch (error) {
      console.error("Error saving final values:", error);
      alert("Failed to save tone settings. Please try again.");
    }
  };

  const localeMap: Record<string, string> = {
    "en-GB": "English (UK)",
    "en-US": "English (US)",
    "en-AU": "English (AU)",
  };

  // Helper to convert numeric slider values to labels
  const getFormalityLabel = (value: any): string => {
    if (typeof value === "number") {
      const labels = ["Very Conversational", "Conversational", "Neutral", "Formal", "Very Formal"];
      return labels[value - 1] || "Neutral";
    }
    const map: Record<string, string> = {
      formal: "Formal",
      neutral: "Neutral",
      conversational: "Conversational",
    };
    return map[value] || String(value);
  };

  const getConfidenceLabel = (value: any): string => {
    if (typeof value === "number") {
      const labels = ["Very Careful", "Careful", "Balanced", "Assertive", "Very Assertive"];
      return labels[value - 1] || "Balanced";
    }
    const map: Record<string, string> = {
      assertive: "Assertive",
      balanced: "Balanced",
      careful: "Careful",
    };
    return map[value] || String(value);
  };

  const getDirectnessLabel = (value: any): string => {
    if (typeof value === "number") {
      const labels = ["Very Expressive", "Expressive", "Neutral", "Direct", "Very Direct"];
      return labels[value - 1] || "Neutral";
    }
    const map: Record<string, string> = {
      direct: "Direct and Concise",
      neutral: "Neutral",
      expressive: "Expressive",
    };
    return map[value] || String(value);
  };

  const getEnthusiasmLabel = (value: any): string => {
    if (typeof value === "number") {
      const labels = ["Very Low", "Low", "Neutral", "High", "Very High"];
      return labels[value - 1] || "Neutral";
    }
    if (value === true) return "Low";
    if (value === false) return "High";
    return String(value);
  };

  const getHumourLabel = (value: any): string => {
    if (typeof value === "number") {
      const labels = ["None", "Minimal", "Light", "Moderate", "High"];
      return labels[value - 1] || "None";
    }
    if (value === true) return "Enabled";
    if (value === false) return "Disabled";
    return String(value);
  };

  const getEmpathyLabel = (value: any): string => {
    if (typeof value === "number") {
      const labels = ["None", "Minimal", "Neutral", "Moderate", "High"];
      return labels[value - 1] || "Neutral";
    }
    if (value === true) return "Enabled";
    if (value === false) return "Disabled";
    return String(value);
  };

  // Generate tone summary paragraph
  const generateToneSummary = () => {
    const parts: string[] = [];
    
    if (initialValues["tone.locale"]) {
      parts.push(`writing in ${localeMap[initialValues["tone.locale"]] || initialValues["tone.locale"]}`);
    }
    
    if (initialValues["tone.formality"] !== undefined) {
      const formality = getFormalityLabel(initialValues["tone.formality"]);
      parts.push(`a ${formality.toLowerCase()} tone`);
    }
    
    if (initialValues["tone.confidence"] !== undefined) {
      const confidence = getConfidenceLabel(initialValues["tone.confidence"]);
      parts.push(`${confidence.toLowerCase()} language`);
    }
    
    if (initialValues["tone.directness"] !== undefined) {
      const directness = getDirectnessLabel(initialValues["tone.directness"]);
      parts.push(`${directness.toLowerCase()} communication`);
    }
    
    if (initialValues["tone.enthusiasm"] !== undefined) {
      const enthusiasm = getEnthusiasmLabel(initialValues["tone.enthusiasm"]);
      parts.push(`${enthusiasm.toLowerCase()} enthusiasm`);
    }
    
    if (initialValues["tone.humour"] !== undefined) {
      const humour = getHumourLabel(initialValues["tone.humour"]);
      if (typeof initialValues["tone.humour"] === "number" && initialValues["tone.humour"] > 1) {
        parts.push(`${humour.toLowerCase()} humour`);
      } else {
        parts.push("avoiding humour");
      }
    }
    
    if (initialValues["tone.empathy"] !== undefined) {
      const empathy = getEmpathyLabel(initialValues["tone.empathy"]);
      if (typeof initialValues["tone.empathy"] === "number" && initialValues["tone.empathy"] > 2) {
        parts.push(`${empathy.toLowerCase()} empathy`);
      }
    }
    
    if (parts.length === 0) {
      return "Your brand voice is being configured. Complete the steps above to generate a summary.";
    }
    
    let summary = `Your brand voice uses ${parts.join(", ")}.`;
    
    if (initialValues["tone.custom_variant"] && initialValues["tone.custom_variant"].trim()) {
      summary += ` Additionally, your custom tone variant specifies: ${initialValues["tone.custom_variant"]}`;
    }
    
    summary += ` This creates a consistent tone across all communications.`;
    
    return summary;
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-semibold">Your Tone of Voice Summary</h3>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm leading-relaxed">{generateToneSummary()}</p>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {initialValues["tone.locale"] && (
            <div className="flex justify-between items-center p-3 border rounded-lg">
              <span className="text-sm font-medium">Locale</span>
              <Badge>{localeMap[initialValues["tone.locale"]] || initialValues["tone.locale"]}</Badge>
            </div>
          )}

          {initialValues["tone.formality"] !== undefined && (
            <div className="flex justify-between items-center p-3 border rounded-lg">
              <span className="text-sm font-medium">Formality</span>
              <Badge>{getFormalityLabel(initialValues["tone.formality"])}</Badge>
            </div>
          )}

          {initialValues["tone.confidence"] !== undefined && (
            <div className="flex justify-between items-center p-3 border rounded-lg">
              <span className="text-sm font-medium">Confidence</span>
              <Badge>{getConfidenceLabel(initialValues["tone.confidence"])}</Badge>
            </div>
          )}

          {initialValues["tone.directness"] !== undefined && (
            <div className="flex justify-between items-center p-3 border rounded-lg">
              <span className="text-sm font-medium">Directness</span>
              <Badge>{getDirectnessLabel(initialValues["tone.directness"])}</Badge>
            </div>
          )}

          {initialValues["tone.enthusiasm"] !== undefined && (
            <div className="flex justify-between items-center p-3 border rounded-lg">
              <span className="text-sm font-medium">Enthusiasm</span>
              <Badge>{getEnthusiasmLabel(initialValues["tone.enthusiasm"])}</Badge>
            </div>
          )}

          {initialValues["tone.humour"] !== undefined && (
            <div className="flex justify-between items-center p-3 border rounded-lg">
              <span className="text-sm font-medium">Humour</span>
              <Badge>{getHumourLabel(initialValues["tone.humour"])}</Badge>
            </div>
          )}

          {initialValues["tone.empathy"] !== undefined && (
            <div className="flex justify-between items-center p-3 border rounded-lg">
              <span className="text-sm font-medium">Empathy</span>
              <Badge>{getEmpathyLabel(initialValues["tone.empathy"])}</Badge>
            </div>
          )}

          {initialValues["tone.custom_variant"] && initialValues["tone.custom_variant"].trim() && (
            <div className="p-3 border rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Custom tone variant</span>
              </div>
              <p className="text-sm text-muted-foreground">{initialValues["tone.custom_variant"]}</p>
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test this tone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enter some text to see how it would be rewritten according to your tone settings. Note: This feature requires your OpenAI API key to be configured.
          </p>
          <div className="space-y-2">
            <label className="text-sm font-medium">Input</label>
            <textarea
              className="w-full min-h-[100px] p-2 border rounded-md"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Enter some text to see how it would be rewritten..."
            />
          </div>

          {testOutput && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Output</label>
              <div className="p-3 bg-muted rounded-md text-sm">{testOutput}</div>
            </div>
          )}

          <Button type="button" variant="outline" onClick={handleTest} disabled={!testInput.trim() || loading}>
            {loading ? "Testing..." : "Test"}
          </Button>
        </CardContent>
      </Card>

      <div className="flex gap-4 justify-end">
        <Button type="button" variant="outline" onClick={onBack} disabled={loading}>
          Back
        </Button>
        <Button onClick={handleComplete} disabled={loading}>
          {loading ? "Saving..." : "Save tone of voice"}
        </Button>
      </div>
    </div>
  );
}
