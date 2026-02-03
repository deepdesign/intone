"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { ColorForm } from "@/components/assets/color-form";
import { FontForm } from "@/components/assets/font-form";
import { LogoForm } from "@/components/assets/logo-form";

type AssetType = "colors" | "fonts" | "logos";

interface BrandColor {
  id: string;
  name: string;
  variant: string;
  hex: string;
  cmykC: number | null;
  cmykM: number | null;
  cmykY: number | null;
  cmykK: number | null;
  pantone: string | null;
}

interface BrandFont {
  id: string;
  name: string;
  variant: string;
  downloadUrl: string | null;
  fileUrl: string | null;
  fileType: string | null;
}

interface BrandLogo {
  id: string;
  name: string;
  variant: string;
  format: string;
  usage: string;
  fileUrl: string;
  fileSize: number | null;
  width: number | null;
  height: number | null;
}

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const brandId = params.brandId as string;
  const type = params.type as AssetType;
  const name = decodeURIComponent(params.name as string);

  const [colors, setColors] = useState<BrandColor[]>([]);
  const [fonts, setFonts] = useState<BrandFont[]>([]);
  const [logos, setLogos] = useState<BrandLogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeVariantId, setActiveVariantId] = useState<string | null>(null);
  const [assetName, setAssetName] = useState(name);
  const [showNewVariantForm, setShowNewVariantForm] = useState(false);

  useEffect(() => {
    fetchAssets();
  }, [brandId, type]);

  useEffect(() => {
    // Set active variant to first one when assets load
    if (type === "colors" && colors.length > 0 && !activeVariantId) {
      setActiveVariantId(colors[0].id);
    } else if (type === "fonts" && fonts.length > 0 && !activeVariantId) {
      setActiveVariantId(fonts[0].id);
    } else if (type === "logos" && logos.length > 0 && !activeVariantId) {
      setActiveVariantId(logos[0].id);
    }
  }, [colors, fonts, logos, type, activeVariantId]);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/brands/${brandId}/assets/${type}`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        // Filter by name
        if (type === "colors") {
          const filtered = data.filter((c: BrandColor) => c.name === name);
          setColors(filtered);
        } else if (type === "fonts") {
          const filtered = data.filter((f: BrandFont) => f.name === name);
          setFonts(filtered);
        } else {
          const filtered = data.filter((l: BrandLogo) => l.name === name);
          setLogos(filtered);
        }
      }
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAssetName = async () => {
    if (!assetName.trim() || assetName === name) return;
    setSaving(true);
    try {
      // Update all variants with the new name
      const assets = type === "colors" ? colors : type === "fonts" ? fonts : logos;
      const promises = assets.map((asset) =>
        fetch(`/api/brands/${brandId}/assets/${type}/${asset.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ name: assetName.trim() }),
        })
      );
      await Promise.all(promises);
      await fetchAssets();
      router.push(`/brands/${brandId}/rules/assets/${type}/${encodeURIComponent(assetName.trim())}`);
    } catch (error) {
      console.error("Error updating asset name:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAsset = async () => {
    if (!confirm(`Are you sure you want to delete "${assetName}"? This will delete all variants.`)) return;
    setSaving(true);
    try {
      const assets = type === "colors" ? colors : type === "fonts" ? fonts : logos;
      const promises = assets.map((asset) =>
        fetch(`/api/brands/${brandId}/assets/${type}/${asset.id}`, {
          method: "DELETE",
          credentials: "include",
        })
      );
      await Promise.all(promises);
      router.push(`/brands/${brandId}/rules/assets`);
    } catch (error) {
      console.error("Error deleting asset:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const assets = type === "colors" ? colors : type === "fonts" ? fonts : logos;

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground mb-4">Asset not found</p>
        <Button asChild>
          <Link href={`/brands/${brandId}/rules/assets`}>Back to assets</Link>
        </Button>
      </div>
    );
  }

  const activeAsset = assets.find((a) => a.id === activeVariantId) || assets[0];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex-1">
          <Input
            value={assetName}
            onChange={(e) => setAssetName(e.target.value)}
            onBlur={handleSaveAssetName}
            className="text-2xl font-bold border-none p-0 h-auto focus-visible:ring-0"
            disabled={saving}
          />
        </div>
        <Button variant="destructive" onClick={handleDeleteAsset} disabled={saving}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>

      {/* Variants Tabs */}
      <Tabs
        value={activeVariantId || undefined}
        onValueChange={setActiveVariantId}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            {assets.map((asset) => (
              <TabsTrigger key={asset.id} value={asset.id}>
                {asset.variant}
              </TabsTrigger>
            ))}
          </TabsList>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowNewVariantForm(!showNewVariantForm)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Variant
          </Button>
        </div>

        {/* New Variant Form */}
        {showNewVariantForm && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>New Variant</CardTitle>
            </CardHeader>
            <CardContent>
              {type === "colors" && (
                <ColorForm
                  brandId={brandId}
                  initialName={assetName}
                  onSave={() => {
                    setShowNewVariantForm(false);
                    fetchAssets();
                  }}
                  onCancel={() => setShowNewVariantForm(false)}
                />
              )}
              {type === "fonts" && (
                <FontForm
                  brandId={brandId}
                  initialName={assetName}
                  onSave={() => {
                    setShowNewVariantForm(false);
                    fetchAssets();
                  }}
                  onCancel={() => setShowNewVariantForm(false)}
                />
              )}
              {type === "logos" && (
                <LogoForm
                  brandId={brandId}
                  initialName={assetName}
                  onSave={() => {
                    setShowNewVariantForm(false);
                    fetchAssets();
                  }}
                  onCancel={() => setShowNewVariantForm(false)}
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* Variant Content */}
        {assets.map((asset) => (
          <TabsContent
            key={asset.id}
            value={asset.id}
            className="flex-1 overflow-y-auto mt-0"
          >
            {type === "colors" && (
              <ColorForm
                brandId={brandId}
                color={asset as BrandColor}
                onSave={fetchAssets}
                onDelete={() => {
                  if (assets.length > 1) {
                    const remaining = assets.filter((a) => a.id !== asset.id);
                    if (remaining.length > 0) {
                      setActiveVariantId(remaining[0].id);
                    }
                  }
                  fetchAssets();
                }}
              />
            )}
            {type === "fonts" && (
              <FontForm
                brandId={brandId}
                font={asset as BrandFont}
                onSave={fetchAssets}
                onDelete={() => {
                  if (assets.length > 1) {
                    const remaining = assets.filter((a) => a.id !== asset.id);
                    if (remaining.length > 0) {
                      setActiveVariantId(remaining[0].id);
                    }
                  }
                  fetchAssets();
                }}
              />
            )}
            {type === "logos" && (
              <LogoForm
                brandId={brandId}
                logo={asset as BrandLogo}
                onSave={fetchAssets}
                onDelete={() => {
                  if (assets.length > 1) {
                    const remaining = assets.filter((a) => a.id !== asset.id);
                    if (remaining.length > 0) {
                      setActiveVariantId(remaining[0].id);
                    }
                  }
                  fetchAssets();
                }}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

