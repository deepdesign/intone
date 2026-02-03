"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  initialValues: Record<string, any>;
  onNext: (values: Record<string, any>) => void;
  onBack: () => void;
  loading: boolean;
  isFirst: boolean;
  isLast: boolean;
}

export default function SummaryStep({ initialValues, onNext, onBack, loading, isFirst }: Props) {
  const handleComplete = () => {
    onNext({});
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <h3 className="font-semibold">Organisation</h3>
              <p className="text-sm text-muted-foreground">Name: {initialValues.orgName}</p>
              <p className="text-sm text-muted-foreground">Slug: {initialValues.orgSlug}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <h3 className="font-semibold">Locale</h3>
              <p className="text-sm text-muted-foreground">{initialValues.locale}</p>
            </div>
          </CardContent>
        </Card>

        {initialValues.brandName && !initialValues.skipBrand && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <h3 className="font-semibold">First Brand</h3>
                <p className="text-sm text-muted-foreground">Name: {initialValues.brandName}</p>
                <p className="text-sm text-muted-foreground">Slug: {initialValues.brandSlug}</p>
                <p className="text-sm text-muted-foreground">Template: {initialValues.template}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {initialValues.skipBrand && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <h3 className="font-semibold">First Brand</h3>
                <p className="text-sm text-muted-foreground">Skipped - you can create one later from the dashboard</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex gap-4 justify-end">
        <Button type="button" variant="outline" onClick={onBack} disabled={isFirst || loading}>
          Back
        </Button>
        <Button onClick={handleComplete} disabled={loading}>
          {loading ? "Creating..." : "Complete Setup"}
        </Button>
      </div>
    </div>
  );
}

