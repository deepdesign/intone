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

export default function HumourStep({ initialValues, onNext, onBack, loading, isFirst }: Props) {
  // Convert old boolean value to 1-5 scale
  const oldValue = initialValues["tone.humour"];
  const defaultValue = oldValue === true ? 5 : oldValue === false ? 1 : typeof oldValue === "number" ? oldValue : 1;
  
  const [humour, setHumour] = useState(defaultValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({ "tone.humour": humour });
  };

  const examples: string[][] = [
    ["Your request has been processed."],
    ["Your request has been processed. (No jokes here!)"],
    ["Your request has been processed. We're on it!"],
    ["Your request has been processed. We've got you covered!"],
    ["Your request has been processed. We're basically wizards at this point! 🎩✨"],
  ];

  const labels = ["None", "Minimal", "Light", "Moderate", "High"];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ToneSlider
        label="Humour"
        description="Humour is hard to scale and harder to localise. Use it only if it's core to your brand."
        value={humour}
        onChange={setHumour}
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

