"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RuleInstance {
  id: string;
  ruleDefinition: {
    id: string;
    key: string;
    label: string;
    description: string;
    controlType: string;
    options?: any;
  };
  value: any;
  enabled: boolean;
  appliesTo: string[];
}

export function NumbersRulesSettings() {
  const params = useParams();
  const brandId = params.brandId as string;
  const [rules, setRules] = useState<RuleInstance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/brands/${brandId}/rules?category=numbers`)
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

  const handleUpdate = async (ruleId: string, updates: { enabled?: boolean; value?: any }) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) return;

    try {
      const response = await fetch(`/api/brands/${brandId}/rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ruleDefinitionId: rule.ruleDefinition.id,
          value: updates.value !== undefined ? updates.value : rule.value,
          enabled: updates.enabled !== undefined ? updates.enabled : rule.enabled,
          appliesTo: rule.appliesTo,
        }),
      });

      if (response.ok) {
        setRules((prev) =>
          prev.map((r) =>
            r.id === ruleId
              ? {
                  ...r,
                  enabled: updates.enabled !== undefined ? updates.enabled : r.enabled,
                  value: updates.value !== undefined ? updates.value : r.value,
                }
              : r
          )
        );
      }
    } catch (error) {
      console.error("Error updating rule:", error);
    }
  };

  if (loading) {
    return <div>Loading rules...</div>;
  }

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
          onValueChange={(value) => handleUpdate(rule.id, { value })}
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

    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Numbers & Values Rules</h2>
        <p className="text-sm text-muted-foreground">
          Manage how numbers, dates, times, and currency are formatted across your brand.
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
                {renderRuleControl(rule)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {rule.appliesTo && rule.appliesTo.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Applies to:</Label>
                    <div className="flex gap-2 mt-1">
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

