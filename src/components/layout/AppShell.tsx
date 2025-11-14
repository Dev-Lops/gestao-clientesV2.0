"use client";

import { useUser } from "@/context/UserContext";
import { useEffect } from "react";
// Sidebar rendering moved to global AppSidebar (AppLayoutClient)

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { user, loading } = useUser();
  // Sidebar open/close handled globally by SidebarProvider

  // Heartbeat: marca usuário como ativo periodicamente
  useEffect(() => {
    let intervalId: number | null = null;
    const beat = async () => {
      try {
        await fetch("/api/activity/heartbeat", { method: "POST" });
      } catch {}
    };
    if (user) {
      // imediato no mount
      beat();
      // a cada 60s
      intervalId = window.setInterval(beat, 60_000);
      // ao voltar o foco/visibilidade
      const onVis = () => {
        if (document.visibilityState === "visible") beat();
      };
      document.addEventListener("visibilitychange", onVis);
      return () => {
        if (intervalId) window.clearInterval(intervalId);
        document.removeEventListener("visibilitychange", onVis);
      };
    }
    return () => {
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [user]);

  // While loading, render nothing to avoid flicker
  if (loading) return <>{children}</>;

  // If user not authenticated, render children only
  if (!user) return <>{children}</>;

  // Layout fixo: Sidebar nunca rola, main ocupa todo espaço e rola
  return (
    <div className="flex-1 min-h-0 bg-background text-foreground flex overflow-hidden transition-colors">
      <main className="flex-1 min-h-0 overflow-y-auto">
        <div className="w-full px-6 sm:px-8 py-4 sm:py-6">{children}</div>
      </main>
    </div>
  );
}
