"use client";

// Static HTML - renders immediately, no server queries
// Only checks auth/orgs client-side if needed (after initial render)

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, BookOpen, Sparkles } from "lucide-react";
// No hooks needed - pure static HTML

export default function DashboardPage() {
  // NO API CALLS - render static HTML immediately
  // Auth is handled by middleware and layout
  // Org check is not needed here - user can navigate to onboarding manually if needed

  // Render static HTML immediately - don't wait for checks
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Manage your brand language and tone rules.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Create a brand</CardTitle>
            <CardDescription>Set up a new brand to define and enforce tone of voice rules.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/brands/new">
                <Plus className="mr-2 h-4 w-4" />
                Create brand
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tone of voice</CardTitle>
            <CardDescription>Define how your brand sounds through guided onboarding.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              <span>Start with tone onboarding</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Grammar rules</CardTitle>
            <CardDescription>Configure grammar, punctuation, and style conventions.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              <span>Configure grammar rules</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
