"use client";

import AppSidebar from "@/components/app-sidebar";
import GlobalNotifications from "@/components/GlobalNotifications";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useUser } from "@/context/UserContext";
import React from "react";

export default function AppLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useUser();

  // While loading, render children to avoid layout flicker
  if (loading) return <>{children}</>;

  // If not authenticated, render children normally (no sidebar)
  if (!user) return <>{children}</>;

  // Authenticated: render with sidebar pattern
  // Wrap in a flex container so `SidebarInset`'s flex-1 works as intended
  return (
    <SidebarProvider>
      <div className="min-h-screen flex">
        <AppSidebar />
        <SidebarInset>{children}</SidebarInset>
        {/* Global floating notifications outside sidebar */}
        <GlobalNotifications />
      </div>
    </SidebarProvider>
  );
}
