"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppBreadcrumbs } from "@/components/app-breadcrumbs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Check auth in background (non-blocking)
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, router]);

  // Render static HTML immediately - don't block on auth check
  // Auth check happens in background
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <AppBreadcrumbs />
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider basePath="/api/auth">
      <AuthenticatedLayout>{children}</AuthenticatedLayout>
    </SessionProvider>
  );
}
