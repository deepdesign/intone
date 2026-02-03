"use client";

// Static HTML - renders immediately
import { CreatePanel } from "@/components/create/create-panel";

export default function CreatePage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create</h1>
        <p className="text-muted-foreground">
          Generate new copy with rule-aware AI assistance. Your brand rules are automatically applied.
        </p>
      </div>
      <CreatePanel />
    </div>
  );
}

