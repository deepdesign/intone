"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BrandFont {
  id: string;
  name: string;
  variant: string;
  downloadUrl: string | null;
  fileUrl: string | null;
  fileType: string | null;
}

interface FontsListProps {
  fonts: BrandFont[];
  selectedFontId?: string;
  onSelectFont: (font: BrandFont) => void;
}

export function FontsList({ fonts, selectedFontId, onSelectFont }: FontsListProps) {
  if (fonts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No fonts yet. Add your first font to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {fonts.map((font) => (
        <Card
          key={font.id}
          className={`cursor-pointer transition-all ${
            selectedFontId === font.id ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => onSelectFont(font)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg" style={{ fontFamily: font.name }}>
                  {font.name}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">{font.variant}</p>
                {font.fileType && (
                  <Badge variant="outline" className="mt-2">
                    {font.fileType.toUpperCase()}
                  </Badge>
                )}
              </div>
              {(font.downloadUrl || font.fileUrl) && (
                <Badge variant="secondary">Available</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

