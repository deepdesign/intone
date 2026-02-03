"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

interface ColorsListProps {
  colors: BrandColor[];
  selectedColorId?: string;
  onSelectColor: (color: BrandColor) => void;
}

export function ColorsList({ colors, selectedColorId, onSelectColor }: ColorsListProps) {
  if (colors.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No colors yet. Add your first color to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {colors.map((color) => (
        <Card
          key={color.id}
          className={`cursor-pointer transition-all ${
            selectedColorId === color.id ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => onSelectColor(color)}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              {/* Color Swatch */}
              <div
                className="w-16 h-16 rounded-md border-2 border-border shrink-0"
                style={{ backgroundColor: color.hex }}
              />
              
              {/* Color Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{color.name}</h3>
                <p className="text-sm text-muted-foreground">{color.variant}</p>
                <div className="mt-2 space-y-1">
                  <p className="text-sm font-mono">{color.hex.toUpperCase()}</p>
                  {color.cmykC !== null && (
                    <p className="text-xs text-muted-foreground">
                      CMYK: {color.cmykC}, {color.cmykM}, {color.cmykY}, {color.cmykK}
                    </p>
                  )}
                  {color.pantone && (
                    <p className="text-xs text-muted-foreground">Pantone: {color.pantone}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

