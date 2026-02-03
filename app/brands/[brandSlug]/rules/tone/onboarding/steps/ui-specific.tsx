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

const UI_RULES = [
  {
    key: "tone.ui.buttons_start_verbs",
    label: "Buttons Start with Verbs",
    description: "Action buttons should start with verbs to clearly indicate what will happen. Save changes, not Changes.",
  },
  {
    key: "tone.ui.use_select_not_click",
    label: "Use 'Select' Instead of 'Click'",
    description: "'Select' is more inclusive than 'Click' as it works for all input methods, not just manual clicks.",
  },
  {
    key: "tone.ui.use_view_not_see",
    label: "Use 'View' Instead of 'See'",
    description: "When giving the user an option or instruction to look at something, use 'View' rather than 'See'.",
  },
  {
    key: "tone.perspective.second_person",
    label: "Use Second Person Perspective",
    description: "Refer to the user using 'you', 'your', 'yours'—not 'me', 'my', 'mine'. This creates a consistent perspective.",
  },
];

export default function UISpecificStep({ initialValues, onNext, onBack, loading, isFirst }: Props) {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() => {
    const state: Record<string, boolean> = {};
    for (const rule of UI_RULES) {
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
        <p className="text-sm text-muted-foreground">How should your product UI sound?</p>

        <div className="space-y-4">
          {UI_RULES.map((rule) => (
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
