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

export default function EmpathyStep({ initialValues, onNext, onBack, loading, isFirst }: Props) {
  // Convert old boolean value to 1-5 scale
  const oldValue = initialValues["tone.empathy"];
  const defaultValue = oldValue === true ? 5 : oldValue === false ? 1 : typeof oldValue === "number" ? oldValue : 3;
  
  const [empathy, setEmpathy] = useState(defaultValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({ "tone.empathy": empathy });
  };

  const examples = [
    "Error: Invalid email address.",
    "Invalid email address.",
    "Please enter a valid email address.",
    "We couldn't validate that email address. Please check and try again.",
    "We understand how frustrating it can be when something doesn't work. Let's get that email address sorted together.",
  ];

  const labels = ["None", "Minimal", "Neutral", "Moderate", "High"];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ToneSlider
        label="Empathy"
        description="Empathetic language is especially useful in support and error states."
        value={empathy}
        onChange={setEmpathy}
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

