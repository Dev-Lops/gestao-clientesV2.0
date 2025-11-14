"use client";

import { useUser } from "@/context/UserContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const verifyOrg = async () => {
      // Ainda está carregando o estado de autenticação
      if (loading) {
        console.log("[ProtectedRoute] Aguardando carregamento do auth...");
        setChecking(true);
        return;
      }

      // Sem usuário → aguarda um pouco antes de redirecionar (pode estar finalizando login)
      if (!user) {
        console.log("[ProtectedRoute] Sem usuário detectado");

        // Se já existe um timeout, cancela
        if (redirectTimeoutRef.current) {
          clearTimeout(redirectTimeoutRef.current);
        }

        // Aguarda 500ms antes de redirecionar para login
        redirectTimeoutRef.current = setTimeout(() => {
          console.log(
            "[ProtectedRoute] Redirecionando para login após timeout",
          );
          router.replace("/login");
        }, 500);

        return;
      }

      // Usuário detectado - cancela qualquer redirecionamento pendente
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }

      console.log("[ProtectedRoute] Usuário autenticado:", user.uid);

      // Firestore não inicializado
      if (!db) {
        console.error("❌ Firestore não inicializado!");
        setChecking(false);
        return;
      }

      try {
        // Primeiro buscamos o documento do usuário para obter orgId
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          console.warn(
            "[ProtectedRoute] Documento do usuário não existe no Firestore, redirecionando para onboarding",
          );
          // Usuário ainda não foi provisionado pelo fluxo de callback admin
          router.replace("/onboarding");
          return;
        }

        const data = userSnap.data() as { orgId?: string };
        console.log("[ProtectedRoute] Dados do usuário no Firestore:", data);

        if (!data?.orgId) {
          console.warn(
            "[ProtectedRoute] Usuário sem orgId, redirecionando para onboarding",
          );
          router.replace("/onboarding");
          return;
        }

        // Consideramos válido quando orgId existe no documento do usuário
        // Evita dependência imediata das rules de leitura da org

        console.log("[ProtectedRoute] ✅ Tudo OK, liberando acesso");
        // Tudo OK, permite acesso
        setChecking(false);
      } catch (err) {
        console.error("⚠️ Erro ao verificar organização do usuário:", err);
        setChecking(false);
      }
    };

    void verifyOrg();

    // Cleanup: cancela timeout ao desmontar
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, [user, loading, router]);

  // Mostra loading enquanto verifica
  if (loading || checking) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3 text-gray-600 animate-pulse">
          <div className="h-8 w-8 rounded-full border-4 border-t-transparent border-gray-400 animate-spin" />
          <p className="text-sm">
            {loading ? "Carregando..." : "Verificando conta..."}
          </p>
        </div>
      </div>
    );
  }

  // Caso não tenha usuário após loading (previne render prematuro)
  if (!user) return null;

  return <>{children}</>;
}
