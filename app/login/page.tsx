"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for error in URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get("error");
    const invalidSession = params.get("invalid_session");
    
    if (errorParam) {
      setError(errorParam);
      console.error("NextAuth error:", errorParam);
    } else if (invalidSession) {
      setError("Your session is invalid. Please sign in again with Google to create your account link.");
    }
  }, []);

  // Check if session is actually valid (not just "authenticated" status)
  useEffect(() => {
    console.log("Login page - Session status:", status, "Session:", session);
    
    if (status === "authenticated" && session) {
      // Verify the session is actually valid by checking if we can access user data
      fetch("/api/orgs", {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      })
        .then(async (res) => {
          if (res.ok) {
            // Session is valid, redirect to dashboard
            console.log("User is authenticated and session is valid, redirecting to dashboard");
            window.location.href = "/app/dashboard";
          } else if (res.status === 401) {
            // Session exists but is invalid (no Account record) - force sign out
            console.log("Session exists but is invalid (401), forcing sign out");
            setIsClearing(true);
            
            try {
              await signOut({ redirect: false });
            } catch (error) {
              console.error("Sign out error:", error);
            }
            
            // Clear cookies
            if (typeof document !== "undefined") {
              const cookieNames = [
                "next-auth.session-token",
                "__Secure-next-auth.session-token",
                "authjs.session-token",
                "__Secure-authjs.session-token",
              ];
              
              cookieNames.forEach((name) => {
                document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
                document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=${window.location.hostname};`;
              });
            }
            
            setIsClearing(false);
            // Reload to clear session state
            window.location.href = `/login?invalid_session=true`;
          } else {
            // Other error - still try to redirect, let dashboard handle it
            console.log("Session check returned non-401 error, redirecting anyway");
            window.location.href = "/app/dashboard";
          }
        })
        .catch((error) => {
          console.error("Error checking session validity:", error);
          // On error, don't redirect - let user manually sign in
        });
    }
  }, [status, session]);

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/app/dashboard" });
  };

  const handleForceLogout = async () => {
    setIsClearing(true);
    
    try {
      // Try server-side signout first
      await signOut({ redirect: false });
    } catch (error) {
      console.error("Sign out error:", error);
    }
    
    // Clear all cookies (client-side)
    if (typeof document !== "undefined") {
      const cookies = document.cookie.split(";");
      const cookieNames = [
        "next-auth.session-token",
        "__Secure-next-auth.session-token",
        "authjs.session-token",
        "__Secure-authjs.session-token",
      ];
      
      // Clear specific session cookies
      cookieNames.forEach((name) => {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=${window.location.hostname};`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=.${window.location.hostname};`;
      });
      
      // Clear any other auth-related cookies
      cookies.forEach((c) => {
        const cookieName = c.split("=")[0].trim();
        if (cookieName.includes("auth") || cookieName.includes("session")) {
          document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
          document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=${window.location.hostname};`;
          document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=.${window.location.hostname};`;
        }
      });
    }
    
    // Force reload to clear session state
    setIsClearing(false);
    window.location.href = `/login?cleared=${Date.now()}&invalid_session=true`;
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <p className="text-sm font-medium text-destructive mb-2">
                Authentication error: {error}
              </p>
              <p className="text-xs text-destructive/80 mb-2">
                {error === "Configuration" 
                  ? "There's a configuration issue with authentication. Please check server logs for details."
                  : "An error occurred during authentication. Please try again."}
              </p>
            </div>
          )}
          {session && (
            <div className="rounded-lg border border-[var(--semantic-warning)]/50 bg-[var(--semantic-warning)]/10 p-4">
              <p className="text-sm font-medium text-[var(--semantic-warning)] mb-2">
                You're currently signed in as: {session.user?.email || "Unknown"}
              </p>
              <Button 
                onClick={handleForceLogout} 
                variant="outline" 
                size="sm" 
                className="w-full"
                disabled={isClearing}
              >
                {isClearing ? "Clearing session..." : "Force logout and clear session"}
              </Button>
            </div>
          )}
          <Button onClick={handleGoogleSignIn} className="w-full" variant="outline">
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/signup" className="underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
