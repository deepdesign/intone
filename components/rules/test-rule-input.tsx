"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface Change {
  ruleKey: string;
  reason: string;
  original: string;
  revised: string;
}

interface TestRuleInputProps {
  brandId: string;
  ruleKey: string;
  ruleName: string;
}

export function TestRuleInput({ brandId, ruleKey, ruleName }: TestRuleInputProps) {
  const [testInput, setTestInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    output: string;
    changes: Change[];
  } | null>(null);

  const handleTest = async () => {
    if (!testInput.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`/api/brands/${brandId}/rewrite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "rewrite",
          input: testInput,
          // Only apply this specific rule by filtering in the prompt
          // The API will apply all rules, but we'll highlight this one
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to test rule");
      }

      const data = await response.json();
      
      // Filter changes to only show this rule
      const relevantChanges = data.changes?.filter((change: Change) => 
        change.ruleKey === ruleKey || change.ruleKey.includes(ruleKey.split(".")[1] || "")
      ) || [];

      setResult({
        output: data.output,
        changes: relevantChanges,
      });
    } catch (error) {
      console.error("Error testing rule:", error);
      setResult({
        output: testInput,
        changes: [],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Test this rule</CardTitle>
        <CardDescription>
          Enter a sentence to see how this rule would apply
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="test-input">Test sentence</Label>
          <Textarea
            id="test-input"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="Enter text to test this rule..."
            className="min-h-[100px]"
          />
        </div>
        <Button
          onClick={handleTest}
          disabled={!testInput.trim() || loading}
          size="sm"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Test
            </>
          )}
        </Button>

        {result && (
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label>Result</Label>
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm whitespace-pre-wrap">{result.output}</p>
              </div>
            </div>

            {result.changes.length > 0 ? (
              <Accordion type="single" collapsible>
                <AccordionItem value="changes">
                  <AccordionTrigger>
                    Changes made ({result.changes.length})
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      {result.changes.map((change, index) => (
                        <div key={index} className="p-3 bg-muted rounded-md space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{change.ruleKey}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{change.reason}</p>
                          <div className="text-xs space-y-1 pt-2">
                            <p>
                              <span className="text-red-600 dark:text-red-400">- {change.original}</span>
                            </p>
                            <p>
                              <span className="text-green-600 dark:text-green-400">+ {change.revised}</span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ) : (
              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-200 dark:border-green-900">
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✓ No changes needed. The text already follows this rule.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

