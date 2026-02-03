"use client";

// Static HTML - renders immediately
import ComingSoon from "@/components/coming-soon";

export default function SourcesPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Sources</h1>
        <p className="text-muted-foreground">Manage source documents and reference materials.</p>
      </div>
      <ComingSoon />
    </div>
  );
}
