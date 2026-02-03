"use client";

// Static HTML - renders immediately
import { EditorPanel } from "@/components/editor/editor-panel";

export default function EditorPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Editor</h1>
        <p className="text-muted-foreground">Write, rewrite, and lint copy according to your brand rules.</p>
      </div>
      <EditorPanel />
    </div>
  );
}
