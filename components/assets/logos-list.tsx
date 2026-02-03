"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

interface BrandLogo {
  id: string;
  name: string;
  variant: string;
  format: string;
  usage: string;
  fileUrl: string;
  width: number | null;
  height: number | null;
}

interface LogosListProps {
  logos: BrandLogo[];
  selectedLogoId?: string;
  onSelectLogo: (logo: BrandLogo) => void;
}

export function LogosList({ logos, selectedLogoId, onSelectLogo }: LogosListProps) {
  if (logos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No logos yet. Add your first logo to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {logos.map((logo) => (
        <Card
          key={logo.id}
          className={`cursor-pointer transition-all ${
            selectedLogoId === logo.id ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => onSelectLogo(logo)}
        >
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Logo Preview */}
              <div className="aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden">
                {logo.fileUrl.startsWith("http") ? (
                  <img
                    src={logo.fileUrl}
                    alt={logo.name}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <img
                    src={logo.fileUrl}
                    alt={logo.name}
                    className="max-w-full max-h-full object-contain"
                  />
                )}
              </div>

              {/* Logo Info */}
              <div>
                <h3 className="font-semibold">{logo.name}</h3>
                <p className="text-sm text-muted-foreground">{logo.variant}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">{logo.format}</Badge>
                  <Badge variant="secondary" className="capitalize">
                    {logo.usage}
                  </Badge>
                  {logo.width && logo.height && (
                    <span className="text-xs text-muted-foreground self-center">
                      {logo.width}×{logo.height}
                    </span>
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

