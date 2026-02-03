"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface ColorDetailProps {
  color: BrandColor | null;
  brandId: string;
  onSave: () => void;
  onDelete: () => void;
}

export function ColorDetail({ color, brandId, onSave, onDelete }: ColorDetailProps) {
  const [name, setName] = useState("");
  const [variant, setVariant] = useState("");
  const [hex, setHex] = useState("#000000");
  const [cmykC, setCmykC] = useState<string>("");
  const [cmykM, setCmykM] = useState<string>("");
  const [cmykY, setCmykY] = useState<string>("");
  const [cmykK, setCmykK] = useState<string>("");
  const [pantone, setPantone] = useState("");
  const [saving, setSaving] = useState(false);

  // Update form when color changes
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
    } else {
      // Reset for new color
      setName("");
      setVariant("");
      setHex("#000000");
      setCmykC("");
      setCmykM("");
      setCmykY("");
      setCmykK("");
      setPantone("");
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

      // Add CMYK if any value is provided
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
    if (!color) return;
    if (!confirm(`Are you sure you want to delete "${color.name}"?`)) return;

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

  if (!color && name === "") {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <p>Select a color to view or edit, or create a new one.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{color ? "Edit Color" : "New Color"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Large Color Swatch */}
        <div className="flex items-center justify-center p-8 bg-muted rounded-lg">
          <div
            className="w-32 h-32 rounded-lg border-2 border-border shadow-lg"
            style={{ backgroundColor: hex }}
          />
        </div>

        {/* Color Code Display */}
        <div className="text-center">
          <p className="text-2xl font-mono font-bold">{hex.toUpperCase()}</p>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="color-name">Name *</Label>
            <Input
              id="color-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Primary Blue"
            />
          </div>

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
                {color ? "Save Changes" : "Create Color"}
              </>
            )}
          </Button>
          {color && (
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

