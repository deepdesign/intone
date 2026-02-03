"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ComingSoon from "@/components/coming-soon";

export default function AccessibilityPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Accessibility & inclusivity</h1>
        <p className="text-muted-foreground">
          Configure accessibility and inclusive language rules for your brand.
        </p>
      </div>
      <ComingSoon />
    </div>
  );
}

