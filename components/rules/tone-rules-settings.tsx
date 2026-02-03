"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings } from "lucide-react";
import Link from "next/link";
import { Rule, RuleStatus, RuleSeverity, EnforcementLevel } from "@/lib/rules/types";

export function ToneRulesSettings() {
  const params = useParams();
  const router = useRouter();
  const brandId = params.brandId as string;
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/brands/${brandId}/rules?type=TONE_VOICE`)
      .then(async (res) => {
        if (!res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const error = await res.json();
            throw new Error(error.details || error.message || error.error || `HTTP error! status: ${res.status}`);
          } else {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
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
        // Don't show alert for initial load - just log it
        // The UI will show "No tone rules configured" which is fine
        setLoading(false);
      });
  }, [brandId]);

  const handleToggle = async (ruleId: string, status: RuleStatus) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) return;

    try {
      const response = await fetch(`/api/brands/${brandId}/rules/${ruleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
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

  if (loading) {
    return <div>Loading rules...</div>;
  }

  if (rules.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No tone rules configured</CardTitle>
          <CardDescription>
            Start by completing the tone of voice onboarding to set up your brand's tone rules.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href={`/brands/${brandId}/rules/tone/onboarding`}>Start onboarding</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Group rules by key (legacy support) or name
  const onboardingRules = rules.filter(
    (r) =>
      (r.key && (
        r.key.startsWith("tone.locale") ||
        r.key.startsWith("tone.formality") ||
        r.key.startsWith("tone.confidence") ||
        r.key.startsWith("tone.directness") ||
        r.key.startsWith("tone.enthusiasm") ||
        r.key.startsWith("tone.humour") ||
        r.key.startsWith("tone.empathy")
      )) || r.name.toLowerCase().includes("locale") ||
        r.name.toLowerCase().includes("formality") ||
        r.name.toLowerCase().includes("confidence") ||
        r.name.toLowerCase().includes("directness")
  );
  const voiceBoundaries = rules.filter(
    (r) => (r.key && r.key.startsWith("tone.boundaries")) || r.name.toLowerCase().includes("boundary")
  );
  const otherRules = rules.filter(
    (r) => !onboardingRules.includes(r) && !voiceBoundaries.includes(r)
  );

  const renderRuleCard = (rule: Rule) => (
    <Card key={rule.id}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{rule.name}</CardTitle>
              {rule.status === RuleStatus.ACTIVE && <Badge variant="default">Active</Badge>}
              {rule.status === RuleStatus.DRAFT && <Badge variant="secondary">Draft</Badge>}
              {rule.status === RuleStatus.DEPRECATED && <Badge variant="outline">Deprecated</Badge>}
              {rule.severity && (
                <Badge variant={rule.severity === RuleSeverity.CRITICAL ? "destructive" : "secondary"}>
                  {rule.severity}
                </Badge>
              )}
            </div>
            <CardDescription className="mt-1">{rule.description}</CardDescription>
            {rule.rationale && (
              <p className="text-sm text-muted-foreground mt-2">{rule.rationale}</p>
            )}
          </div>
          <Switch
            checked={rule.status === RuleStatus.ACTIVE}
            onCheckedChange={(checked) => 
              handleToggle(rule.id, checked ? RuleStatus.ACTIVE : RuleStatus.DRAFT)
            }
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {rule.surfaces && rule.surfaces.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Applies to:</Label>
              <div className="flex gap-2 mt-1">
                {rule.surfaces.map((surface) => (
                  <Badge key={surface} variant="outline">
                    {surface}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {rule.examples && (rule.examples.do?.length > 0 || rule.examples.dont?.length > 0) && (
            <div>
              <Label className="text-sm font-medium">Examples:</Label>
              <div className="mt-2 space-y-2">
                {rule.examples.do && rule.examples.do.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-[var(--semantic-success)]">Do:</p>
                    {rule.examples.do.map((ex, i) => (
                      <p key={i} className="text-sm mt-1">{ex}</p>
                    ))}
                  </div>
                )}
                {rule.examples.dont && rule.examples.dont.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-destructive">Don't:</p>
                    {rule.examples.dont.map((ex, i) => (
                      <p key={i} className="text-sm mt-1">{ex}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          {rule.suggestions && rule.suggestions.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Suggestions:</Label>
              <p className="text-sm mt-1">{rule.suggestions.join(", ")}</p>
            </div>
          )}
          {rule.enforcement && (
            <div>
              <Label className="text-sm font-medium">Enforcement:</Label>
              <Badge variant="outline" className="mt-1">{rule.enforcement}</Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Tone Rules</h2>
          <p className="text-sm text-muted-foreground">
            Manage your tone of voice rules. These rules guide how your brand sounds across all communications.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/brands/${brandId}/rules/tone/onboarding`}>
            <Settings className="mr-2 h-4 w-4" />
            Edit onboarding
          </Link>
        </Button>
      </div>

      {onboardingRules.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Onboarding Rules</h3>
          <div className="grid gap-4">
            {onboardingRules.map(renderRuleCard)}
          </div>
        </div>
      )}

      {voiceBoundaries.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Voice Boundaries</h3>
          <p className="text-sm text-muted-foreground">
            Define what your brand should avoid to maintain consistent tone.
          </p>
          <div className="grid gap-4">
            {voiceBoundaries.map(renderRuleCard)}
          </div>
        </div>
      )}

      {otherRules.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Other Rules</h3>
          <div className="grid gap-4">
            {otherRules.map(renderRuleCard)}
          </div>
        </div>
      )}
    </div>
  );
}
