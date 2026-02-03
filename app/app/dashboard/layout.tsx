// Dashboard layout - no wrapper needed as app/app/layout.tsx already provides the sidebar/header
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
