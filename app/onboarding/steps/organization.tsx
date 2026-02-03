"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface Props {
  initialValues: Record<string, any>;
  onNext: (values: Record<string, any>) => void;
  onBack: () => void;
  loading: boolean;
  isFirst: boolean;
  isLast: boolean;
}

export default function OrganizationStep({ initialValues, onNext, onBack, loading, isFirst }: Props) {
  const [orgName, setOrgName] = useState(initialValues.orgName || "");
  const [orgSlug, setOrgSlug] = useState(initialValues.orgSlug || "");
  const [slugError, setSlugError] = useState("");

  useEffect(() => {
    // Auto-generate slug from name
    if (orgName && !initialValues.orgSlug) {
      const generated = generateSlug(orgName);
      setOrgSlug(generated);
    }
  }, [orgName, initialValues.orgSlug]);

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

  const validateSlug = (slug: string): boolean => {
    if (!slug || slug.trim().length === 0) {
      setSlugError("Slug cannot be empty");
      return false;
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      setSlugError("Slug can only contain lowercase letters, numbers, and hyphens");
      return false;
    }
    if (slug.length > 50) {
      setSlugError("Slug cannot exceed 50 characters");
      return false;
    }
    setSlugError("");
    return true;
  };

  const handleSlugChange = (value: string) => {
    const slug = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setOrgSlug(slug);
    validateSlug(slug);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orgName.trim()) {
      alert("Organisation name is required");
      return;
    }

    const finalSlug = orgSlug || generateSlug(orgName);
    if (!validateSlug(finalSlug)) {
      return;
    }

    onNext({ orgName: orgName.trim(), orgSlug: finalSlug });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="orgName">Organisation name *</Label>
        <Input
          id="orgName"
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          placeholder="Acme Inc"
          required
          maxLength={100}
        />
        <p className="text-sm text-muted-foreground">
          The name of your organisation. This will be visible to all members.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="orgSlug">Organisation slug *</Label>
        <Input
          id="orgSlug"
          value={orgSlug}
          onChange={(e) => handleSlugChange(e.target.value)}
          placeholder="acme-inc"
          required
          maxLength={50}
        />
        {slugError && <p className="text-sm text-destructive">{slugError}</p>}
        <p className="text-sm text-muted-foreground">
          A URL-friendly identifier for your organisation. Only lowercase letters, numbers, and hyphens are allowed.
        </p>
      </div>

      <div className="flex gap-4 justify-end">
        <Button type="button" variant="outline" onClick={onBack} disabled={isFirst || loading}>
          Back
        </Button>
        <Button type="submit" disabled={loading || !orgName.trim() || !orgSlug.trim()}>
          {loading ? "Saving..." : "Next"}
        </Button>
      </div>
    </form>
  );
}

