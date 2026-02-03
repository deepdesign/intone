"use client";

// Static HTML - renders immediately, no server queries
// Data fetches in background (non-blocking)

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, Loader2 } from "lucide-react";

export default function NewSnippetPage() {
  const params = useParams();
  const router = useRouter();
  const brandId = params.brandId as string;
  const [snippetName, setSnippetName] = useState("");
  const [snippetSlug, setSnippetSlug] = useState("");
  const [variantName, setVariantName] = useState("");
  const [variantContent, setVariantContent] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!snippetName.trim() || !snippetSlug.trim() || !variantName.trim() || !variantContent.trim()) {
      return;
    }

    setSaving(true);
    try {
      // First create the snippet
      const snippetResponse = await fetch(`/api/brands/${brandId}/snippets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: snippetName.trim(),
          slug: snippetSlug.trim(),
        }),
      });

      if (!snippetResponse.ok) {
        const error = await snippetResponse.json();
        throw new Error(error.error || "Failed to create snippet");
      }

      const snippet = await snippetResponse.json();

      // Then create the first variant
      const variantResponse = await fetch(
        `/api/brands/${brandId}/snippets/${snippet.id}/variants`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: variantName.trim(),
            content: variantContent.trim(),
          }),
        }
      );

      if (!variantResponse.ok) {
        const error = await variantResponse.json();
        throw new Error(error.error || "Failed to create variant");
      }

      // Redirect to the snippet page
      router.push(`/brands/${brandId}/assets/${snippetSlug.trim()}`);
    } catch (error) {
      console.error("Error creating snippet:", error);
      alert(error instanceof Error ? error.message : "Failed to create snippet");
      setSaving(false);
    }
  };

  // Render static HTML immediately - no blocking operations
  return (
    <div className="flex gap-6 h-[calc(100vh-200px)]">
      {/* Left nav placeholder - matches layout of detail page */}
      <div className="w-64 border-r pr-6" />

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <Card>
          <CardHeader>
            <CardTitle>New snippet</CardTitle>
            <CardDescription>
              Create a new snippet category with your first variant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="snippet-name">
                  Snippet name *
                </Label>
                <Input
                  id="snippet-name"
                  value={snippetName}
                  onChange={(e) => setSnippetName(e.target.value)}
                  placeholder="e.g., Terms and Conditions"
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="snippet-slug">
                  Slug *
                </Label>
                <Input
                  id="snippet-slug"
                  value={snippetSlug}
                  onChange={(e) => setSnippetSlug(e.target.value)}
                  placeholder="terms-conditions"
                  className="font-mono"
                  disabled={saving}
                />
                <p className="text-xs text-muted-foreground">
                  URL-friendly identifier
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-medium">First variant</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="variant-name">
                    Variant name *
                  </Label>
                  <Input
                    id="variant-name"
                    value={variantName}
                    onChange={(e) => setVariantName(e.target.value)}
                    placeholder="e.g., Full, Short, Link"
                    disabled={saving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="variant-content">
                    Content *
                  </Label>
                  <Textarea
                    id="variant-content"
                    value={variantContent}
                    onChange={(e) => setVariantContent(e.target.value)}
                    placeholder="Enter the snippet content..."
                    className="min-h-[300px] font-mono text-sm"
                    disabled={saving}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => router.back()}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={saving || !snippetName.trim() || !snippetSlug.trim() || !variantName.trim() || !variantContent.trim()}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Create snippet
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
