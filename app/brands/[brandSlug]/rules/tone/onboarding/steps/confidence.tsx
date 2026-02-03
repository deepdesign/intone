"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ToneSlider } from "@/components/tone-slider";

interface Props {
  initialValues: Record<string, any>;
  onNext: (values: Record<string, any>) => void;
  onBack: () => void;
  loading: boolean;
  isFirst: boolean;
  isLast: boolean;
}

export default function ConfidenceStep({ initialValues, onNext, onBack, loading, isFirst }: Props) {
  // Convert old string values to 1-5 scale
  const oldValue = initialValues["tone.confidence"];
  const defaultValue = 
    oldValue === "assertive" ? 5 :
    oldValue === "careful" ? 1 :
    typeof oldValue === "number" ? oldValue : 3;
  
  const [confidence, setConfidence] = useState(defaultValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({ "tone.confidence": confidence });
  };

  const examples = [
    "This might help improve your results.",
    "This may help improve your results.",
    "This should help improve your results.",
    "This will help improve your results.",
    "This will improve your results.",
  ];

  const labels = ["Very Careful", "Careful", "Balanced", "Assertive", "Very Assertive"];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ToneSlider
        label="How confidently should your brand speak?"
        description="Some brands make strong claims. Others are careful and factual. Choose the level that fits your product and audience."
        value={confidence}
        onChange={setConfidence}
        examples={examples}
        labels={labels}
        disabled={loading}
      />

      <div className="flex gap-4 justify-end">
        <Button type="button" variant="outline" onClick={onBack} disabled={isFirst || loading}>
          Back
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Next"}
        </Button>
      </div>
    </form>
  );
}
