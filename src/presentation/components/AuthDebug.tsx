"use client";

import { useEffect, useState } from "react";

/**
 * Componente de debug visual para autenticação
 * Mostra informações sobre o estado do login e CSP
 * Visível quando ?debug=true na URL
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
    firebaseConfig: false,
    authInitialized: false,
    cspViolations: [] as string[],
  });
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    // Verificar se ?debug=true na URL
    const params = new URLSearchParams(window.location.search);
    const debugParam = params.get("debug") === "true";
    const isDev = process.env.NODE_ENV === "development";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowDebug(debugParam || isDev);

    const mountedTimeout = setTimeout(() => setMounted(true), 0);

    // Monitorar violações de CSP
    const violations: string[] = [];
    const handleCSPViolation = (e: SecurityPolicyViolationEvent) => {
      const violation = `${e.violatedDirective}: ${e.blockedURI}`;
      if (!violations.includes(violation)) {
        violations.push(violation);
        console.error("🚨 CSP Violation:", violation);
      }
    };

    document.addEventListener("securitypolicyviolation", handleCSPViolation as EventListener);

    const updateDebug = () => {
      // Verificar configuração Firebase
      const hasFirebaseConfig = !!(
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
      );

      setDebugInfo({
        hasPendingRedirect:
          localStorage.getItem("pendingAuthRedirect") === "true",
        hasInviteToken: !!sessionStorage.getItem("pendingInviteToken"),
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent.substring(0, 60),
        width: window.innerWidth,
        height: window.innerHeight,
        firebaseConfig: hasFirebaseConfig,
        authInitialized:
          typeof window !== "undefined" &&
          !!(window as unknown as { firebase?: unknown }).firebase,
        cspViolations: violations,
      });
    };

    updateDebug();
    const interval = setInterval(updateDebug, 2000);

    return () => {
      clearTimeout(mountedTimeout);
      clearInterval(interval);
      document.removeEventListener("securitypolicyviolation", handleCSPViolation as EventListener);
    };
  }, []);

  // Não mostrar se não for solicitado
  if (!mounted || !showDebug) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-slate-900 text-white p-4 rounded-lg shadow-2xl text-xs font-mono max-w-md z-50 border border-slate-700">
      <div className="flex items-center justify-between mb-3">
        <div className="font-bold text-yellow-400">🔍 Auth Debug</div>
        <button
          onClick={() => {
            localStorage.removeItem("pendingAuthRedirect");
            sessionStorage.removeItem("pendingInviteToken");
            window.location.reload();
          }}
          className="text-xs bg-red-600 hover:bg-red-700 px-2 py-1 rounded"
        >
          Reset
        </button>
      </div>
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
          <span className="text-slate-400">Firebase Config:</span>
          <span
            className={
              debugInfo.firebaseConfig ? "text-green-400" : "text-red-400"
            }
          >
            {debugInfo.firebaseConfig ? "✓ OK" : "✗ Missing"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Screen:</span>
          <span className="text-blue-400">
            {debugInfo.width}x{debugInfo.height}
          </span>
        </div>

        {debugInfo.cspViolations.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-700">
            <div className="text-red-400 font-bold mb-2">
              🚨 CSP Violations ({debugInfo.cspViolations.length})
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto text-[10px]">
              {debugInfo.cspViolations.map((v, i) => (
                <div key={i} className="text-red-300 break-all">
                  {v}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-slate-400 mt-3 text-[10px] truncate border-t border-slate-700 pt-2">
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
