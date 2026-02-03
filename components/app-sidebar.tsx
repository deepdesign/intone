"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Languages,
  FileText,
  Image,
  Sparkles,
  CheckCircle2,
  Plug,
  Settings,
  FolderOpen,
  PenTool,
  Search,
  FileCheck,
  GraduationCap,
  Accessibility,
  Plus,
  Database,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { BrandSelector } from "@/components/sidebar/brand-selector";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

export function AppSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const urlBrandId = params?.brandId as string;
  
  // Get stored brand from localStorage if no brandId in URL (e.g., on Dashboard)
  const [storedBrandId, setStoredBrandId] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("selectedBrandId");
      setStoredBrandId(stored);
    }
  }, [urlBrandId]); // Re-check when URL brandId changes
  
  // Use URL brandId first, fall back to stored brandId
  const brandId = urlBrandId || storedBrandId || undefined;

  const mainNav: NavItem[] = [
    {
      title: "Dashboard",
      href: "/app/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Create",
      href: brandId ? `/brands/${brandId}/create` : "#",
      icon: PenTool,
      disabled: !brandId,
    },
    {
      title: "Audit",
      href: brandId ? `/brands/${brandId}/audit` : "#",
      icon: FileCheck,
      disabled: !brandId,
    },
    {
      title: "Snippets",
      href: brandId ? `/brands/${brandId}/assets` : "#",
      icon: FolderOpen,
      disabled: !brandId,
    },
    {
      title: "Assets",
      href: brandId ? `/brands/${brandId}/rules/assets` : "#",
      icon: Image,
      disabled: !brandId,
    },
    {
      title: "Repository",
      href: brandId ? `/brands/${brandId}/repository` : "#",
      icon: Database,
      disabled: !brandId,
    },
  ];

  const rulesNav: NavItem[] = [
    {
      title: "Overview",
      href: brandId ? `/brands/${brandId}/rules` : "#",
      icon: BookOpen,
      disabled: !brandId,
    },
    {
      title: "Tone of voice",
      href: brandId ? `/brands/${brandId}/rules/tone` : "#",
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
      title: "Numbers & values",
      href: brandId ? `/brands/${brandId}/rules/numbers` : "#",
      icon: Languages,
      disabled: !brandId,
    },
    {
      title: "Terminology",
      href: brandId ? `/brands/${brandId}/rules/terminology` : "#",
      icon: FileText,
      disabled: !brandId,
    },
    {
      title: "Accessibility & inclusivity",
      href: brandId ? `/brands/${brandId}/rules/accessibility` : "#",
      icon: Accessibility,
      disabled: !brandId,
    },
    {
      title: "Custom rules",
      href: brandId ? `/brands/${brandId}/rules/custom` : "#",
      icon: Plus,
      disabled: !brandId,
    },
    {
      title: "Learn",
      href: brandId ? `/brands/${brandId}/rules/learn` : "#",
      icon: GraduationCap,
      disabled: !brandId,
    },
  ];


  const otherNav: NavItem[] = [
    {
      title: "Reviews",
      href: brandId ? `/brands/${brandId}/reviews` : "#",
      icon: Star,
      disabled: true,
    },
    {
      title: "Plugins",
      href: brandId ? `/brands/${brandId}/plugins/integrations` : "#",
      icon: Plug,
      disabled: !brandId,
    },
    {
      title: "Settings",
      href: "/app/settings",
      icon: Settings,
    },
  ];

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    
    // Determine active state more precisely
    let isActive = false;
    if (item.href && item.href !== "#") {
      // Exact match
      if (pathname === item.href) {
        isActive = true;
      } 
      // For "Overview" link specifically, only match exact path or /rules/ with nothing after
      else if (item.title === "Overview" && pathname?.startsWith(item.href)) {
        // Only match if the path is exactly /rules or /rules/ (with trailing slash)
        const remainingPath = pathname.slice(item.href.length);
        isActive = remainingPath === "" || remainingPath === "/";
      }
      // For "Tone of voice", "Grammar & punctuation", "Numbers & values" - match any sub-route
      else if (
        (item.title === "Tone of voice" || 
         item.title === "Grammar & punctuation" || 
         item.title === "Numbers & values") &&
        pathname?.startsWith(item.href + "/")
      ) {
        isActive = true;
      }
      // For other links, use prefix matching but ensure it's a proper segment boundary
      else if (pathname?.startsWith(item.href)) {
        const remainingPath = pathname.slice(item.href.length);
        // Match if remaining path starts with / (proper segment) or is empty
        isActive = remainingPath === "" || remainingPath.startsWith("/");
      }
    }
    
    const isDisabled = item.disabled;

    if (isDisabled || !item.href || item.href === "#") {
      return (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton disabled tooltip={item.title}>
            <Icon />
            <span>{item.title}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    }

    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
          <Link href={item.href}>
            <Icon />
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <Link href="/app/dashboard" className="flex items-center gap-2 px-2 py-3 hover:opacity-80 transition-opacity">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
            I
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold">Intone</span>
            <span className="text-xs text-muted-foreground">Brand language</span>
          </div>
        </Link>
        <div className="px-2 pb-2">
          <BrandSelector />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Rules</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {rulesNav.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {otherNav.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

