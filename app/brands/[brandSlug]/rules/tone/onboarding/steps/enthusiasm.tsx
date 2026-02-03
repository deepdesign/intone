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

export default function EnthusiasmStep({ initialValues, onNext, onBack, loading, isFirst }: Props) {
  // Convert old boolean value to 1-5 scale (1 = very low, 5 = very high)
  // If old value was true (low enthusiasm), default to 1, otherwise 3 (neutral)
  const oldValue = initialValues["tone.enthusiasm"];
  const defaultValue = oldValue === true ? 1 : oldValue === false ? 5 : typeof oldValue === "number" ? oldValue : 3;
  
  const [enthusiasm, setEnthusiasm] = useState(defaultValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({ "tone.enthusiasm": enthusiasm });
  };

  const examples = [
    "Your request has been processed.",
    "We've processed your request.",
    "Great! We've processed your request.",
    "Excellent! We've successfully processed your request.",
    "Amazing! We're thrilled to let you know your request has been processed successfully!",
  ];

  const labels = ["Very Low", "Low", "Neutral", "High", "Very High"];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ToneSlider
        label="Enthusiasm"
        description="Overuse of excitement can reduce trust. Most brands benefit from restraint."
        value={enthusiasm}
        onChange={setEnthusiasm}
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

