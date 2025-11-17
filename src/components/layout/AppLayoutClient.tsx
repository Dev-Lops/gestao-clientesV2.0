"use client";

import AppSidebar from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useUser } from "@/context/UserContext";
import { usePathname } from "next/navigation";
import React from "react";

export default function AppLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useUser();
  const pathname = usePathname();

  // While loading, render children to avoid layout flicker
  if (loading) return <>{children}</>;

  // If not authenticated, render children normally (no sidebar)
  // Also hide sidebar explicitly on the login page
  if (!user || pathname === "/login") return <>{children}</>;

  // Authenticated: render with sidebar pattern
  // Wrap in a flex container so `SidebarInset`'s flex-1 works as intended
  return (
    <SidebarProvider>
      <div className="min-h-screen flex relative">
        {/* Botão de menu visível só em mobile, fixo no topo esquerdo */}
        <div className="sm:block lg:hidden fixed top-2 left-2 z-50">
          <SidebarTrigger className="p-2 rounded-lg bg-white dark:bg-slate-900 shadow-md border border-slate-200 dark:border-slate-800" />
        </div>
        <AppSidebar />
        <SidebarInset>{children}</SidebarInset>
      </div>
    </SidebarProvider>
  );
}
