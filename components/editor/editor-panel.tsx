"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Info, CheckCircle } from "lucide-react";
import { CopySuggestion } from "@/components/brand-llm/copy-suggestion";
import { ApproveCopyButton } from "@/components/brand-llm/approve-copy-button";
import { RejectCopyButton } from "@/components/brand-llm/reject-copy-button";

interface Change {
  ruleKey: string;
  reason: string;
  original: string;
  revised: string;
}

interface Issue {
  ruleKey: string;
  reason: string;
  original: string;
  suggested: string;
  severity: "error" | "warning" | "suggestion";
}

const STORAGE_KEY_PREFIX = "editor-panel-";

export function EditorPanel() {
  const params = useParams();
  const brandId = params.brandId as string;
  const storageKey = `${STORAGE_KEY_PREFIX}${brandId}`;

  // Initialize state from localStorage if available
  const getInitialState = () => {
    if (typeof window === "undefined") {
      return {
        context: "ui" as const,
        input: "",
        output: "",
        changes: [] as Change[],
        issues: [] as Issue[],
      };
    }

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          context: parsed.context || "ui",
          input: parsed.input || "",
          output: parsed.output || "",
          changes: parsed.changes || [],
          issues: parsed.issues || [],
        };
      }
    } catch (error) {
      console.error("Error loading saved state:", error);
    }

    return {
      context: "ui" as const,
      input: "",
      output: "",
      changes: [] as Change[],
      issues: [] as Issue[],
    };
  };

  const initialState = getInitialState();
  const [context, setContext] = useState<"ui" | "marketing" | "support">(initialState.context);
  const [input, setInput] = useState(initialState.input);
  const [output, setOutput] = useState(initialState.output);
  const [changes, setChanges] = useState<Change[]>(initialState.changes);
  const [issues, setIssues] = useState<Issue[]>(initialState.issues);
  const [loading, setLoading] = useState(false);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stateToSave = {
        context,
        input,
        output,
        changes,
        issues,
      };
      localStorage.setItem(storageKey, JSON.stringify(stateToSave));
    } catch (error) {
      console.error("Error saving state:", error);
    }
  }, [context, input, output, changes, issues, storageKey]);

  const handleLint = async () => {
    if (!input.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/brands/${brandId}/lint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input,
          context,
        }),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const error = await response.json();
          throw new Error(error.error || "Failed to lint");
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Response is not JSON");
      }

      const data = await response.json();
      setIssues(data.issues || []);
      setOutput("");
      setChanges([]);
    } catch (error) {
      console.error("Error linting:", error);
      alert(error instanceof Error ? error.message : "Failed to lint. Make sure your OpenAI API key is configured.");
    } finally {
      setLoading(false);
    }
  };


  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-[var(--semantic-warning)]" />;
      default:
        return <Info className="h-4 w-4 text-[var(--semantic-info)]" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      case "warning":
        return <Badge variant="secondary" className="bg-[var(--semantic-warning)]/10 text-[var(--semantic-warning)]">Warning</Badge>;
      default:
        return <Badge variant="secondary">Suggestion</Badge>;
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Input</CardTitle>
            <div className="flex gap-2">
              <Select value={context} onValueChange={(v) => setContext(v as typeof context)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ui">UI</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="input">Text</Label>
            <Textarea
              id="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter text to rewrite or lint..."
              className="min-h-[300px] font-mono text-sm"
            />
          </div>
          <Button onClick={handleLint} disabled={!input.trim() || loading} className="w-full">
            {loading ? "Processing..." : "Lint"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Issues</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
              {issues.length > 0 ? (
                <div className="space-y-2">
                  {issues.map((issue, idx) => (
                    <div key={idx} className="p-3 border rounded-md text-sm">
                      <div className="flex items-center gap-2 mb-2">
                        {getSeverityIcon(issue.severity)}
                        {getSeverityBadge(issue.severity)}
                        <Badge variant="outline">{issue.ruleKey}</Badge>
                      </div>
                      <p className="text-muted-foreground mb-2">{issue.reason}</p>
                      <div className="space-y-1">
                        <div>
                          <span className="text-xs text-muted-foreground">Found: </span>
                          <span className="text-destructive">{issue.original}</span>
                        </div>
                        {issue.suggested && (
                          <div className="space-y-2">
                            <div>
                              <span className="text-xs text-muted-foreground">Suggest: </span>
                              <span className="text-[var(--semantic-success)]">{issue.suggested}</span>
                            </div>
                            <div className="flex gap-2">
                              <ApproveCopyButton
                                brandId={brandId}
                                text={issue.suggested}
                                source="FIXED_FROM_LINT"
                                context={context}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      <CopySuggestion
                        brandId={brandId}
                        queryText={issue.original}
                        context="LINT"
                        onApply={(text) => {
                          // Update the issue's suggested fix
                          const updatedIssues = [...issues];
                          updatedIssues[idx] = { ...issue, suggested: text };
                          setIssues(updatedIssues);
                        }}
                        className="mt-2"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  {loading ? "Analyzing..." : "No issues found. Enter text and click Lint to check."}
                </div>
              )}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
