"use client";
import { auth, provider } from "@/lib/firebase";
import { logger, type LogContext } from '@/lib/logger';
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

// Extend Firebase User with custom properties from DB
interface ExtendedUser extends User {
  image?: string | null;
}

interface UserContextType {
  user: ExtendedUser | null;
  loading: boolean;
  loginWithGoogle: (inviteToken?: string | null) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  // Atualiza presença em tempo real no Firebase Realtime Database
  usePresence(user?.uid);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch user profile from DB and merge with Firebase user
  const enrichUserWithProfile = useCallback(async (firebaseUser: User): Promise<ExtendedUser> => {
    try {
      const res = await fetch("/api/profile", { credentials: 'include' });
      if (res.ok) {
        const profile = await res.json();
        return {
          ...firebaseUser,
          image: profile.image || firebaseUser.photoURL || null,
        };
      }
    } catch (err) {
      if (DEBUG_AUTH) logger.debug('Failed to fetch user profile', err as LogContext);
    }
    return {
      ...firebaseUser,
      image: firebaseUser.photoURL || null,
    };
  }, []);

  // Shared logic for handling authentication result (from popup or redirect)
  const handleAuthResult = useCallback(async (firebaseUser: User, inviteToken?: string | null) => {
    if (DEBUG_AUTH) logger.debug('UserContext: setUser', { uid: firebaseUser.uid });
    // Não é possível checar cookie httpOnly via JS, confiar no backend
    const idToken = await firebaseUser.getIdToken(true);
    if (!idToken) throw new Error("Falha ao obter ID token");

    let response: Response;
    try {
      const apiUrl = typeof window !== 'undefined' ? new URL('/api/session', window.location.origin).toString() : '/api/session';
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, skipOrgCreation: inviteToken ? true : false, inviteToken: inviteToken || undefined }),
        credentials: 'include',
      });

      if (!response.ok) {
        let errorText = '';
        let errorJson: { error?: string } | undefined;
        try {
          errorJson = await response.json();
          errorText = JSON.stringify(errorJson);
        } catch {
          errorText = 'Erro ao autenticar';
        }
        if (DEBUG_AUTH) logger.error('UserContext: erro sessão', errorText);
        const invalid = /Invalid token/.test(errorText) || errorJson?.error === 'Invalid token';
        if (invalid && auth) { await signOut(auth); setUser(null); }
        throw new Error("Falha ao criar sessão");
      }
      if (DEBUG_AUTH) logger.debug('UserContext: sessão OK');

      // Parse session response body (server may have accepted invite and returned nextPath/inviteStatus)
      let sessionJson: any = null
      try {
        sessionJson = await response.clone().json().catch(() => null)
      } catch { }

      // If server indicated an invite mismatch, surface as explicit error so UI can handle it
      try {
        const inviteStatus = sessionJson?.inviteStatus
        if (inviteStatus && inviteStatus.status === 'mismatch') {
          // Provide the invited email in the error message so UI can show it
          throw new Error(`INVITE_MISMATCH:${inviteStatus.email || ''}`)
        }
      } catch (e) {
        // Re-throw to be caught by outer try/catch
        throw e
      }

      // Session cookie should be set now; fetch profile using server session
      try {
        const enrichedUser = await enrichUserWithProfile(firebaseUser);
        setUser(enrichedUser);
      } catch (err) {
        if (DEBUG_AUTH) logger.debug('UserContext: falha ao obter profile após criar sessão', err as LogContext);
      }

      let nextPath: string | null = sessionJson?.nextPath || null;

      // If server didn't accept invite during session creation, fallback to client-side check
      if (!nextPath) {
        try {
          const inv = await fetch("/api/invites/for-me", { credentials: 'include' });
          if (inv.ok) {
            const data = await inv.json();
            const invite = Array.isArray(data?.data) ? data.data[0] : undefined;
            if (invite) {
              if (DEBUG_AUTH) logger.debug('UserContext: convite pendente, redirecionando para aceitar');
              const r = await fetch("/api/invites/accept", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: invite.token }), credentials: 'include' });
              if (r.ok) { const j = await r.json(); nextPath = j.nextPath || null; }
            }
          }
        } catch { }
      }

      if (!nextPath) {
        try {
          const s = await fetch("/api/session", { credentials: 'include' });
          if (s.ok) {
            const j = await s.json();
            nextPath = j.orgId ? "/" : "/onboarding";
          } else nextPath = "/login";
        } catch { nextPath = "/"; }
      }
      if (DEBUG_AUTH) logger.debug('UserContext: redirect', { nextPath });
      router.refresh();
      // Adiciona pequeno delay para garantir que sessão/cookie foi propagado
      setTimeout(() => {
        if (nextPath) router.push(nextPath);
      }, 300);
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


    // Adiciona timeout visual e logs para diagnóstico
    let loginTimeout: NodeJS.Timeout | null = null;
    const checkRedirectResult = async () => {
      if (!auth || isCheckingRedirect) return;
      isCheckingRedirect = true;
      const wasPendingRedirect = localStorage.getItem("pendingAuthRedirect") === "true";
      if (DEBUG_AUTH) logger.debug('[UserContext] Iniciando checkRedirectResult', { wasPendingRedirect });
      loginTimeout = setTimeout(() => {
        if (DEBUG_AUTH) logger.error('[UserContext] Timeout no login após redirect');
        setLoading(false);
      }, 10000); // 10 segundos
      try {
        const result = await getRedirectResult(auth);
        if (DEBUG_AUTH) logger.debug('[UserContext] getRedirectResult', { result });
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
      } catch (err) {
        if (DEBUG_AUTH) logger.error('[UserContext] Erro em getRedirectResult', err);
        localStorage.removeItem("pendingAuthRedirect");
        sessionStorage.removeItem("pendingInviteToken");
        setLoading(false);
      } finally {
        if (loginTimeout) clearTimeout(loginTimeout);
        isCheckingRedirect = false;
      }
    };

    checkRedirectResult();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {

      // Se usuário autenticado mas sem sessão ativa, pode ser resultado de redirect mobile
      if (firebaseUser) {
        const wasPendingRedirect =
          localStorage.getItem("pendingAuthRedirect") === "true";

        // Verifica se tem sessão ativa
        try {
          const sessionCheck = await fetch("/api/session", { method: "GET", credentials: 'include' });
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

      const enrichedUser = firebaseUser ? await enrichUserWithProfile(firebaseUser) : null;
      setUser(enrichedUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [handleAuthResult, enrichUserWithProfile]);

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
      await fetch("/api/logout", { method: "POST", credentials: 'include' });

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
      const enrichedUser = await enrichUserWithProfile(auth.currentUser);
      setUser(enrichedUser);
      // Também força um refresh do router para SSR consumir novos dados
      try {
        router.refresh();
      } catch { }
    }
  }, [router, enrichUserWithProfile]);

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
