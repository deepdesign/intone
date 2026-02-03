"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Trash2 } from "lucide-react";

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

interface ColorFormProps {
  brandId: string;
  color?: BrandColor | null;
  initialName?: string;
  onSave: () => void;
  onDelete?: () => void;
  onCancel?: () => void;
}

export function ColorForm({
  brandId,
  color,
  initialName,
  onSave,
  onDelete,
  onCancel,
}: ColorFormProps) {
  const [name, setName] = useState(initialName || color?.name || "");
  const [variant, setVariant] = useState(color?.variant || "");
  const [hex, setHex] = useState(color?.hex || "#000000");
  const [cmykC, setCmykC] = useState<string>(color?.cmykC?.toString() || "");
  const [cmykM, setCmykM] = useState<string>(color?.cmykM?.toString() || "");
  const [cmykY, setCmykY] = useState<string>(color?.cmykY?.toString() || "");
  const [cmykK, setCmykK] = useState<string>(color?.cmykK?.toString() || "");
  const [pantone, setPantone] = useState(color?.pantone || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (color) {
      setName(color.name);
      setVariant(color.variant);
      setHex(color.hex);
      setCmykC(color.cmykC?.toString() || "");
      setCmykM(color.cmykM?.toString() || "");
      setCmykY(color.cmykY?.toString() || "");
      setCmykK(color.cmykK?.toString() || "");
      setPantone(color.pantone || "");
    }
  }, [color]);

  const handleSave = async () => {
    if (!name || !variant || !hex) return;

    setSaving(true);
    try {
      const url = color
        ? `/api/brands/${brandId}/assets/colors/${color.id}`
        : `/api/brands/${brandId}/assets/colors`;
      
      const method = color ? "PUT" : "POST";
      const body: any = {
        name,
        variant,
        hex,
        pantone: pantone || null,
      };

      if (cmykC || cmykM || cmykY || cmykK) {
        body.cmykC = cmykC ? parseInt(cmykC) : null;
        body.cmykM = cmykM ? parseInt(cmykM) : null;
        body.cmykY = cmykY ? parseInt(cmykY) : null;
        body.cmykK = cmykK ? parseInt(cmykK) : null;
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (response.ok) {
        onSave();
      }
    } catch (error) {
      console.error("Error saving color:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!color || !onDelete) return;
    if (!confirm(`Are you sure you want to delete "${color.variant}"?`)) return;

    setSaving(true);
    try {
      const response = await fetch(
        `/api/brands/${brandId}/assets/colors/${color.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.ok) {
        onDelete();
      }
    } catch (error) {
      console.error("Error deleting color:", error);
    } finally {
      setSaving(false);
    }
  };

  const isNew = !color;

  return (
    <div className="space-y-6">
      {/* Color Preview - Combined with form */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            {/* Large Color Swatch */}
            <div className="flex-shrink-0">
              <div
                className="w-32 h-32 rounded-lg border-2 border-border shadow-lg"
                style={{ backgroundColor: hex }}
              />
            </div>
            
            {/* Hex Code Display */}
            <div className="flex-1">
              <div className="mb-2">
                <Label className="text-sm text-muted-foreground">Hex Code</Label>
                <p className="text-2xl font-mono font-bold">{hex.toUpperCase()}</p>
              </div>
              {pantone && (
                <div>
                  <Label className="text-sm text-muted-foreground">Pantone</Label>
                  <p className="text-lg">{pantone}</p>
                </div>
              )}
              {(cmykC !== null || cmykM !== null || cmykY !== null || cmykK !== null) && (
                <div className="mt-2">
                  <Label className="text-sm text-muted-foreground">CMYK</Label>
                  <p className="text-sm">
                    {cmykC || 0}, {cmykM || 0}, {cmykY || 0}, {cmykK || 0}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Fields */}
      <Card>
        <CardContent className="p-6 space-y-4">
          {isNew && (
            <div className="space-y-2">
              <Label htmlFor="color-name">Name *</Label>
              <Input
                id="color-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Primary Blue"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="color-variant">Variant *</Label>
            <Input
              id="color-variant"
              value={variant}
              onChange={(e) => setVariant(e.target.value)}
              placeholder="e.g., Primary, Secondary, Light"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color-hex">Hex Color Code *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="color-hex"
                type="color"
                value={hex}
                onChange={(e) => setHex(e.target.value)}
                className="w-20 h-10"
              />
              <Input
                value={hex}
                onChange={(e) => setHex(e.target.value)}
                placeholder="#000000"
                className="font-mono flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>CMYK (Optional)</Label>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <Label htmlFor="cmyk-c" className="text-xs">C</Label>
                <Input
                  id="cmyk-c"
                  type="number"
                  min="0"
                  max="100"
                  value={cmykC}
                  onChange={(e) => setCmykC(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="cmyk-m" className="text-xs">M</Label>
                <Input
                  id="cmyk-m"
                  type="number"
                  min="0"
                  max="100"
                  value={cmykM}
                  onChange={(e) => setCmykM(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="cmyk-y" className="text-xs">Y</Label>
                <Input
                  id="cmyk-y"
                  type="number"
                  min="0"
                  max="100"
                  value={cmykY}
                  onChange={(e) => setCmykY(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="cmyk-k" className="text-xs">K</Label>
                <Input
                  id="cmyk-k"
                  type="number"
                  min="0"
                  max="100"
                  value={cmykK}
                  onChange={(e) => setCmykK(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="color-pantone">Pantone (Optional)</Label>
            <Input
              id="color-pantone"
              value={pantone}
              onChange={(e) => setPantone(e.target.value)}
              placeholder="e.g., PMS 286 C"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} disabled={saving || !name || !variant || !hex}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isNew ? "Create Color" : "Save Changes"}
                </>
              )}
            </Button>
            {!isNew && onDelete && (
              <Button variant="destructive" onClick={handleDelete} disabled={saving}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
            {isNew && onCancel && (
              <Button variant="outline" onClick={onCancel} disabled={saving}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

