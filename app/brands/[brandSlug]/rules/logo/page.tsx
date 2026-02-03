"use client";

// Static HTML - renders immediately
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

export default function LogoRulesPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Logo Rules</h1>
        <p className="text-muted-foreground">Define rules for logo usage and placement.</p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Coming soon</CardTitle>
          </div>
          <CardDescription>
            Logo rules will allow you to define guidelines for logo usage, placement, sizing, and spacing across all brand materials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This feature is under development and will be available in a future release.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
