"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface Brand {
  id: string;
  name: string;
  slug: string;
  org: {
    name: string;
  };
}

const SELECTED_BRAND_KEY = "selectedBrandId";
const BRANDS_CACHE_KEY = "brandsCache";
const BRANDS_CACHE_TIMESTAMP_KEY = "brandsCacheTimestamp";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Module-level cache to prevent re-fetching on every mount
let brandsCache: Brand[] | null = null;
let brandsCacheTimestamp: number = 0;

export function BrandSelector() {
  const params = useParams();
  const router = useRouter();
  const currentBrandId = params?.brandId as string | undefined;
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false); // Start as false - use cache first
  const [storedBrandId, setStoredBrandId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // Initialize storedBrandId from localStorage (client-side only, after mount)
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(SELECTED_BRAND_KEY);
      setStoredBrandId(stored);
    }
  }, []);

  // Save brand to localStorage when brandId changes
  useEffect(() => {
    if (currentBrandId && typeof window !== "undefined") {
      localStorage.setItem(SELECTED_BRAND_KEY, currentBrandId);
      setStoredBrandId(currentBrandId);
    }
  }, [currentBrandId]);

  // Use URL brandId first, fall back to stored brandId (only after mount to avoid hydration mismatch)
  const effectiveBrandId = currentBrandId || (mounted ? storedBrandId : null) || "";

  // Load from cache first (instant, no fetch)
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Try module-level cache first (instant)
    if (brandsCache && Date.now() - brandsCacheTimestamp < CACHE_DURATION) {
      setBrands(brandsCache);
      setLoading(false);
      return; // Use cache, don't fetch
    }
    
    // Try localStorage cache (instant)
    try {
      const cached = localStorage.getItem(BRANDS_CACHE_KEY);
      const cachedTimestamp = localStorage.getItem(BRANDS_CACHE_TIMESTAMP_KEY);
      if (cached && cachedTimestamp) {
        const timestamp = parseInt(cachedTimestamp, 10);
        if (Date.now() - timestamp < CACHE_DURATION) {
          const parsed = JSON.parse(cached);
          brandsCache = parsed;
          brandsCacheTimestamp = timestamp;
          setBrands(parsed);
          setLoading(false);
          return; // Use cache, don't fetch
        }
      }
    } catch (e) {
      // Ignore cache errors
    }
    
    // Only fetch if no valid cache (non-blocking, happens in background)
    // Don't set loading - show cached/empty state immediately, fetch in background
    fetch("/api/brands", {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(async (res) => {
        const contentType = res.headers.get("content-type");
        const isJson = contentType && contentType.includes("application/json");
        
        if (!res.ok) {
          // Handle 401 Unauthorized gracefully - user might not be logged in
          if (res.status === 401) {
            console.log("User not authenticated, redirecting to login...");
            // Don't throw error, just set empty brands and let middleware handle redirect
            setBrands([]);
            setLoading(false);
            return;
          }
          
          let errorMessage = `HTTP error! status: ${res.status}`;
          if (isJson) {
            try {
              const error = await res.json();
              errorMessage = error.error || error.message || errorMessage;
              // Only log non-401 errors to avoid noise
              if (res.status !== 401) {
                console.error("Error response from /api/brands:", {
                  error: error.error,
                  message: error.message,
                  status: res.status,
                  ...(error.stack ? { stack: error.stack } : {})
                });
              }
            } catch (e) {
              console.error("Failed to parse error JSON:", e);
            }
          } else {
            // Try to read as text if not JSON
            try {
              const text = await res.text();
              if (res.status !== 401) {
                console.error("Non-JSON error response:", text.substring(0, 200));
              }
              errorMessage = text.substring(0, 100) || errorMessage;
            } catch (e) {
              console.error("Failed to read error response:", e);
            }
          }
          
          // Only throw for non-401 errors
          if (res.status !== 401) {
            throw new Error(errorMessage);
          }
          return;
        }
        
        if (!isJson) {
          throw new Error("Response is not JSON");
        }
        
        const data = await res.json();
        return data;
      })
      .then((data) => {
        if (data) {
          // Update cache
          brandsCache = data;
          brandsCacheTimestamp = Date.now();
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem(BRANDS_CACHE_KEY, JSON.stringify(data));
              localStorage.setItem(BRANDS_CACHE_TIMESTAMP_KEY, String(brandsCacheTimestamp));
            } catch (e) {
              // Ignore localStorage errors
            }
          }
          setBrands(data);
        }
        setLoading(false);
      })
      .catch((error) => {
        // Only log non-401 errors
        if (!error.message?.includes("Unauthorized")) {
          console.error("Error fetching brands:", error);
        }
        setBrands([]);
        setLoading(false);
      });
  }, []);

  // Don't show loading if we have cached brands or if fetch is in progress
  // Just show the selector with whatever brands we have (cached or empty)
  // The fetch happens in background and updates when complete

  const currentBrand = brands.find((b) => b.id === currentBrandId);

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground">Brand</label>
      <div className="flex gap-2">
        <Select
          value={effectiveBrandId}
          onValueChange={(value) => {
            if (value) {
              // Save to localStorage
              if (typeof window !== "undefined") {
                localStorage.setItem(SELECTED_BRAND_KEY, value);
              }
              router.push(`/brands/${value}/rules/tone/settings`);
            }
          }}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select a brand" />
          </SelectTrigger>
          <SelectContent>
            {brands.map((brand) => (
              <SelectItem key={brand.id} value={brand.id}>
                {brand.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="icon"
          variant="outline"
          onClick={() => router.push("/brands/new")}
          title="Create new brand"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {currentBrand && (
        <p className="text-xs text-muted-foreground">{currentBrand.org.name}</p>
      )}
    </div>
  );
}
