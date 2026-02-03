"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Rule, RuleStatus } from "@/lib/rules/types";
import { RuleControl } from "./rule-control";
import { getRuleDefinitionCached, RuleDefinition } from "@/lib/rules/definitions-cache";
import { filterExamplesByValue } from "@/lib/rules/example-filter";
import { TestRuleInput } from "./test-rule-input";

interface RuleDetailViewProps {
  ruleKey: string;
}

export function RuleDetailView({ ruleKey }: RuleDetailViewProps) {
  const params = useParams();
  const brandId = params.brandId as string;
  const [rule, setRule] = useState<Rule | null>(null);
  const [ruleDefinition, setRuleDefinition] = useState<RuleDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch rule definition from cache (cached after first load)
  useEffect(() => {
    getRuleDefinitionCached(ruleKey).then((def) => {
      setRuleDefinition(def);
    });
  }, [ruleKey]);

  // Fetch only the specific rule instance by key (single, fast query)
  useEffect(() => {
    const encodedKey = encodeURIComponent(ruleKey);
    fetch(`/api/brands/${brandId}/rules?key=${encodedKey}`)
      .then(async (res) => {
        if (!res.ok) return null;
        const ruleData = await res.json();
        return ruleData;
      })
      .then((foundRule) => {
        setRule(foundRule || null);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching rule:", error);
        setLoading(false);
      });
  }, [brandId, ruleKey]);

  const handleUpdate = useCallback(async (newValue: any) => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Optimistic update - update UI immediately
    const previousRule = rule;
    if (!rule && ruleDefinition) {
      // Optimistically create a temporary rule
      const optimisticRule: Partial<Rule> = {
        id: "temp",
        brandId,
        key: ruleKey,
        name: ruleDefinition.label,
        description: ruleDefinition.description,
        value: newValue,
        status: RuleStatus.ACTIVE,
      } as any;
      setRule(optimisticRule as Rule);
    } else if (rule) {
      // Optimistically update existing rule
      setRule({ ...rule, value: newValue });
    }

    setSaving(true);
    setError(null);

    try {
      if (!previousRule && ruleDefinition) {
        // Create new rule from definition
        const category = ruleKey.startsWith("tone.") ? "tone" 
          : ruleKey.startsWith("grammar.") ? "grammar"
          : ruleKey.startsWith("numbers.") || ruleKey.startsWith("dates.") || ruleKey.startsWith("time.") || ruleKey.startsWith("currency.") ? "numbers"
          : "tone";

        const typeMap: Record<string, string> = {
          tone: "TONE_VOICE",
          grammar: "GRAMMAR_STYLE",
          numbers: "FORMATTING",
        };

        const response = await fetch(`/api/brands/${brandId}/rules`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: ruleKey,
            category: category,
            name: ruleDefinition.label,
            description: ruleDefinition.description,
            type: typeMap[category] || "CUSTOM",
            controlType: ruleDefinition.controlType,
            value: newValue,
            status: "ACTIVE",
          }),
          signal: abortController.signal,
        });

        if (response.ok) {
          const created = await response.json();
          setRule(created);
        } else {
          // Revert optimistic update
          setRule(previousRule);
          const errorData = await response.json().catch(() => ({ error: "Failed to create rule" }));
          setError(errorData.error || "Failed to create rule");
          console.error("Error creating rule:", errorData);
        }
      } else if (previousRule) {
        // Update existing rule
        const response = await fetch(`/api/brands/${brandId}/rules/${previousRule.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: newValue }),
          signal: abortController.signal,
        });
        if (response.ok) {
          const updated = await response.json();
          setRule(updated);
        } else {
          // Revert optimistic update
          setRule(previousRule);
          const errorData = await response.json().catch(() => ({ error: "Failed to update rule" }));
          setError(errorData.error || "Failed to update rule");
          console.error("Error updating rule:", errorData);
        }
      }
    } catch (error: any) {
      // Revert optimistic update
      setRule(previousRule);
      
      if (error.name === "AbortError") {
        // Request was cancelled, ignore
        return;
      }
      
      console.error("Error updating rule:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setSaving(false);
      abortControllerRef.current = null;
    }
  }, [rule, ruleDefinition, ruleKey, brandId]);

  // Extract examples from rule definition
  const extractExamples = (examplesData: any): string[] => {
    if (!examplesData) return [];
    
    if (Array.isArray(examplesData.examples)) {
      return examplesData.examples.map((ex: any) => {
        if (typeof ex === "string") return ex;
        if (ex.text) return ex.text;
        return JSON.stringify(ex);
      });
    }
    
    if (Array.isArray(examplesData)) {
      return examplesData.map((ex: any) => {
        if (typeof ex === "string") return ex;
        if (ex.text) return ex.text;
        return JSON.stringify(ex);
      });
    }
    
    return [];
  };

  // If no rule definition found, show error
  if (!ruleDefinition) {
    return (
      <div className="flex-1 p-8">
        <Card>
          <CardHeader>
            <CardTitle>Rule definition not found</CardTitle>
            <CardDescription>The rule definition for "{ruleKey}" could not be found.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Use rule definition for display (always available from cache)
  const displayName = rule?.name || ruleDefinition.label || ruleKey;
  const displayDescription = rule?.description || ruleDefinition.description || "";
  const controlType = rule?.controlType || ruleDefinition.controlType || "toggle";
  const currentValue = rule?.value !== undefined ? rule.value : ruleDefinition.defaultValue;
  const ruleOptions = ruleDefinition.options || {};

  // Show loading only for rule instance (value), not definition
  if (loading) {
    return (
      <div className="flex-1 p-8">
        <div className="max-w-4xl space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{displayName}</h1>
            <p className="text-muted-foreground">{displayDescription}</p>
          </div>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Loading rule settings...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Get examples dynamically based on user's current selection
  const { do: doExamples, dont: dontExamples } = filterExamplesByValue(
    ruleDefinition.examplesGood,
    ruleDefinition.examplesBad,
    currentValue,
    controlType
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
        {rule?.rationale && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Why this rule exists</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{rule.rationale}</p>
            </CardContent>
          </Card>
        )}

        <Card className="gap-4">
          <CardHeader className="pb-3">
            <div className="flex-1">
              <CardTitle className="text-xl">{displayName}</CardTitle>
              {displayDescription && (
                <CardDescription className="mt-1">{displayDescription}</CardDescription>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <RuleControl
              controlType={controlType}
              value={currentValue}
              onChange={handleUpdate}
              options={ruleOptions}
              disabled={saving}
            />

            {rule?.surfaces && rule.surfaces.length > 0 && (
              <div className="pt-3 border-t mt-3">
                <Label className="text-sm font-medium mb-2 block">Applies to:</Label>
                <div className="flex gap-2 flex-wrap">
                  {rule.surfaces.map((surface) => (
                    <Badge key={surface} variant="outline">
                      {surface}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
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

        {rule?.suggestions && rule.suggestions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1">
                {rule.suggestions.map((suggestion, i) => (
                  <li key={i} className="text-sm">{suggestion}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {!rule && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Rule not yet configured</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This rule hasn't been configured for your brand yet. Use the control above to set it up.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Test this rule */}
        <TestRuleInput
          brandId={brandId}
          ruleKey={ruleKey}
          ruleName={displayName}
        />
      </div>
    </div>
  );
}


