"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface Props {
  initialValues: Record<string, any>;
  onNext: (values: Record<string, any>) => void;
  onBack: () => void;
  loading: boolean;
  isFirst: boolean;
  isLast: boolean;
}

const SENTENCE_RULES = [
  {
    key: "tone.sentence.prefer_short",
    label: "Prefer Short Sentences",
    description: "Short sentences are easier to scan and understand, especially on small screens.",
  },
  {
    key: "tone.sentence.one_idea",
    label: "One Idea Per Sentence",
    description: "Each sentence should express a single, clear idea. This improves clarity and readability.",
  },
  {
    key: "tone.sentence.use_contractions",
    label: "Use Contractions",
    description: "Contractions make writing conversational and human. We're instead of we are, can't instead of cannot.",
  },
  {
    key: "tone.sentence.active_voice",
    label: "Active Voice Only",
    description: "In active voice, the subject does the action. This makes it clear who is doing what.",
  },
];

export default function SentenceBehaviorStep({ initialValues, onNext, onBack, loading, isFirst }: Props) {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() => {
    const state: Record<string, boolean> = {};
    for (const rule of SENTENCE_RULES) {
      state[rule.key] = initialValues[rule.key] ?? true;
    }
    return state;
  });

  const handleToggle = (key: string) => {
    setEnabled((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(enabled);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">How should sentences behave?</p>

        <div className="space-y-4">
          {SENTENCE_RULES.map((rule) => (
            <div key={rule.key} className="flex items-start justify-between p-4 border rounded-lg">
              <div className="space-y-1 flex-1">
                <Label htmlFor={rule.key} className="font-medium">
                  {rule.label}
                </Label>
                <p className="text-sm text-muted-foreground">{rule.description}</p>
              </div>
              <Switch
                id={rule.key}
                checked={enabled[rule.key]}
                onCheckedChange={() => handleToggle(rule.key)}
              />
            </div>
          ))}
        </div>
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
