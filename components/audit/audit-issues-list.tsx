"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, CheckCircle2, XCircle, Clock, Filter } from "lucide-react";
import { AuditIssueDetail } from "./audit-issue-detail";

interface AuditIssue {
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
}

interface AuditIssuesListProps {
  auditId: string;
  brandId: string;
}

export function AuditIssuesList({ auditId, brandId }: AuditIssuesListProps) {
  const [issues, setIssues] = useState<AuditIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedIssue, setSelectedIssue] = useState<AuditIssue | null>(null);

  useEffect(() => {
    fetchIssues();
  }, [auditId]);

  const fetchIssues = async () => {
    try {
      const response = await fetch(`/api/brands/${brandId}/audit/${auditId}`);
      if (response.ok) {
        const data = await response.json();
        setIssues(data.issues || []);
      }
    } catch (error) {
      console.error("Error fetching issues:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateIssueStatus = async (issueId: string, status: string) => {
    try {
      const response = await fetch(`/api/brands/${brandId}/audit/${auditId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueId, status }),
      });

      if (response.ok) {
        // Update local state
        setIssues((prev) =>
          prev.map((issue) =>
            issue.id === issueId
              ? { ...issue, status, reviewedAt: status === "REVIEWED" ? new Date() : undefined, fixedAt: status === "FIXED" ? new Date() : undefined }
              : issue
          )
        );
      }
    } catch (error) {
      console.error("Error updating issue status:", error);
    }
  };

  // Group issues by category
  const issuesByCategory: Record<string, AuditIssue[]> = {};
  issues.forEach((issue) => {
    const category = issue.category || "other";
    if (!issuesByCategory[category]) {
      issuesByCategory[category] = [];
    }
    issuesByCategory[category].push(issue);
  });

  // Filter issues
  const filteredIssues = Object.entries(issuesByCategory)
    .filter(([category]) => selectedCategory === "all" || category === selectedCategory)
    .flatMap(([, categoryIssues]) =>
      categoryIssues.filter((issue) => {
        if (selectedSeverity !== "all" && issue.severity !== selectedSeverity) return false;
        if (selectedStatus !== "all" && issue.status !== selectedStatus) return false;
        return true;
      })
    );

  const categoryLabels: Record<string, string> = {
    tone: "Tone of Voice",
    grammar: "Grammar & Punctuation",
    numbers: "Numbers & Values",
    terminology: "Terminology",
    other: "Other",
  };

  const severityColors: Record<string, string> = {
    CRITICAL: "destructive",
    MAJOR: "destructive",
    MINOR: "default",
    INFO: "secondary",
  };

  const statusColors: Record<string, string> = {
    PENDING: "secondary",
    REVIEWED: "default",
    FIXED: "default",
    IGNORED: "outline",
  };

  if (loading) {
    return <div>Loading issues...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Issues</CardTitle>
              <CardDescription>
                {filteredIssues.length} of {issues.length} issues
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.keys(issuesByCategory).map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {categoryLabels[cat] || cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                  <SelectItem value="MAJOR">Major</SelectItem>
                  <SelectItem value="MINOR">Minor</SelectItem>
                  <SelectItem value="INFO">Info</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="REVIEWED">Reviewed</SelectItem>
                  <SelectItem value="FIXED">Fixed</SelectItem>
                  <SelectItem value="IGNORED">Ignored</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={Object.keys(issuesByCategory)[0] || "all"}>
            <TabsList className="grid w-full grid-cols-4">
              {Object.keys(issuesByCategory).map((category) => (
                <TabsTrigger key={category} value={category}>
                  {categoryLabels[category] || category} ({issuesByCategory[category].length})
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(issuesByCategory).map(([category, categoryIssues]) => {
              const filtered = categoryIssues.filter((issue) => {
                if (selectedSeverity !== "all" && issue.severity !== selectedSeverity) return false;
                if (selectedStatus !== "all" && issue.status !== selectedStatus) return false;
                return true;
              });

              return (
                <TabsContent key={category} value={category} className="space-y-3">
                  {filtered.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No issues found in this category with the selected filters.
                    </div>
                  ) : (
                    filtered.map((issue) => (
                      <Card
                        key={issue.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setSelectedIssue(issue)}
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant={severityColors[issue.severity] as any}>
                                  {issue.severity}
                                </Badge>
                                <Badge variant={statusColors[issue.status] as any}>
                                  {issue.status}
                                </Badge>
                                {issue.pageUrl && (
                                  <span className="text-xs text-muted-foreground truncate max-w-xs">
                                    {issue.pageUrl}
                                  </span>
                                )}
                                {issue.pageNumber && (
                                  <span className="text-xs text-muted-foreground">
                                    Page {issue.pageNumber}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm">
                                <span className="font-medium">Issue: </span>
                                <span className="text-muted-foreground">{issue.issueText.substring(0, 100)}...</span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {issue.message}
                              </div>
                              {issue.suggestedFix && (
                                <div className="text-sm">
                                  <span className="font-medium">Suggested fix: </span>
                                  <span className="text-muted-foreground">{issue.suggestedFix}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateIssueStatus(issue.id, issue.status === "REVIEWED" ? "PENDING" : "REVIEWED");
                                }}
                              >
                                {issue.status === "REVIEWED" ? (
                                  <>
                                    <Clock className="h-3 w-3 mr-1" />
                                    Unreview
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Mark Reviewed
                                  </>
                                )}
                              </Button>
                              {issue.status !== "FIXED" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateIssueStatus(issue.id, "FIXED");
                                  }}
                                >
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Mark Fixed
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>

      {selectedIssue && (
        <AuditIssueDetail
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
          onStatusChange={(status) => updateIssueStatus(selectedIssue.id, status)}
        />
      )}
    </div>
  );
}

