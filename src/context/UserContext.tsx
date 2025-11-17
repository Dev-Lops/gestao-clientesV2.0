"use client";
import { auth, provider } from "@/lib/firebase";
import { logger } from '@/lib/logger';
import { usePresence } from "@/lib/usePresence";
import { getRedirectResult, onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut, User } from "firebase/auth";
import { useRouter } from 'next/navigation';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";

// Lightweight mobile detection (popup vs redirect)
const isMobileDevice = () => {
  if (typeof window === "undefined") return false;
  return /android|iphone|ipad|ipod|mobile|windows phone|opera mini|blackberry|webos/i.test(navigator.userAgent.toLowerCase()) || window.innerWidth < 768;
};

// Enable verbose auth debug logs only if explicitly requested
const DEBUG_AUTH = typeof process !== "undefined" && process.env.NEXT_PUBLIC_DEBUG_AUTH === "true";

interface UserContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: (inviteToken?: string | null) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  // Atualiza presença em tempo real no Firebase Realtime Database
  usePresence(user?.uid);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Shared logic for handling authentication result (from popup or redirect)
  const handleAuthResult = useCallback(async (firebaseUser: User, inviteToken?: string | null) => {
    if (DEBUG_AUTH) logger.debug('UserContext: setUser', { uid: firebaseUser.uid });
    setUser(firebaseUser);
    const idToken = await firebaseUser.getIdToken(true);
    if (!idToken) throw new Error("Falha ao obter ID token");

    let response: Response
    // const errorJson: { error?: string } | null = null
    try {
      response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, skipOrgCreation: inviteToken ? true : false })
      });

      if (!response.ok) {
        let errorText = '';
        let errorJson: { error?: string } | undefined;

        try {
          // Tenta parsear como JSON primeiro
          errorJson = await response.json();
          errorText = JSON.stringify(errorJson);
        } catch {
          // Se falhar, clona a resposta não consumida e tenta text()
          // Mas isso não funciona porque já consumimos o stream
          errorText = 'Erro ao autenticar';
        }

        if (DEBUG_AUTH) logger.error('UserContext: erro sessão', errorText);
        const invalid = /Invalid token/.test(errorText) || errorJson?.error === 'Invalid token';
        if (invalid && auth) { await signOut(auth); setUser(null); }
        throw new Error("Falha ao criar sessão");
      }
      if (DEBUG_AUTH) logger.debug('UserContext: sessão OK');

      let nextPath: string | null = null;
      try {
        const inv = await fetch("/api/invites/for-me");
        if (inv.ok) {
          const data = await inv.json();
          const invite = Array.isArray(data?.data) ? data.data[0] : undefined;
          if (invite) {
            if (DEBUG_AUTH) logger.debug('UserContext: convite pendente, redirecionando para aceitar');
            const r = await fetch("/api/invites/accept", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: invite.token }) });
            if (r.ok) { const j = await r.json(); nextPath = j.nextPath || null; }
          }
        }
      } catch { }

      if (!nextPath) {
        try {
          const s = await fetch("/api/session");
          if (s.ok) {
            const j = await s.json();
            nextPath = j.orgId ? "/" : "/onboarding";
          } else nextPath = "/login";
        } catch { nextPath = "/"; }
      }
      if (DEBUG_AUTH) logger.debug('UserContext: redirect', { nextPath });
      router.refresh();
      if (nextPath) router.push(nextPath);
    } catch (error) {
      console.error('Error in handleAuthResult:', error);
      throw error;
    }
  }, [router]);

  useEffect(() => {
    if (!auth) {
      // If auth is not initialized (missing env or server-side), don't try to
      // subscribe. Mark loading as false so the UI can continue.
      // Avoid synchronous setState inside effect body (can trigger cascading renders)
      Promise.resolve().then(() => setLoading(false));
      return;
    }

    let isCheckingRedirect = false;

    // Check for redirect result when component mounts (for mobile login)
    const checkRedirectResult = async () => {
      if (!auth || isCheckingRedirect) return;
      isCheckingRedirect = true;
      const wasPendingRedirect = localStorage.getItem("pendingAuthRedirect") === "true";
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          localStorage.removeItem("pendingAuthRedirect");
          const inviteToken = sessionStorage.getItem("pendingInviteToken");
          if (inviteToken) sessionStorage.removeItem("pendingInviteToken");
          await handleAuthResult(result.user, inviteToken);
        } else {
          if (wasPendingRedirect) {
            localStorage.removeItem("pendingAuthRedirect");
            sessionStorage.removeItem("pendingInviteToken");
          }
          setLoading(false);
        }
      } catch {
        localStorage.removeItem("pendingAuthRedirect");
        sessionStorage.removeItem("pendingInviteToken");
        setLoading(false);
      } finally { isCheckingRedirect = false; }
    };

    checkRedirectResult();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {

      // Se usuário autenticado mas sem sessão ativa, pode ser resultado de redirect mobile
      if (firebaseUser) {
        const wasPendingRedirect =
          localStorage.getItem("pendingAuthRedirect") === "true";

        // Verifica se tem sessão ativa
        try {
          const sessionCheck = await fetch("/api/session", { method: "GET" });
          const hasSession = sessionCheck.ok;



          // Se tem usuário mas não tem sessão e tinha redirect pendente, processar
          if (!hasSession && wasPendingRedirect) {

            const inviteToken = sessionStorage.getItem("pendingInviteToken");
            if (inviteToken) {
              sessionStorage.removeItem("pendingInviteToken");
            }
            localStorage.removeItem("pendingAuthRedirect");
            await handleAuthResult(firebaseUser, inviteToken);
            return; // Exit early to avoid setting loading to false
          }
        } catch {

        }
      }

      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [handleAuthResult]);

  const loginWithGoogle = async (inviteToken?: string | null) => {
    if (!auth || !provider) {
      console.error("[UserContext] ❌ Firebase não inicializado");
      throw new Error("Firebase auth not initialized");
    }

    if (DEBUG_AUTH) logger.debug('UserContext: login', { inviteToken });

    // Store invite token in sessionStorage so it's available after redirect
    if (inviteToken) {

      sessionStorage.setItem("pendingInviteToken", inviteToken);
    }

    const useMobile = isMobileDevice();


    try {
      // Mobile: sempre usar redirect (popups não funcionam bem)
      if (useMobile) {

        // Marcar que estamos aguardando um redirect
        localStorage.setItem("pendingAuthRedirect", "true");


        await signInWithRedirect(auth, provider);

        // redirect flow continues in checkRedirectResult
        return;
      }

      // Desktop: tentar popup primeiro, fallback para redirect

      try {
        const result = await signInWithPopup(auth, provider);

        await handleAuthResult(result.user, inviteToken);
      } catch (e: unknown) {
        // Fallback para redirect se popup falhar (bloqueado pelo navegador)
        const code = (e as { code?: string } | null | undefined)?.code || "";
        const popupIssues = [
          "auth/popup-blocked",
          "auth/cancelled-popup-request",
          "auth/popup-closed-by-user",
        ];

        if (popupIssues.includes(code)) {

          localStorage.setItem("pendingAuthRedirect", "true");
          await signInWithRedirect(auth, provider);
        } else {

          throw e;
        }
      }
    } catch (error) {

      // Limpar storage em caso de erro
      localStorage.removeItem("pendingAuthRedirect");
      sessionStorage.removeItem("pendingInviteToken");

      throw error;
    }
  };

  const logout = async () => {
    if (!auth) throw new Error("Firebase auth not initialized");

    try {
      // Remove cookie do servidor PRIMEIRO
      await fetch("/api/logout", { method: "POST" });

      // Faz logout do Firebase
      await signOut(auth);

      // Força refresh e redireciona
      router.refresh();
      router.push("/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      // Mesmo com erro, tenta redirecionar
      router.push("/login");
    }
  };

  const refreshUser = useCallback(async () => {
    if (!auth) return;
    if (auth.currentUser) {
      try {
        await auth.currentUser.reload();
      } catch {

      }
      setUser(auth.currentUser);
      // Também força um refresh do router para SSR consumir novos dados
      try {
        router.refresh();
      } catch { }
    }
  }, [router]);

  return (
    <UserContext.Provider
      value={{ user, loading, loginWithGoogle, logout, refreshUser }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser deve ser usado dentro de UserProvider");
  return ctx;
};
