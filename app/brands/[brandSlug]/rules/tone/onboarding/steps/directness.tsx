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

export default function DirectnessStep({ initialValues, onNext, onBack, loading, isFirst }: Props) {
  // Convert old string values to 1-5 scale
  const oldValue = initialValues["tone.directness"];
  const defaultValue = 
    oldValue === "direct" ? 5 :
    oldValue === "expressive" ? 1 :
    typeof oldValue === "number" ? oldValue : 3;
  
  const [directness, setDirectness] = useState(defaultValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({ "tone.directness": directness });
  };

  const examples: string[][] = [
    ["Oops! That email address doesn't look quite right. Could you double-check it for us?"],
    ["That email address doesn't look quite right. Could you double-check it?"],
    ["Please enter a valid email address."],
    ["Invalid email address."],
    ["Email invalid."],
  ];

  const labels = ["Very Expressive", "Expressive", "Neutral", "Direct", "Very Direct"];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ToneSlider
        label="How directly should your brand communicate?"
        description="Direct language helps users understand what to do next. Expressive language adds warmth, but can reduce clarity."
        value={directness}
        onChange={setDirectness}
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
