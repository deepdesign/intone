"use client";

import { useState, useEffect } from "react";
import { useParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Palette, Type, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

interface BrandColor {
  id: string;
  name: string;
  variant: string;
  hex: string;
}

interface BrandFont {
  id: string;
  name: string;
  variant: string;
}

interface BrandLogo {
  id: string;
  name: string;
  variant: string;
}

export default function AssetsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const brandId = params.brandId as string;

  const [colors, setColors] = useState<BrandColor[]>([]);
  const [fonts, setFonts] = useState<BrandFont[]>([]);
  const [logos, setLogos] = useState<BrandLogo[]>([]);
  const [loading, setLoading] = useState(true);

  // Determine current asset type from pathname
  const currentType = pathname?.includes("/colors") 
    ? "colors" 
    : pathname?.includes("/fonts")
    ? "fonts"
    : pathname?.includes("/logos")
    ? "logos"
    : "colors";

  useEffect(() => {
    fetchAllAssets();
  }, [brandId]);

  const fetchAllAssets = async () => {
    setLoading(true);
    try {
      const [colorsRes, fontsRes, logosRes] = await Promise.all([
        fetch(`/api/brands/${brandId}/assets/colors`, { credentials: "include" }),
        fetch(`/api/brands/${brandId}/assets/fonts`, { credentials: "include" }),
        fetch(`/api/brands/${brandId}/assets/logos`, { credentials: "include" }),
      ]);

      if (colorsRes.ok) {
        const data = await colorsRes.json();
        setColors(data);
      }
      if (fontsRes.ok) {
        const data = await fontsRes.json();
        setFonts(data);
      }
      if (logosRes.ok) {
        const data = await logosRes.json();
        setLogos(data);
      }
    } catch (error) {
      console.error("Error fetching assets:", error);
    } finally {
      setLoading(false);
    }
  };

  // Group assets by name
  const groupedColors = colors.reduce((acc, color) => {
    if (!acc[color.name]) acc[color.name] = [];
    acc[color.name].push(color);
    return acc;
  }, {} as Record<string, BrandColor[]>);

  const groupedFonts = fonts.reduce((acc, font) => {
    if (!acc[font.name]) acc[font.name] = [];
    acc[font.name].push(font);
    return acc;
  }, {} as Record<string, BrandFont[]>);

  const groupedLogos = logos.reduce((acc, logo) => {
    if (!acc[logo.name]) acc[logo.name] = [];
    acc[logo.name].push(logo);
    return acc;
  }, {} as Record<string, BrandLogo[]>);

  const assetNames = currentType === "colors" 
    ? Object.keys(groupedColors)
    : currentType === "fonts"
    ? Object.keys(groupedFonts)
    : Object.keys(groupedLogos);

  const basePath = `/brands/${brandId}/rules/assets`;

  return (
    <div className="flex gap-6 h-[calc(100vh-200px)]">
      {/* Left Sidebar - Asset Type Navigation */}
      <div className="w-64 border-r pr-6 space-y-4 overflow-y-auto">
        <div>
          <h2 className="font-semibold mb-2">Asset Types</h2>
          <nav className="space-y-1">
            <Link
              href={`${basePath}/colors`}
              className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                currentType === "colors"
                  ? "bg-accent text-accent-foreground font-medium"
                  : "hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Colors
              </div>
            </Link>
            <Link
              href={`${basePath}/fonts`}
              className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                currentType === "fonts"
                  ? "bg-accent text-accent-foreground font-medium"
                  : "hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                Fonts
              </div>
            </Link>
            <Link
              href={`${basePath}/logos`}
              className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                currentType === "logos"
                  ? "bg-accent text-accent-foreground font-medium"
                  : "hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Logos
              </div>
            </Link>
          </nav>
        </div>

        {/* Asset Names List */}
        <div>
          <h2 className="font-semibold mb-2">
            {currentType === "colors" ? "Colors" : currentType === "fonts" ? "Fonts" : "Logos"}
          </h2>
          <nav className="space-y-1">
            {loading ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">Loading...</div>
            ) : assetNames.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                No {currentType} yet
              </div>
            ) : (
              assetNames.map((name) => (
                <Link
                  key={name}
                  href={`${basePath}/${currentType}/${encodeURIComponent(name)}`}
                  className="block px-3 py-2 rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  {name}
                </Link>
              ))
            )}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

