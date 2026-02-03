// Client Component - Static navigation, no server queries

"use client";

import { RulesSecondaryNav } from "@/components/rules/rules-secondary-nav";

export default function ToneRulesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full">
      <div className="w-64 border-r overflow-y-auto">
        <RulesSecondaryNav category="tone" brandId={""} />
      </div>
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}