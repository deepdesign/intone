"use client";

// Client-side redirect - renders static HTML immediately
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function TonePage() {
  const params = useParams();
  const router = useRouter();
  const brandId = params.brandId as string;

  useEffect(() => {
    router.replace(`/brands/${brandId}/rules/tone/settings`);
  }, [brandId, router]);

  // Render empty while redirecting (static HTML)
  return null;
}

