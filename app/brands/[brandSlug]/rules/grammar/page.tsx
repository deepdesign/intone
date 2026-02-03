"use client";

// Client-side redirect - renders static HTML immediately
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getRuleNavForCategory } from "@/lib/rules/navigation";

export default function GrammarRulesPage() {
  const params = useParams();
  const router = useRouter();
  const brandId = params.brandId as string;

  useEffect(() => {
    const rules = getRuleNavForCategory("grammar");
    if (rules.length > 0) {
      router.replace(`/brands/${brandId}/rules/grammar/${rules[0].slug}`);
    }
  }, [brandId, router]);

  // Render empty while redirecting (static HTML)
  return null;
}
