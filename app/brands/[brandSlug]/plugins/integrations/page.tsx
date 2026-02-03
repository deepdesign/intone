"use client";

// Static HTML - renders immediately
import ComingSoon from "@/components/coming-soon";

export default function IntegrationsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Integrations</h1>
        <p className="text-muted-foreground">
          Connect with your CMS, Figma, IDE, and other tools. Manage API keys and webhooks.
        </p>
      </div>
      <ComingSoon />
    </div>
  );
}

