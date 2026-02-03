"use client";

// Static HTML - renders immediately, no server queries
// Data fetches in background (non-blocking)

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, FileText, ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";

interface Snippet {
  id: string;
  name: string;
  slug: string;
  url: string | null;
  variants: Array<{
    id: string;
    name: string;
    content: string;
  }>;
}

export default function AssetsPage() {
  const params = useParams();
  const router = useRouter();
  const brandId = params.brandId as string;
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(false); // Start as false - don't block render

  useEffect(() => {
    // Fetch in background - don't block initial render
    fetchSnippets();
  }, [brandId]);

  const fetchSnippets = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/brands/${brandId}/snippets`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setSnippets(data);
      }
    } catch (error) {
      console.error("Error fetching snippets:", error);
    } finally {
      setLoading(false);
    }
  };

  // Render static HTML immediately - don't wait for data
  return (
    <div className="flex gap-6 h-[calc(100vh-200px)]">
      {/* Left nav - Categories */}
      <div className="w-64 border-r pr-6 overflow-y-auto flex flex-col">
        <div className="pb-4 border-b mb-4">
          <Button
            onClick={() => router.push(`/brands/${brandId}/assets/new`)}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            New snippet
          </Button>
        </div>
        <nav className="space-y-1 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : snippets.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No snippets yet
            </div>
          ) : (
            snippets.map((snippet) => (
              <Link
                key={snippet.id}
                href={`/brands/${brandId}/assets/${snippet.slug}`}
                className="block px-3 py-2 rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{snippet.name}</span>
                  {snippet.url && (
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
              </Link>
            ))
          )}
        </nav>
      </div>

      {/* Main content area - will be replaced by dynamic route */}
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        {snippets.length === 0 && !loading ? (
          <div className="flex flex-col items-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No snippets yet</h2>
            <p className="text-muted-foreground mb-4">
              Create your first snippet to get started
            </p>
            <Button onClick={() => router.push(`/brands/${brandId}/assets/new`)}>
              <Plus className="mr-2 h-4 w-4" />
              Create snippet
            </Button>
          </div>
        ) : (
          "Select a snippet from the left to view or edit"
        )}
      </div>
    </div>
  );
}
