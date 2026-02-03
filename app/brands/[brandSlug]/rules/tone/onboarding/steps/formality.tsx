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

export default function FormalityStep({ initialValues, onNext, onBack, loading, isFirst }: Props) {
  // Convert old string values to 1-5 scale
  const oldValue = initialValues["tone.formality"];
  const defaultValue = 
    oldValue === "formal" ? 5 :
    oldValue === "conversational" ? 1 :
    typeof oldValue === "number" ? oldValue : 3;
  
  const [formality, setFormality] = useState(defaultValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({ "tone.formality": formality });
  };

  const examples = [
    "We've processed your request.",
    "Your request has been processed.",
    "We have processed your request.",
    "We are pleased to inform you that your request has been processed.",
    "We are pleased to inform you that your request has been processed in accordance with our standard procedures.",
  ];

  const labels = ["Very Conversational", "Conversational", "Neutral", "Formal", "Very Formal"];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ToneSlider
        label="How formal should your brand sound?"
        description="Formality affects sentence structure, word choice, and how conversational your brand feels."
        value={formality}
        onChange={setFormality}
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
