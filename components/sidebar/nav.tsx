"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Settings,
  Languages,
  Image,
  Sparkles,
  CheckCircle2,
  Plug,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

export function SidebarNav() {
  const pathname = usePathname();
  const params = useParams();
  const brandId = params?.brandId as string;

  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/app/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Brand rules",
      href: brandId ? `/brands/${brandId}/rules/tone/settings` : "#",
      icon: BookOpen,
      disabled: !brandId,
    },
    {
      title: "Tone of voice",
      href: brandId ? `/brands/${brandId}/rules/tone/settings` : "#",
      icon: Sparkles,
      disabled: !brandId,
    },
    {
      title: "Grammar & punctuation",
      href: brandId ? `/brands/${brandId}/rules/grammar` : "#",
      icon: Languages,
      disabled: !brandId,
    },
    {
      title: "Terminology",
      href: brandId ? `/brands/${brandId}/rules/terminology` : "#",
      icon: FileText,
      disabled: true,
    },
    {
      title: "Tone linting",
      href: brandId ? `/brands/${brandId}/editor` : "#",
      icon: CheckCircle2,
      disabled: true,
    },
    {
      title: "Review and approval",
      href: brandId ? `/brands/${brandId}/review` : "#",
      icon: CheckCircle2,
      disabled: true,
    },
    {
      title: "Integrations",
      href: brandId ? `/brands/${brandId}/integrations` : "#",
      icon: Plug,
      disabled: true,
    },
    {
      title: "Settings",
      href: "/app/settings",
      icon: Settings,
    },
  ];

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href !== "#" && pathname?.startsWith(item.href));
        const isDisabled = item.disabled;

        const content = (
          <div
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive && !isDisabled
                ? "bg-primary text-primary-foreground"
                : isDisabled
                ? "text-muted-foreground cursor-not-allowed opacity-50"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{item.title}</span>
          </div>
        );

        if (isDisabled || !item.href || item.href === "#") {
          return <div key={item.title}>{content}</div>;
        }

        return (
          <Link key={item.title} href={item.href}>
            {content}
          </Link>
        );
      })}
    </nav>
  );
}
