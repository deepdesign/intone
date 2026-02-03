"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  initialValues: Record<string, any>;
  onNext: (values: Record<string, any>) => void;
  onBack: () => void;
  loading: boolean;
  isFirst: boolean;
  isLast: boolean;
}

export default function CustomVariantStep({ initialValues, onNext, onBack, loading, isFirst }: Props) {
  const [customVariant, setCustomVariant] = useState(initialValues["tone.custom_variant"] || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({ "tone.custom_variant": customVariant.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="customVariant">Custom Tone Variant</Label>
          <p className="text-sm text-muted-foreground">
            Describe any specific tone characteristics, voice qualities, or stylistic preferences that are unique to your brand. 
            This will be incorporated into the tone algorithm to ensure your brand's distinct voice is maintained.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Examples: "We use active voice", "We avoid jargon", "We write in second person", "We use short, punchy sentences"
          </p>
        </div>

        <Textarea
          id="customVariant"
          value={customVariant}
          onChange={(e) => setCustomVariant(e.target.value)}
          placeholder="e.g., We write in a friendly, approachable tone while maintaining professionalism. We prefer active voice and avoid corporate jargon..."
          className="min-h-[150px]"
          disabled={loading}
        />
        <p className="text-xs text-muted-foreground">
          This is optional but recommended for brands with specific voice requirements.
        </p>
      </div>

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

