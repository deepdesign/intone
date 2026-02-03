"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle } from "lucide-react";
import { Rule, RuleStatus, RuleSeverity, EnforcementLevel } from "@/lib/rules/types";

export function GrammarRulesSettings() {
  const params = useParams();
  const brandId = params.brandId as string;
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/brands/${brandId}/rules?type=GRAMMAR_STYLE`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Response is not JSON");
        }
        return res.json();
      })
      .then((data) => {
        setRules(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching rules:", error);
        setLoading(false);
      });
  }, [brandId]);

  const handleUpdate = async (ruleId: string, updates: { status?: RuleStatus; value?: any }) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) return;

    try {
      const response = await fetch(`/api/brands/${brandId}/rules/${ruleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: updates.status,
          value: updates.value !== undefined ? updates.value : rule.value,
        }),
      });

      if (response.ok) {
        const updatedRule = await response.json();
        setRules((prev) => prev.map((r) => (r.id === ruleId ? updatedRule : r)));
      }
    } catch (error) {
      console.error("Error updating rule:", error);
    }
  };

  const renderRuleControl = (rule: RuleInstance) => {
    if (rule.ruleDefinition.controlType === "toggle") {
      return (
        <Switch
          checked={rule.enabled}
          onCheckedChange={(checked) => handleUpdate(rule.id, { enabled: checked })}
        />
      );
    }

    if (rule.ruleDefinition.controlType === "select") {
      const options = rule.ruleDefinition.options?.options || [];
      return (
        <Select
          value={typeof rule.value === "string" ? rule.value : ""}
          onValueChange={(value) => handleUpdate(rule.id, { value, enabled: true })}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt: any) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (rule.ruleDefinition.controlType === "list") {
      const options = rule.ruleDefinition.options?.options || [];
      // Initialize value from rule definition's defaultValue if not set
      // For list controls, defaultValue should be an object with keys matching option keys
      const defaultValue = rule.ruleDefinition.defaultValue || {};
      const currentValue = rule.value && typeof rule.value === "object" && !Array.isArray(rule.value)
        ? rule.value
        : defaultValue;
      
      return (
        <div className="space-y-3">
          {options.map((opt: any) => {
            const optKey = opt.key || opt.value;
            // Check current value, then default value, then option default
            const isChecked = currentValue[optKey] !== undefined 
              ? currentValue[optKey] 
              : (opt.defaultValue !== undefined ? opt.defaultValue : false);
            
            return (
              <div key={optKey} className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor={`${rule.id}-${optKey}`} className="font-normal cursor-pointer flex-1">
                  {opt.label}
                </Label>
                <Switch
                  id={`${rule.id}-${optKey}`}
                  checked={isChecked}
                  onCheckedChange={(checked) => {
                    // Ensure we start with the full current value structure
                    const newValue = { ...currentValue, [optKey]: checked };
                    handleUpdate(rule.id, { value: newValue, enabled: true });
                  }}
                />
              </div>
            );
          })}
        </div>
      );
    }

    return null;
  };

  const renderExamples = (rule: RuleInstance) => {
    const examplesGood = rule.ruleDefinition.examplesGood?.examples || [];
    const examplesBad = rule.ruleDefinition.examplesBad?.examples || [];

    if (examplesGood.length === 0 && examplesBad.length === 0) {
      return null;
    }

    return (
      <div className="mt-4">
        <Label className="text-sm font-medium mb-3 block">Examples</Label>
        <Tabs defaultValue="do" className="w-full">
          <TabsList>
            <TabsTrigger value="do">Do</TabsTrigger>
            <TabsTrigger value="dont">Don't</TabsTrigger>
          </TabsList>
          <TabsContent value="do" className="space-y-2 mt-4">
            {examplesGood.length > 0 ? (
              examplesGood.map((example: any, idx: number) => (
                <div key={idx} className="p-3 bg-muted rounded-lg flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[var(--semantic-success)] mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm">{example.text || JSON.stringify(example)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No examples yet - add one to teach your team.</p>
            )}
          </TabsContent>
          <TabsContent value="dont" className="space-y-2 mt-4">
            {examplesBad.length > 0 ? (
              examplesBad.map((example: any, idx: number) => (
                <div key={idx} className="p-3 bg-muted rounded-lg flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm">{example.text || JSON.stringify(example)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No examples yet - add one to teach your team.</p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  if (loading) {
    return <div>Loading rules...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Grammar Rules</h2>
        <p className="text-sm text-muted-foreground">
          Manage your grammar and punctuation rules. These rules ensure consistency across all written content.
        </p>
      </div>

      <div className="grid gap-4">
        {rules.map((rule) => (
          <Card key={rule.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{rule.ruleDefinition.label}</CardTitle>
                    {rule.enabled && <Badge variant="default">Enabled</Badge>}
                    {!rule.enabled && <Badge variant="secondary">Disabled</Badge>}
                  </div>
                  <CardDescription className="mt-1">{rule.ruleDefinition.description}</CardDescription>
                </div>
                {rule.ruleDefinition.controlType === "toggle" && (
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={(checked) => handleUpdate(rule.id, { enabled: checked })}
                  />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(rule.ruleDefinition.controlType === "select" || rule.ruleDefinition.controlType === "list") && (
                  <div>
                    <Label className="text-sm font-medium mb-3 block">
                      {rule.ruleDefinition.controlType === "select" ? "Setting" : "Options"}
                    </Label>
                    {renderRuleControl(rule)}
                  </div>
                )}

                {rule.ruleDefinition.controlType === "list" && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Enforce this rule</Label>
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(checked) => handleUpdate(rule.id, { enabled: checked })}
                      />
                    </div>
                  </div>
                )}

                {renderExamples(rule)}

                {rule.appliesTo && rule.appliesTo.length > 0 && (
                  <div className="pt-4 border-t">
                    <Label className="text-sm font-medium">Applies to:</Label>
                    <div className="flex gap-2 mt-2">
                      {rule.appliesTo.map((context) => (
                        <Badge key={context} variant="outline">
                          {context}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
