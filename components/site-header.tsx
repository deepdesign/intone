"use client";

import * as React from "react";
import { Search, Bell, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOut, useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";

interface Brand {
  id: string;
  name: string;
  slug: string;
}

// Module-level cache for brand data
const brandCache = new Map<string, { brand: Brand; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const SELECTED_BRAND_KEY = "selectedBrandId";

export function SiteHeader() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [currentBrand, setCurrentBrand] = React.useState<Brand | null>(null);
  const [loadingBrand, setLoadingBrand] = React.useState(false);
  
  const urlBrandId = params?.brandId as string | undefined;
  // Get stored brand from localStorage if no brandId in URL (e.g., on Dashboard)
  const [storedBrandId, setStoredBrandId] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(SELECTED_BRAND_KEY);
      setStoredBrandId(stored);
    }
  }, [urlBrandId]); // Re-check when URL brandId changes
  
  // Use URL brandId first, fall back to stored brandId
  const currentBrandId = urlBrandId || storedBrandId || undefined;

  // Fetch current brand when brandId changes (with caching, non-blocking)
  React.useEffect(() => {
    if (!currentBrandId) {
      setCurrentBrand(null);
      setLoadingBrand(false);
      return;
    }

    // Check cache first (instant)
    const cached = brandCache.get(currentBrandId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setCurrentBrand(cached.brand);
      setLoadingBrand(false);
      return; // Use cache, don't fetch
    }

    // Don't show loading - fetch in background (non-blocking)
    setLoadingBrand(false);
    
    // Fetch in background (doesn't block rendering)
    fetch(`/api/brands/${currentBrandId}`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          // Silently fail - don't show error, just don't display brand
          setCurrentBrand(null);
          return;
        }
        const data = await res.json();
        const brand = {
          id: data.id,
          name: data.name,
          slug: data.slug,
        };
        // Update cache
        brandCache.set(currentBrandId, { brand, timestamp: Date.now() });
        setCurrentBrand(brand);
      })
      .catch((error) => {
        // Silently fail - don't log or show error
        setCurrentBrand(null);
      });
  }, [currentBrandId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log("Search:", searchQuery);
  };

  const handleSignOut = async () => {
    try {
      // Use NextAuth's signOut function
      await signOut({ 
        callbackUrl: "/",
        redirect: false 
      });
      // Manually redirect to landing page after sign out
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Sign out error:", error);
      // Fallback: redirect to landing page if signOut fails
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
  };

  const user = session?.user;
  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0].toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      
      {/* Brand Logo and Name - Always show when brand is active */}
      {currentBrandId ? (
        currentBrand ? (
          <div className="flex items-center gap-2 min-w-0">
            {/* Brand Logo Placeholder */}
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
              <span className="text-sm font-semibold">
                {currentBrand.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </span>
            </div>
            <span className="font-semibold truncate">{currentBrand.name}</span>
          </div>
        ) : (
          // Show placeholder with brandId if cache is missing (fetch happens in background)
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0">
              <span className="text-sm font-semibold">B</span>
            </div>
            <span className="font-semibold truncate text-muted-foreground">Brand</span>
          </div>
        )
      ) : null}

      <Separator orientation="vertical" className="mx-2 h-4" />

      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search brands, rules, or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-4"
          />
        </div>
      </form>

      <div className="ml-auto flex items-center gap-2">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Bell className="h-4 w-4" />
          <span className="sr-only">Notifications</span>
        </Button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.image || ""} alt={user?.name || "User"} />
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name || "User"}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email || "Not signed in"}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/app/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

