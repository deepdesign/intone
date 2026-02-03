"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignOutPage() {
  const router = useRouter();

  useEffect(() => {
    // Sign out and redirect
    signOut({ 
      callbackUrl: "/",
      redirect: true 
    }).catch((error) => {
      console.error("Sign out error:", error);
      // Fallback: redirect to landing page
      router.push("/");
    });
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground">Signing you out...</p>
      </div>
    </div>
  );
}

