"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  initialValues: Record<string, any>;
  onNext: (values: Record<string, any>) => void;
  onBack: () => void;
  loading: boolean;
  isFirst: boolean;
  isLast: boolean;
}

export default function BrandStep({ initialValues, onNext, onBack, loading, isFirst }: Props) {
  const [brandName, setBrandName] = useState(initialValues.brandName || "");
  const [brandSlug, setBrandSlug] = useState(initialValues.brandSlug || "");
  const [template, setTemplate] = useState(initialValues.template || "product-ui");
  const [skipBrand, setSkipBrand] = useState(false);

  useEffect(() => {
    // Auto-generate slug from name
    if (brandName && !initialValues.brandSlug) {
      const generated = generateSlug(brandName);
      setBrandSlug(generated);
    }
  }, [brandName, initialValues.brandSlug]);

  const generateSlug = (name: string) => {
    if (!name || name.trim().length === 0) {
      return "";
    }
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 50)
      .replace(/-$/, "");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (skipBrand) {
      onNext({ skipBrand: true });
      return;
    }

    if (!brandName.trim()) {
      alert("Brand name is required");
      return;
    }

    const finalSlug = brandSlug || generateSlug(brandName);
    onNext({ 
      brandName: brandName.trim(), 
      brandSlug: finalSlug,
      template 
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground mb-4">
          You can create your first brand now, or skip this step and create one later from the dashboard.
        </p>
        <Button
          type="button"
          variant={skipBrand ? "default" : "outline"}
          onClick={() => setSkipBrand(!skipBrand)}
          className="w-full"
        >
          {skipBrand ? "✓ Skip brand creation" : "Skip for now"}
        </Button>
      </div>

      {!skipBrand && (
        <>
          <div className="space-y-2">
            <Label htmlFor="brandName">Brand Name *</Label>
            <Input
              id="brandName"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="My Brand"
              required={!skipBrand}
              maxLength={100}
            />
            <p className="text-sm text-muted-foreground">
              The name of your brand. You can create more brands later.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="brandSlug">Brand Slug *</Label>
            <Input
              id="brandSlug"
              value={brandSlug}
              onChange={(e) => setBrandSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              placeholder="my-brand"
              required={!skipBrand}
              maxLength={50}
            />
            <p className="text-sm text-muted-foreground">
              A URL-friendly identifier for your brand.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="template">Starting Template</Label>
            <Select value={template} onValueChange={setTemplate}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="product-ui">Product UI</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="support">Support</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Choose a starting template for your brand's tone rules.
            </p>
          </div>
        </>
      )}

      <div className="flex gap-4 justify-end">
        <Button type="button" variant="outline" onClick={onBack} disabled={isFirst || loading}>
          Back
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : skipBrand ? "Skip & Continue" : "Next"}
        </Button>
      </div>
    </form>
  );
}

