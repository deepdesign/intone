"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function RulesAssetsPage() {
  const params = useParams();
  const router = useRouter();
  const brandId = params.brandId as string;

  // Redirect to colors by default - the layout will handle the sidebar
  useEffect(() => {
    router.replace(`/brands/${brandId}/rules/assets/colors`);
  }, [brandId, router]);

  return null;
}
