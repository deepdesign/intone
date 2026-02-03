// Client Component - Static navigation HTML

"use client";

import { getRuleNavForCategory } from "@/lib/rules/navigation";
import { NavLink } from "./nav-link";
import { useParams } from "next/navigation";

interface RulesSecondaryNavProps {
  category: "tone" | "grammar" | "numbers" | "terminology";
  brandId: string;
}

export function RulesSecondaryNav({ category, brandId: _brandId }: RulesSecondaryNavProps) {
  const params = useParams();
  const brandId = (params.brandId as string) || _brandId;
  
  const rules = getRuleNavForCategory(category);
  const basePath = `/brands/${brandId}/rules/${category}`;

  return (
    <nav className="pr-6 py-8">
      <div className="space-y-1">
        {rules.map((rule) => (
          <NavLink key={rule.key} href={`${basePath}/${rule.slug}`}>
            {rule.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
