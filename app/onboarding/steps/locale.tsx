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

export default function LocaleStep({ initialValues, onNext, onBack, loading, isFirst }: Props) {
  const [locale, setLocale] = useState(initialValues.locale || "en-GB");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({ locale });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="locale">Primary Language and Locale *</Label>
        <Select value={locale} onValueChange={setLocale}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en-GB">English (UK)</SelectItem>
            <SelectItem value="en-US">English (US)</SelectItem>
            <SelectItem value="en-AU">English (AU)</SelectItem>
            <SelectItem value="en-CA">English (Canada)</SelectItem>
            <SelectItem value="fr-FR">French (France)</SelectItem>
            <SelectItem value="fr-CA">French (Canada)</SelectItem>
            <SelectItem value="de-DE">German (Germany)</SelectItem>
            <SelectItem value="es-ES">Spanish (Spain)</SelectItem>
            <SelectItem value="es-MX">Spanish (Mexico)</SelectItem>
            <SelectItem value="it-IT">Italian (Italy)</SelectItem>
            <SelectItem value="pt-BR">Portuguese (Brazil)</SelectItem>
            <SelectItem value="ja-JP">Japanese (Japan)</SelectItem>
            <SelectItem value="zh-CN">Chinese (Simplified)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Choose the primary language and region for your organisation. This will be used as the default for new brands.
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

