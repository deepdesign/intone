"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Copy, X, CheckCircle2, Clock, XCircle } from "lucide-react";
import { CopySuggestion } from "@/components/brand-llm/copy-suggestion";
import { ApproveCopyButton } from "@/components/brand-llm/approve-copy-button";

interface AuditIssueDetailProps {
  issue: {
    id: string;
    pageUrl?: string | null;
    pageNumber?: number | null;
    issueText: string;
    contextBefore?: string | null;
    contextAfter?: string | null;
    severity: string;
    message: string;
    suggestedFix?: string | null;
    category?: string | null;
    status: string;
    rule: {
      id: string;
      name: string;
      category?: string | null;
    };
  };
  onClose: () => void;
  onStatusChange: (status: string) => void;
}

export function AuditIssueDetail({ issue, onClose, onStatusChange }: AuditIssueDetailProps) {
  const params = useParams();
  const brandId = params.brandId as string;
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const severityColors: Record<string, string> = {
    CRITICAL: "destructive",
    MAJOR: "destructive",
    MINOR: "default",
    INFO: "secondary",
  };

  const fullContext = `${issue.contextBefore || ""}${issue.issueText}${issue.contextAfter || ""}`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle>Issue details</CardTitle>
              <CardDescription className="mt-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={severityColors[issue.severity] as any}>
                    {issue.severity}
                  </Badge>
                  <Badge variant="outline">{issue.category || "other"}</Badge>
                  {issue.pageUrl && (
                    <span className="text-xs text-muted-foreground">
                      {issue.pageUrl}
                    </span>
                  )}
                  {issue.pageNumber && (
                    <span className="text-xs text-muted-foreground">
                      Page {issue.pageNumber}
                    </span>
                  )}
                </div>
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Rule Information */}
          <div>
            <Label className="text-sm font-medium">Rule</Label>
            <p className="text-sm text-muted-foreground mt-1">{issue.rule.name}</p>
          </div>

          {/* Why it's wrong */}
          <div>
            <Label className="text-sm font-medium">Why it's wrong</Label>
            <p className="text-sm text-muted-foreground mt-1">{issue.message}</p>
          </div>

          {/* Context */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Context</Label>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm relative">
              <div className="text-muted-foreground">
                {issue.contextBefore && (
                  <span className="opacity-60">{issue.contextBefore}</span>
                )}
                <span className="bg-destructive/20 text-destructive font-semibold px-1 rounded">
                  {issue.issueText}
                </span>
                {issue.contextAfter && (
                  <span className="opacity-60">{issue.contextAfter}</span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(fullContext)}
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Suggested Fix */}
          {issue.suggestedFix && (
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium mb-2 block">Suggested fix</Label>
                <div className="bg-muted p-4 rounded-lg font-mono text-sm relative">
                  <div className="text-foreground">{issue.suggestedFix}</div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(issue.suggestedFix!)}
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <ApproveCopyButton
                  brandId={brandId}
                  text={issue.suggestedFix}
                  source="FIXED_FROM_AUDIT"
                  sourceId={issue.id}
                  context={issue.category || undefined}
                />
              </div>
              <CopySuggestion
                brandId={brandId}
                queryText={issue.issueText}
                context="AUDIT"
                onApply={(text) => {
                  // Update the suggested fix
                  // Note: This would need to be handled via API to update the issue
                  copyToClipboard(text);
                }}
              />
            </div>
          )}

          {/* Status Actions */}
          <div className="flex items-center gap-2 pt-4 border-t">
            <Button
              variant={issue.status === "REVIEWED" ? "default" : "outline"}
              size="sm"
              onClick={() => onStatusChange(issue.status === "REVIEWED" ? "PENDING" : "REVIEWED")}
            >
              {issue.status === "REVIEWED" ? (
                <>
                  <Clock className="h-4 w-4 mr-1" />
                  Unreview
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Mark Reviewed
                </>
              )}
            </Button>
            {issue.status !== "FIXED" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusChange("FIXED")}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Mark Fixed
              </Button>
            )}
            {issue.status !== "IGNORED" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusChange("IGNORED")}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Ignore
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

