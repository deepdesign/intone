"use client";

// Client Component - Static HTML structure, client-side data fetching
// Rule definitions are imported directly (static), user values fetched client-side

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getRuleBySlug } from "@/lib/rules/navigation";
import { getRuleDefinition } from "@/lib/rules/definitions";
import { RuleDetailClient } from "@/components/rules/rule-detail-client";

export default function ToneRulePage() {
  const params = useParams();
  const router = useRouter();
  const brandId = params.brandId as string;
  const slug = params.slug as string;

  const [userValue, setUserValue] = useState<any>(undefined);
  const [userStatus, setUserStatus] = useState<string | undefined>(undefined);
  const [ruleId, setRuleId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  // Get rule definition from static TypeScript (instant, no queries)
  const ruleNav = getRuleBySlug("tone", slug);
  if (!ruleNav) {
    return (
      <div className="flex-1 p-8">
        <div>Rule not found</div>
      </div>
    );
  }

  const ruleDef = getRuleDefinition(ruleNav.key);
  if (!ruleDef) {
    return (
      <div className="flex-1 p-8">
        <div>Rule definition not found</div>
      </div>
    );
  }

  // Fetch user value client-side (NON-BLOCKING - after static HTML renders)
  useEffect(() => {
    if (!ruleDef) return;
    
    let cancelled = false;

    // Set loading to false immediately so static HTML renders
    setLoading(false);

    // Fetch in background (non-blocking)
    async function fetchUserValue() {
      if (!ruleDef) return;
      
      try {
        const response = await fetch(`/api/brands/${brandId}/rules?key=${encodeURIComponent(ruleDef.key)}`, {
          credentials: "include",
        });

        if (cancelled) return;

        if (response.ok) {
          const data = await response.json();
          if (data && !Array.isArray(data)) {
            setUserValue(data.value);
            setUserStatus(data.status);
            setRuleId(data.id);
          }
        } else if (response.status === 401) {
          router.push("/login");
          return;
        }
      } catch (error) {
        console.error("Error fetching rule value:", error);
      }
    }

    // Fetch in background (don't block rendering)
    fetchUserValue();

    return () => {
      cancelled = true;
    };
  }, [brandId, ruleDef?.key, router]);

  // Render static HTML immediately (definition is static)
  if (!ruleDef) {
    return null;
  }

  // Refetch function for status changes
  const refetchRule = async () => {
    try {
      const response = await fetch(`/api/brands/${brandId}/rules?key=${encodeURIComponent(ruleDef.key)}`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        if (data && !Array.isArray(data)) {
          setUserValue(data.value);
          setUserStatus(data.status);
          setRuleId(data.id);
        }
      }
    } catch (error) {
      console.error("Error refetching rule:", error);
    }
  };

  return (
    <RuleDetailClient
      definition={ruleDef}
      userValue={userValue}
      userStatus={userStatus}
      ruleId={ruleId}
      brandId={brandId}
      loading={loading}
      onStatusChange={refetchRule}
    />
  );
}
