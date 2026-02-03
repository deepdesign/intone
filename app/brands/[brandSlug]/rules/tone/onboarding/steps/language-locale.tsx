"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  initialValues: Record<string, any>;
  onNext: (values: Record<string, any>) => void;
  onBack: () => void;
  loading: boolean;
  isFirst: boolean;
  isLast: boolean;
}

export default function LanguageLocaleStep({ initialValues, onNext, onBack, loading, isFirst }: Props) {
  const [locale, setLocale] = useState(initialValues["tone.locale"] || "en-GB");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({ "tone.locale": locale });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="locale">Language and locale</Label>
        <Select value={locale} onValueChange={setLocale}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en-GB">English (UK)</SelectItem>
            <SelectItem value="en-US">English (US)</SelectItem>
            <SelectItem value="en-AU">English (AU)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Choose the language and region your brand primarily writes in. This affects spelling, dates, punctuation, and formatting.
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
