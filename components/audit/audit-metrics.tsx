"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, FileText, AlertCircle, CheckCircle2, Info } from "lucide-react";

interface AuditMetricsProps {
  audit: {
    id: string;
    overallScore?: number | null;
    compliancePercentage?: number | null;
    totalPages: number;
    totalIssues: number;
    issuesByCategory?: Record<string, number>;
    issuesBySeverity?: Record<string, number>;
    status: string;
  };
}

export function AuditMetrics({ audit }: AuditMetricsProps) {
  const overallScore = audit.overallScore ?? 0;
  const compliancePercentage = audit.compliancePercentage ?? 0;
  const issuesByCategory = audit.issuesByCategory || {};
  const issuesBySeverity = audit.issuesBySeverity || {};

  const severityColors: Record<string, string> = {
    CRITICAL: "destructive",
    MAJOR: "destructive",
    MINOR: "default",
    INFO: "secondary",
  };

  const severityIcons: Record<string, any> = {
    CRITICAL: AlertCircle,
    MAJOR: AlertCircle,
    MINOR: Info,
    INFO: Info,
  };

  const categoryLabels: Record<string, string> = {
    tone: "Tone of Voice",
    grammar: "Grammar & Punctuation",
    numbers: "Numbers & Values",
    terminology: "Terminology",
    other: "Other",
  };

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <Card>
        <CardHeader>
          <CardTitle>Overall score</CardTitle>
          <CardDescription>Comprehensive audit score based on all findings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-4xl font-bold">{Math.round(overallScore)}</span>
                <span className="text-muted-foreground">/ 100</span>
              </div>
              {overallScore >= 80 ? (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Excellent
                </Badge>
              ) : overallScore >= 60 ? (
                <Badge variant="default" className="gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Good
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1">
                  <TrendingDown className="h-3 w-3" />
                  Needs improvement
                </Badge>
              )}
            </div>
            <Progress value={overallScore} className="h-3" />
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Pages audited</div>
                <div className="font-semibold">{audit.totalPages}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Total issues</div>
                <div className="font-semibold">{audit.totalIssues}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Compliance</div>
                <div className="font-semibold">{Math.round(compliancePercentage)}%</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issues by Severity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Issues by severity</CardTitle>
            <CardDescription>Breakdown of issues by severity level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(issuesBySeverity)
                .sort(([a], [b]) => {
                  const order = ["CRITICAL", "MAJOR", "MINOR", "INFO"];
                  return order.indexOf(a) - order.indexOf(b);
                })
                .map(([severity, count]) => {
                  const Icon = severityIcons[severity] || Info;
                  const total = Object.values(issuesBySeverity).reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? (count / total) * 100 : 0;
                  
                  return (
                    <div key={severity} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 text-${severityColors[severity] || "muted-foreground"}`} />
                          <span className="text-sm font-medium">{severity}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{count}</span>
                          <span className="text-xs text-muted-foreground">({Math.round(percentage)}%)</span>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Issues by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Issues by category</CardTitle>
            <CardDescription>Breakdown of issues by rule category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(issuesByCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([category, count]) => {
                  const total = Object.values(issuesByCategory).reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? (count / total) * 100 : 0;
                  
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {categoryLabels[category] || category}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{count}</span>
                          <span className="text-xs text-muted-foreground">({Math.round(percentage)}%)</span>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

