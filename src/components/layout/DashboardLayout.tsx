"use client";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Minimal passthrough layout kept for compatibility with any imports.
export function DashboardLayout({ children }: DashboardLayoutProps) {
  return <>{children}</>;
}
