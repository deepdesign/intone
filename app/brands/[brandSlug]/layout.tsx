"use client";

import AppLayout from "@/app/app/layout";

// Brand routes are separate from app routes, so they need the AppLayout wrapper
export default function BrandLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}

