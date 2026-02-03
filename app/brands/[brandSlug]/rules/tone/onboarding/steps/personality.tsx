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

const PERSONALITY_RULES = [
  { key: "tone.personality.exclude_humor", label: "Avoid Humour", description: "Humour can be powerful but difficult to scale consistently." },
  { key: "tone.personality.exclude_slang", label: "Avoid Slang", description: "Use standard, formal language and avoid casual slang terms." },
  { key: "tone.personality.exclude_emoji", label: "Avoid Emojis", description: "Emojis are hard to localise and aren't very accessible." },
  { key: "tone.personality.exclude_exclamation", label: "Avoid Exclamation Marks", description: "Exclamation marks rarely work in professional tone." },
  { key: "tone.personality.exclude_rhetorical", label: "Avoid Rhetorical Questions", description: "Rhetorical questions can feel manipulative." },
];

export default function PersonalityStep({ initialValues, onNext, onBack, loading, isFirst }: Props) {
  const [exclusions, setExclusions] = useState<Record<string, boolean>>(() => {
    const state: Record<string, boolean> = {};
    for (const rule of PERSONALITY_RULES) {
      state[rule.key] = initialValues[rule.key] ?? true;
    }
    return state;
  });

  const handleToggle = (key: string) => {
    setExclusions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(exclusions);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Which of these should your brand avoid? Exclusions are as important as inclusions—they avoid
          inconsistency at scale.
        </p>

        <div className="space-y-4">
          {PERSONALITY_RULES.map((rule) => (
            <div key={rule.key} className="flex items-start justify-between p-4 border rounded-lg">
              <div className="space-y-1 flex-1">
                <Label htmlFor={rule.key} className="font-medium">
                  {rule.label}
                </Label>
                <p className="text-sm text-muted-foreground">{rule.description}</p>
              </div>
              <Switch
                id={rule.key}
                checked={exclusions[rule.key]}
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
