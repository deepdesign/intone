"use client";

// Static HTML - renders immediately, no server queries
// Only fetches rule counts client-side (after initial render)

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { Sparkles, Languages, FileText, Image, Download, Accessibility, Plus } from "lucide-react";
import { getRuleDefinitions } from "@/lib/rules/definitions";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function BrandRulesPage() {
  const params = useParams();
  const router = useRouter();
  const brandId = params.brandId as string;
  
  // Get rule definitions from static TypeScript (instant, no queries!)
  const [toneDefs, grammarDefs, numbersDefs] = [
    getRuleDefinitions("tone"),
    getRuleDefinitions("grammar"),
    getRuleDefinitions("numbers"),
  ];

  // Calculate totals from static definitions (instant)
  const totals = {
    tone: toneDefs.length,
    grammar: grammarDefs.length,
    numbers: numbersDefs.length,
  };

  // Progress state - starts at 0, updates in background (non-blocking)
  const [progress, setProgress] = useState({
    tone: { configured: 0, total: totals.tone, percentage: 0 },
    grammar: { configured: 0, total: totals.grammar, percentage: 0 },
    numbers: { configured: 0, total: totals.numbers, percentage: 0 },
  });

  // Fetch rule counts in background (non-blocking, doesn't delay render)
  useEffect(() => {
    if (!brandId) return;

    // Fetch in background - don't block rendering
    fetch(`/api/brands/${brandId}/rules?status=ACTIVE`, {
      credentials: "include",
    })
      .then(async (res) => {
        if (res.status === 401) {
          router.push("/login");
          return;
        }

        if (!res.ok) {
          return; // Silently fail - keep showing 0%
        }

        const rules = await res.json();
        const activeRules = Array.isArray(rules) ? rules : [];

        // Count rules by category
        const toneCount = activeRules.filter((r: any) => r.category === "tone").length;
        const grammarCount = activeRules.filter((r: any) => r.category === "grammar").length;
        const numbersCount = activeRules.filter((r: any) => r.category === "numbers").length;

        setProgress({
          tone: {
            configured: toneCount,
            total: totals.tone,
            percentage: totals.tone > 0 ? Math.round((toneCount / totals.tone) * 100) : 0,
          },
          grammar: {
            configured: grammarCount,
            total: totals.grammar,
            percentage: totals.grammar > 0 ? Math.round((grammarCount / totals.grammar) * 100) : 0,
          },
          numbers: {
            configured: numbersCount,
            total: totals.numbers,
            percentage: totals.numbers > 0 ? Math.round((numbersCount / totals.numbers) * 100) : 0,
          },
        });
      })
      .catch(() => {
        // Silently fail - keep showing 0%
      });
  }, [brandId, router, totals.tone, totals.grammar, totals.numbers]);

  // Progress data is now in state (updated client-side)

  const ruleSections = [
    {
      id: "tone",
      title: "Tone of voice",
      description: "Define how your brand sounds across all communications",
      href: `/brands/${brandId}/rules/tone/settings`,
      icon: Sparkles,
      status: "active" as const,
    },
    {
      id: "grammar",
      title: "Grammar & punctuation",
      description: "Configure grammar, style, and punctuation rules",
      href: `/brands/${brandId}/rules/grammar`,
      icon: Languages,
      status: "active" as const,
    },
    {
      id: "numbers",
      title: "Numbers & values",
      description: "Configure how numbers, dates, times, and currency are formatted",
      href: `/brands/${brandId}/rules/numbers`,
      icon: Languages,
      status: "active" as const,
    },
    {
      id: "terminology",
      title: "Terminology",
      description: "Manage forbidden words and preferred terms",
      href: `/brands/${brandId}/rules/terminology`,
      icon: FileText,
      status: "active" as const,
    },
    {
      id: "accessibility",
      title: "Accessibility & inclusivity",
      description: "Configure accessibility and inclusive language rules",
      href: `/brands/${brandId}/rules/accessibility`,
      icon: Accessibility,
      status: "coming-soon" as const,
    },
    {
      id: "custom",
      title: "Custom rules",
      description: "Create custom rules specific to your brand",
      href: `/brands/${brandId}/rules/custom`,
      icon: Plus,
      status: "active" as const,
    },
  ];

  const handleExport = (format: "markdown" | "json") => {
    window.open(`/api/brands/${brandId}/rules/export?format=${format}`, "_blank");
  };

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Overview</h1>
          <p className="text-muted-foreground">
            Overview of all rules configured for this brand. Manage tone, grammar, terminology, and more.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport("markdown")}>
            <Download className="mr-2 h-4 w-4" />
            Export Markdown
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("json")}>
            <Download className="mr-2 h-4 w-4" />
            Export JSON
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {ruleSections.map((section) => {
          const Icon = section.icon;
          const categoryProgress = progress[section.id as keyof typeof progress] || { total: 0, configured: 0, percentage: 0 };
          const showProgress = section.status === "active" && section.id !== "terminology";
          
          // Use progress from state (starts at 0, updates when fetch completes)
          const displayProgress = categoryProgress;

          return (
            <Card key={section.title}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>{section.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {section.description}
                      </CardDescription>
                    </div>
                  </div>
                  {section.status === "coming-soon" && (
                    <Badge variant="secondary">Coming soon</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {showProgress && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {displayProgress.configured} of {displayProgress.total} rules configured
                      </span>
                      <span className="font-medium">{displayProgress.percentage}%</span>
                    </div>
                    <Progress value={displayProgress.percentage} className="h-2" />
                  </div>
                )}
                {section.status === "active" ? (
                  <Button asChild variant="outline" className="w-full">
                    <Link href={section.href}>Configure</Link>
                  </Button>
                ) : (
                  <Button disabled variant="outline" className="w-full">
                    Coming soon
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
