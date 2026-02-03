"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

const LABELS: Record<string, string> = {
  app: "App",
  brands: "Brands",
  create: "Create",
  repository: "Repository",
  assets: "Assets",
  rules: "Rules",
  tone: "Tone of Voice",
  grammar: "Grammar & Punctuation",
  numbers: "Numbers & Values",
  custom: "Custom Rules",
  snippets: "Snippets",
  terminology: "Terminology",
  overview: "Overview",
  settings: "Settings",
  new: "New",
  audit: "Audit",
};

function humanize(segment: string): string {
  return LABELS[segment.toLowerCase()] ?? segment;
}

export function AppBreadcrumbs() {
  const pathname = usePathname();
  if (!pathname) return null;

  // Normalize: remove leading slash, split, drop empty
  const segments = pathname.replace(/^\/+/, "").split("/").filter(Boolean);
  if (segments.length <= 1) return null;

  let href = "";
  const items = segments.map((segment, i) => {
    href += (href ? "/" : "") + segment;
    const isLast = i === segments.length - 1;
    const label = humanize(segment);
    return { href: "/" + href, label, isLast };
  });

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 text-sm text-muted-foreground px-4 md:px-6 py-2 border-b"
    >
      {items.map((item, i) => (
        <span key={item.href} className="flex items-center gap-1.5">
          {i > 0 && (
            <ChevronRight className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
          )}
          {item.isLast ? (
            <span className="font-medium text-foreground truncate max-w-48">
              {item.label}
            </span>
          ) : (
            <Link
              href={item.href}
              className="hover:text-foreground truncate max-w-48"
            >
              {item.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
