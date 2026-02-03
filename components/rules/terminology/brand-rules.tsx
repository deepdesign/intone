"use client";

// Client component - fetches data client-side (non-blocking)
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface Rule {
  id: string;
  name: string;
  description: string | null;
}

export function BrandRules() {
  const params = useParams();
  const brandId = params.brandId as string;
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch brand-specific terminology rules client-side
    fetch(`/api/brands/${brandId}/rules?type=TERMINOLOGY`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setRules(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error("Error fetching brand rules:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [brandId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Brand Rules</h3>
        <p className="text-sm text-muted-foreground">
          Brand-specific terminology rules and guidelines.
        </p>
      </div>

      {rules.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No brand rules</CardTitle>
            <CardDescription>No brand-specific terminology rules have been created yet.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => (
            <Card key={rule.id}>
              <CardHeader>
                <CardTitle>{rule.name}</CardTitle>
                {rule.description && (
                  <CardDescription>{rule.description}</CardDescription>
                )}
              </CardHeader>
              {rule.description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">{rule.description}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

