"use client";

import { useParams, useRouter } from "next/navigation";
import { ColorForm } from "@/components/assets/color-form";
import { FontForm } from "@/components/assets/font-form";
import { LogoForm } from "@/components/assets/logo-form";

type AssetType = "colors" | "fonts" | "logos";

export default function NewAssetPage() {
  const params = useParams();
  const router = useRouter();
  const brandId = params.brandId as string;
  const type = params.type as AssetType;

  const handleSave = () => {
    // Redirect back to assets list - the new asset will appear in the list
    router.push(`/brands/${brandId}/rules/assets`);
  };

  const handleCancel = () => {
    router.push(`/brands/${brandId}/rules/assets`);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">New {type === "colors" ? "Color" : type === "fonts" ? "Font" : "Logo"}</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {type === "colors" && (
          <ColorForm
            brandId={brandId}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}
        {type === "fonts" && (
          <FontForm
            brandId={brandId}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}
        {type === "logos" && (
          <LogoForm
            brandId={brandId}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}
      </div>
    </div>
  );
}

