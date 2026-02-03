"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Org {
  id: string;
  name: string;
  slug: string;
}

export default function NewBrandPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    orgId: "",
    locale: "en-GB",
    template: "product-ui",
  });

  useEffect(() => {
    // Fetch user's orgs
    fetch("/api/orgs")
      .then(async (res) => {
        const contentType = res.headers.get("content-type");
        const isJson = contentType && contentType.includes("application/json");
        
        if (!res.ok) {
          let errorMessage = `HTTP error! status: ${res.status}`;
          if (isJson) {
            try {
              const error = await res.json();
              errorMessage = error.error || error.message || errorMessage;
              console.error("Error response from /api/orgs:", error);
              // Log full error details in development
              if (error.stack) {
                console.error("Error stack:", error.stack);
              }
            } catch (e) {
              console.error("Failed to parse error JSON:", e);
            }
          } else {
            // Try to read as text if not JSON
            try {
              const text = await res.text();
              console.error("Non-JSON error response:", text);
              errorMessage = text || errorMessage;
            } catch (e) {
              console.error("Failed to read error response:", e);
            }
          }
          throw new Error(errorMessage);
        }
        
        if (!isJson) {
          throw new Error("Response is not JSON");
        }
        
        const data = await res.json();
        return data;
      })
      .then((data) => {
        setOrgs(data);
        // Auto-select first org if available
        if (data.length > 0) {
          setFormData((prev) => ({ ...prev, orgId: data[0].id }));
        }
        setLoadingOrgs(false);
      })
      .catch((error) => {
        console.error("Error fetching orgs:", error);
        setLoadingOrgs(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.orgId) {
      alert("Please select or create an organisation first");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create brand");
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Response is not JSON");
      }

      const brand = await response.json();
      router.push(`/brands/${brand.id}/rules/tone/onboarding`);
    } catch (error) {
      console.error("Error creating brand:", error);
      alert(error instanceof Error ? error.message : "Failed to create brand");
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    if (!name || name.trim().length === 0) {
      return "my-organization";
    }
    let slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    // Ensure slug is not empty
    if (slug.length === 0) {
      slug = "my-organization";
    }
    // Ensure slug doesn't exceed 50 characters
    if (slug.length > 50) {
      slug = slug.substring(0, 50).replace(/-$/, "");
    }
    return slug;
  };

  return (
    <div className="container mx-auto py-12 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Create a new brand</CardTitle>
          <CardDescription>Set up a brand to define and enforce tone of voice rules.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {loadingOrgs ? (
              <div className="text-sm text-muted-foreground">Loading organisations...</div>
            ) : orgs.length === 0 ? (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="text-sm font-medium">No organisation found</p>
                <p className="text-sm text-muted-foreground">
                  An organisation should have been created automatically when you signed up. Please refresh the page or contact support if this issue persists.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                >
                  Refresh page
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="orgId">Organisation</Label>
                <Select
                  value={formData.orgId}
                  onValueChange={(value) => setFormData({ ...formData, orgId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an organisation" />
                  </SelectTrigger>
                  <SelectContent>
                    {orgs.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Brand name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setFormData({
                    ...formData,
                    name,
                    slug: formData.slug || generateSlug(name),
                  });
                }}
                placeholder="Acme Inc"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    slug: generateSlug(e.target.value),
                  })
                }
                placeholder="acme-inc"
                pattern="[a-z0-9-]+"
                required
              />
              <p className="text-sm text-muted-foreground">
                Used in URLs. Lowercase letters, numbers, and hyphens only.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="locale">Language and locale</Label>
              <Select
                value={formData.locale}
                onValueChange={(value) => setFormData({ ...formData, locale: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en-GB">English (UK)</SelectItem>
                  <SelectItem value="en-US">English (US)</SelectItem>
                  <SelectItem value="en-AU">English (AU)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template">Starting template</Label>
              <Select
                value={formData.template}
                onValueChange={(value) => setFormData({ ...formData, template: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product-ui">Product UI (default)</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-4">
              <Button 
                type="submit" 
                disabled={loading || !formData.orgId || loadingOrgs || !formData.name || !formData.slug}
              >
                {loading ? "Creating..." : "Create brand"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

