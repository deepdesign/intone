"use client";

// Static HTML - renders immediately, no server queries
// Data fetches in background (non-blocking)

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, ExternalLink, Loader2, Copy, Check } from "lucide-react";
import Link from "next/link";

interface Snippet {
  id: string;
  name: string;
  slug: string;
  url: string | null;
  variants: Array<{
    id: string;
    name: string;
    content: string;
  }>;
}

export default function SnippetPage() {
  const params = useParams();
  const router = useRouter();
  const brandId = params.brandId as string;
  const slug = params.slug as string;
  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(false); // Start as false - don't block render
  const [saving, setSaving] = useState(false);
  const [activeVariant, setActiveVariant] = useState<string | null>(null);
  const [editingVariant, setEditingVariant] = useState<{
    id: string;
    name: string;
    content: string;
  } | null>(null);
  const [newVariantName, setNewVariantName] = useState("");
  const [newVariantContent, setNewVariantContent] = useState("");
  const [showNewVariantForm, setShowNewVariantForm] = useState(false);
  const [snippetName, setSnippetName] = useState("");
  const [snippetSlug, setSnippetSlug] = useState("");
  const [snippetUrl, setSnippetUrl] = useState("");
  const [copiedVariantId, setCopiedVariantId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch in background - don't block initial render
    fetchSnippets();
  }, [brandId]);

  useEffect(() => {
    if (snippets.length > 0 && slug) {
      const found = snippets.find((s) => s.slug === slug);
      if (found) {
        const wasSnippetChanged = snippet?.id !== found.id;
        setSnippet(found);
        setSnippetName(found.name);
        setSnippetSlug(found.slug);
        setSnippetUrl(found.url || "");
        if (found.variants.length > 0) {
          // If snippet changed or no active variant, use first variant
          // Otherwise, try to keep the current variant if it still exists
          const currentVariantId = wasSnippetChanged ? null : activeVariant;
          const variantToUse = found.variants.find((v) => v.id === currentVariantId) || found.variants[0];
          setActiveVariant(variantToUse.id);
          setEditingVariant(variantToUse);
        } else {
          setActiveVariant(null);
          setEditingVariant(null);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snippets, slug]);

  const fetchSnippets = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/brands/${brandId}/snippets`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setSnippets(data);
      }
    } catch (error) {
      console.error("Error fetching snippets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSnippet = async () => {
    if (!snippet) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/brands/${brandId}/snippets/${snippet.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: snippetName,
          slug: snippetSlug,
          url: snippetUrl || null,
        }),
      });
      if (response.ok) {
        await fetchSnippets();
        // If slug changed, redirect to new URL
        if (snippetSlug !== snippet.slug) {
          router.push(`/brands/${brandId}/assets/${snippetSlug}`);
        }
      }
    } catch (error) {
      console.error("Error saving snippet:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleVariantChange = (variantId: string) => {
    if (!snippet) return;
    const variant = snippet.variants.find((v) => v.id === variantId);
    if (variant) {
      setActiveVariant(variantId);
      setEditingVariant(variant);
    }
  };

  const handleSaveVariant = async () => {
    if (!editingVariant || !snippet) return;
    setSaving(true);
    try {
      const response = await fetch(
        `/api/brands/${brandId}/snippets/${snippet.id}/variants/${editingVariant.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: editingVariant.name,
            content: editingVariant.content,
          }),
        }
      );
      if (response.ok) {
        await fetchSnippets();
        // Update editing variant after fetch
        const updated = await response.json();
        setEditingVariant(updated);
      }
    } catch (error) {
      console.error("Error saving variant:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateVariant = async () => {
    if (!snippet || !newVariantName.trim() || !newVariantContent.trim()) return;
    setSaving(true);
    try {
      const response = await fetch(
        `/api/brands/${brandId}/snippets/${snippet.id}/variants`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: newVariantName.trim(),
            content: newVariantContent.trim(),
          }),
        }
      );
      if (response.ok) {
        setNewVariantName("");
        setNewVariantContent("");
        setShowNewVariantForm(false);
        await fetchSnippets();
      }
    } catch (error) {
      console.error("Error creating variant:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (!snippet) return;
    if (!confirm("Are you sure you want to delete this variant?")) return;
    setSaving(true);
    try {
      const response = await fetch(
        `/api/brands/${brandId}/snippets/${snippet.id}/variants/${variantId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      if (response.ok) {
        await fetchSnippets();
        if (activeVariant === variantId) {
          const remaining = snippet.variants.filter((v) => v.id !== variantId);
          if (remaining.length > 0) {
            setActiveVariant(remaining[0].id);
            setEditingVariant(remaining[0]);
          } else {
            setActiveVariant(null);
            setEditingVariant(null);
          }
        }
      }
    } catch (error) {
      console.error("Error deleting variant:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSnippet = async () => {
    if (!snippet) return;
    if (!confirm(`Are you sure you want to delete "${snippet.name}"? This will delete all variants as well.`)) return;
    setSaving(true);
    try {
      const response = await fetch(
        `/api/brands/${brandId}/snippets/${snippet.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      if (response.ok) {
        // Redirect to assets page or first remaining snippet
        router.push(`/brands/${brandId}/assets`);
      }
    } catch (error) {
      console.error("Error deleting snippet:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyVariant = async (variantContent: string, variantId: string) => {
    try {
      await navigator.clipboard.writeText(variantContent);
      setCopiedVariantId(variantId);
      setTimeout(() => {
        setCopiedVariantId(null);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  // Render static HTML immediately - don't block on loading
  return (
    <div className="flex gap-6 h-[calc(100vh-200px)]">
      {/* Left nav - Categories */}
      <div className="w-64 border-r pr-6 overflow-y-auto flex flex-col">
        <div className="pb-4 border-b mb-4">
          <Button
            onClick={() => router.push(`/brands/${brandId}/assets/new`)}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            New snippet
          </Button>
        </div>
        <nav className="space-y-1 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : snippets.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No snippets yet
            </div>
          ) : (
            snippets.map((s) => (
              <Link
                key={s.id}
                href={`/brands/${brandId}/assets/${s.slug}`}
                className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                  snippet && s.id === snippet.id
                    ? "bg-accent text-accent-foreground font-medium"
                    : "hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{s.name}</span>
                  {s.url && (
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
              </Link>
            ))
          )}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {snippet ? (
          <>
        {snippet && snippet.variants.length === 0 && !showNewVariantForm ? (
          <Card>
            <CardHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="snippet-name" className="text-sm font-medium">
                    Snippet name
                  </Label>
                  <Input
                    id="snippet-name"
                    value={snippetName}
                    onChange={(e) => setSnippetName(e.target.value)}
                    className="text-2xl font-bold"
                    placeholder="e.g., Terms and Conditions"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="snippet-slug" className="text-sm font-medium">
                    Slug
                  </Label>
                  <Input
                    id="snippet-slug"
                    value={snippetSlug}
                    onChange={(e) => setSnippetSlug(e.target.value)}
                    placeholder="terms-conditions"
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    URL-friendly identifier
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                No variants yet. Create your first variant to get started.
              </p>
              <Button onClick={() => setShowNewVariantForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create variant
              </Button>
            </CardContent>
          </Card>
        ) : snippet ? (
          <Card>
            <CardHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="snippet-name" className="text-sm font-medium">
                    Snippet name
                  </Label>
                  <Input
                    id="snippet-name"
                    value={snippetName}
                    onChange={(e) => setSnippetName(e.target.value)}
                    className="text-3xl font-bold"
                    placeholder="e.g., Terms and Conditions"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="snippet-slug" className="text-sm font-medium">
                    Slug
                  </Label>
                  <Input
                    id="snippet-slug"
                    value={snippetSlug}
                    onChange={(e) => setSnippetSlug(e.target.value)}
                    placeholder="terms-conditions"
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    URL-friendly identifier
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs
                value={activeVariant || undefined}
                onValueChange={handleVariantChange}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <TabsList>
                    {snippet.variants.map((variant) => (
                      <TabsTrigger key={variant.id} value={variant.id}>
                        {variant.name}
                      </TabsTrigger>
                    ))}
                    {showNewVariantForm && (
                      <div className="px-3 py-1.5 text-sm text-muted-foreground">
                        New variant
                      </div>
                    )}
                  </TabsList>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewVariantForm(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add variant
                  </Button>
                </div>

            {snippet.variants.map((variant) => (
              <TabsContent key={variant.id} value={variant.id}>
                <Card>
                  <CardHeader>
                    <CardTitle>{variant.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`variant-name-${variant.id}`}>Variant name</Label>
                      <Input
                        id={`variant-name-${variant.id}`}
                        value={editingVariant?.id === variant.id ? editingVariant.name : variant.name}
                        onChange={(e) => {
                          if (editingVariant?.id === variant.id) {
                            setEditingVariant({ ...editingVariant, name: e.target.value });
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`variant-content-${variant.id}`}>Content</Label>
                      <Textarea
                        id={`variant-content-${variant.id}`}
                        value={editingVariant?.id === variant.id ? editingVariant.content : variant.content}
                        onChange={(e) => {
                          if (editingVariant?.id === variant.id) {
                            setEditingVariant({ ...editingVariant, content: e.target.value });
                          }
                        }}
                        className="min-h-[300px] font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="snippet-url">
                        URL (optional)
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="snippet-url"
                          type="url"
                          value={snippetUrl}
                          onChange={(e) => setSnippetUrl(e.target.value)}
                          placeholder="https://example.com/terms"
                          className="flex-1"
                        />
                        {snippetUrl && (
                          <Button
                            variant="outline"
                            size="icon"
                            asChild
                            title="Open URL"
                          >
                            <a href={snippetUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopyVariant(editingVariant?.id === variant.id ? editingVariant.content : variant.content, variant.id)}
                        title={copiedVariantId === variant.id ? "Copied!" : "Copy content"}
                      >
                        {copiedVariantId === variant.id ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          onClick={() => handleDeleteVariant(variant.id)}
                          disabled={saving}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                        <Button onClick={handleSaveVariant} disabled={saving}>
                          {saving ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save changes
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}

            {showNewVariantForm && (
              <Card>
                <CardHeader>
                  <CardTitle>Create new variant</CardTitle>
                  <CardDescription>
                    Add a new variant for this snippet (e.g., "Full", "Short", "Link")
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-variant-name">Variant name</Label>
                    <Input
                      id="new-variant-name"
                      value={newVariantName}
                      onChange={(e) => setNewVariantName(e.target.value)}
                      placeholder="e.g., Full, Short, Link"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-variant-content">Content</Label>
                    <Textarea
                      id="new-variant-content"
                      value={newVariantContent}
                      onChange={(e) => setNewVariantContent(e.target.value)}
                      placeholder="Enter the snippet content..."
                      className="min-h-[300px] font-mono text-sm"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowNewVariantForm(false);
                        setNewVariantName("");
                        setNewVariantContent("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCreateVariant} disabled={saving || !newVariantName.trim() || !newVariantContent.trim()}>
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Create variant
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
              </Tabs>
            </CardContent>
          </Card>
        ) : null}
          </>
        ) : (
          <div className="flex items-center justify-center min-h-[400px]">
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <p className="text-muted-foreground">Snippet not found</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

