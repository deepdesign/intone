"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ColorForm } from "@/components/assets/color-form";
import { FontForm } from "@/components/assets/font-form";
import { LogoForm } from "@/components/assets/logo-form";

type AssetType = "colors" | "fonts" | "logos";

export default function AssetTypePage() {
  const params = useParams();
  const router = useRouter();
  const brandId = params.brandId as string;
  const type = params.type as AssetType;
  const [formKey, setFormKey] = useState(0);

  const handleSave = () => {
    // After saving, refresh the router to update the left nav with new assets
    router.refresh();
    // Reset form by remounting it with a new key
    setFormKey((prev) => prev + 1);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {type === "colors" ? "Add Color" : type === "fonts" ? "Add Font" : "Add Logo"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {type === "colors" 
            ? "Add a new color to your brand palette"
            : type === "fonts"
            ? "Add a new font to your brand typography"
            : "Add a new logo to your brand assets"}
        </p>
      </div>

      <div className="flex-1">
        {type === "colors" && (
          <ColorForm
            key={formKey}
            brandId={brandId}
            onSave={handleSave}
          />
        )}
        {type === "fonts" && (
          <FontForm
            key={formKey}
            brandId={brandId}
            onSave={handleSave}
          />
        )}
        {type === "logos" && (
          <LogoForm
            key={formKey}
            brandId={brandId}
            onSave={handleSave}
          />
        )}
      </div>
    </div>
  );
}

