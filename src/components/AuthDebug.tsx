"use client";

import { useEffect, useState } from "react";

/**
 * Componente de debug visual para autenticação (apenas em desenvolvimento)
 * Mostra informações sobre o estado do login mobile
 */
export function AuthDebug() {
  const [mounted, setMounted] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    hasPendingRedirect: false,
    hasInviteToken: false,
    timestamp: "",
    userAgent: "",
    width: 0,
    height: 0,
  });

  useEffect(() => {
    setMounted(true);

    const updateDebug = () => {
      setDebugInfo({
        hasPendingRedirect:
          localStorage.getItem("pendingAuthRedirect") === "true",
        hasInviteToken: !!sessionStorage.getItem("pendingInviteToken"),
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent.substring(0, 60),
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateDebug();
    const interval = setInterval(updateDebug, 1000);

    return () => clearInterval(interval);
  }, []);

  // Apenas mostrar em desenvolvimento e após montar
  if (process.env.NODE_ENV !== "development" || !mounted) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-slate-900 text-white p-4 rounded-lg shadow-2xl text-xs font-mono max-w-xs z-50 border border-slate-700">
      <div className="font-bold mb-2 text-yellow-400">🔍 Auth Debug</div>
      <div className="space-y-1">
        <div className="flex justify-between">
          <span className="text-slate-400">Pending Redirect:</span>
          <span
            className={
              debugInfo.hasPendingRedirect ? "text-green-400" : "text-slate-500"
            }
          >
            {debugInfo.hasPendingRedirect ? "✓ Yes" : "✗ No"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Invite Token:</span>
          <span
            className={
              debugInfo.hasInviteToken ? "text-green-400" : "text-slate-500"
            }
          >
            {debugInfo.hasInviteToken ? "✓ Yes" : "✗ No"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Screen:</span>
          <span className="text-blue-400">
            {debugInfo.width}x{debugInfo.height}
          </span>
        </div>
        <div className="text-slate-400 mt-2 text-[10px] truncate">
          UA: {debugInfo.userAgent}...
        </div>
        {debugInfo.timestamp && (
          <div className="text-slate-500 text-[10px] mt-1">
            {debugInfo.timestamp.split("T")[1].split(".")[0]}
          </div>
        )}
      </div>
    </div>
  );
}
