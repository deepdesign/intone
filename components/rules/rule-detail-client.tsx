"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RuleControl } from "./rule-control";
import { RuleDefinition } from "@/lib/rules/definitions";
import { filterExamplesByValue } from "@/lib/rules/example-filter";
import { TestRuleInput } from "./test-rule-input";
import { Loader2 } from "lucide-react";

interface RuleDetailClientProps {
  definition: RuleDefinition;
  userValue?: any;
  userStatus?: string;
  ruleId?: string;
  brandId: string;
  loading?: boolean;
  onStatusChange?: () => void;
}

export function RuleDetailClient({
  definition,
  userValue,
  userStatus: _userStatus,
  ruleId,
  brandId,
  loading = false,
  onStatusChange,
}: RuleDetailClientProps) {
  const params = useParams();
  const currentBrandId = brandId || (params.brandId as string);
  const currentValue = userValue !== undefined ? userValue : definition.defaultValue;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nuance, setNuance] = useState<string>("");
  const [savingNuance, setSavingNuance] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleUpdate = useCallback(async (newValue: any) => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setSaving(true);
    setError(null);

    try {
      if (!ruleId) {
        // Create new rule from definition
        const category = definition.key.startsWith("tone.") ? "tone" 
          : definition.key.startsWith("grammar.") ? "grammar"
          : definition.key.startsWith("numbers.") || definition.key.startsWith("dates.") || definition.key.startsWith("time.") || definition.key.startsWith("currency.") ? "numbers"
          : "tone";

        const typeMap: Record<string, string> = {
          tone: "TONE_VOICE",
          grammar: "GRAMMAR_STYLE",
          numbers: "FORMATTING",
        };

        const response = await fetch(`/api/brands/${currentBrandId}/rules`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: definition.key,
            category: category,
            name: definition.label,
            description: definition.description,
            type: typeMap[category] || "CUSTOM",
            controlType: definition.controlType,
            value: newValue,
            status: "ACTIVE",
          }),
          signal: abortController.signal,
        });

        if (response.ok) {
          if (onStatusChange) onStatusChange();
        } else {
          const errorData = await response.json().catch(() => ({ error: "Failed to create rule" }));
          setError(errorData.error || "Failed to create rule");
        }
      } else {
        // Update existing rule
        const response = await fetch(`/api/brands/${currentBrandId}/rules/${ruleId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: newValue }),
          signal: abortController.signal,
        });
        if (response.ok) {
          if (onStatusChange) onStatusChange();
        } else {
          const errorData = await response.json().catch(() => ({ error: "Failed to update rule" }));
          setError(errorData.error || "Failed to update rule");
        }
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        return;
      }
      console.error("Error updating rule:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setSaving(false);
      abortControllerRef.current = null;
    }
  }, [ruleId, definition, currentBrandId, onStatusChange]);

  // Fetch nuance/edgeNotes if rule exists
  useEffect(() => {
    if (ruleId) {
      fetch(`/api/brands/${currentBrandId}/rules/${ruleId}`)
        .then(async (res) => {
          if (res.ok) {
            const ruleData = await res.json();
            setNuance(ruleData.edgeNotes || "");
          }
        })
        .catch(console.error);
    }
  }, [ruleId, currentBrandId]);

  const handleSaveNuance = async () => {
    if (!ruleId) return;

    setSavingNuance(true);
    try {
      const response = await fetch(`/api/brands/${currentBrandId}/rules/${ruleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ edgeNotes: nuance }),
      });

      if (response.ok) {
        if (onStatusChange) onStatusChange();
      }
    } catch (error) {
      console.error("Error saving nuance:", error);
    } finally {
      setSavingNuance(false);
    }
  };

  // Get examples dynamically based on user's current selection
  const { do: doExamples, dont: dontExamples } = filterExamplesByValue(
    definition.examplesGood,
    definition.examplesBad,
    currentValue,
    definition.controlType
  );

  return (
    <div className="flex-1 p-8">
      <div className="max-w-4xl space-y-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              {error}
            </p>
          </div>
        )}

        <div>
          <h1 className="text-3xl font-bold mb-2">{definition.label}</h1>
          <p className="text-muted-foreground">{definition.description}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{definition.label}</CardTitle>
            {definition.description && (
              <CardDescription>{definition.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <RuleControl
              controlType={definition.controlType}
              value={currentValue}
              onChange={handleUpdate}
              options={definition.options}
              examplesGood={definition.examplesGood}
              disabled={loading || saving}
            />
          </CardContent>
        </Card>

        {(doExamples.length > 0 || dontExamples.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Examples</CardTitle>
              <CardDescription>Do's and Don'ts for this rule</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {doExamples.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-green-600 dark:text-green-400 mb-2 block">
                    Do:
                  </Label>
                  <div className="space-y-2">
                    {doExamples.map((ex, i) => (
                      <div key={i} className="p-3 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-200 dark:border-green-900">
                        <p className="text-sm whitespace-pre-wrap">{ex}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {dontExamples.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-red-600 dark:text-red-400 mb-2 block">
                    Don't:
                  </Label>
                  <div className="space-y-2">
                    {dontExamples.map((ex, i) => (
                      <div key={i} className="p-3 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-200 dark:border-red-900">
                        <p className="text-sm whitespace-pre-wrap">{ex}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {definition.appliesToOptions && definition.appliesToOptions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Applies to</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {definition.appliesToOptions.map((surface) => (
                  <Badge key={surface} variant="outline">
                    {surface}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add nuance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Add nuance</CardTitle>
            <CardDescription>
              Add additional context or notes about how this rule should be applied
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nuance">Notes (optional)</Label>
              <Textarea
                id="nuance"
                value={nuance}
                onChange={(e) => setNuance(e.target.value)}
                placeholder="Add any additional context, exceptions, or guidance for your team..."
                className="min-h-[100px]"
              />
            </div>
            {ruleId && (
              <Button
                onClick={handleSaveNuance}
                disabled={savingNuance}
                size="sm"
                variant="outline"
              >
                {savingNuance ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save notes"
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Test this rule */}
        <TestRuleInput
          brandId={currentBrandId}
          ruleKey={definition.key}
          ruleName={definition.label}
        />
      </div>
    </div>
  );
}



