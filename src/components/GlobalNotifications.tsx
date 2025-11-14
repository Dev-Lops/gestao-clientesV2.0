"use client";

import { NotificationCenter } from "@/components/NotificationCenter";
import { useSidebar } from "@/components/ui/sidebar";

// Exibe o botão de notificações fora do sidebar (overlay/fixed) adaptando variante conforme colapso.
// Mantém posição respeitando a margem do conteúdo (SidebarInset aplica ml no container).
export function GlobalNotifications() {
  const { collapsed } = useSidebar();
  // Ajusta deslocamento horizontal para evitar sobreposição quando sidebar overlay em mobile
  // Em telas grandes o conteúdo já tem margem; mantemos right-4 para encostar na borda do container.
  return (
    <div
      className="pointer-events-auto fixed top-4 right-4 z-40 flex items-center"
      aria-label="Notificações globais"
    >
      <NotificationCenter variant={collapsed ? "compact" : "pill"} />
    </div>
  );
}

export default GlobalNotifications;
