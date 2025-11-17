"use client";

import { useUser } from "@/context/UserContext";
import { db } from "@/lib/firebase";
import { logger } from "@/lib/logger";
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
        logger.debug('ProtectedRoute: aguardando carregamento do auth');
        setChecking(true);
        return;
      }

      // Sem usuário → aguarda um pouco antes de redirecionar (pode estar finalizando login)
      if (!user) {
        logger.debug('ProtectedRoute: sem usuário detectado');

        // Se já existe um timeout, cancela
        if (redirectTimeoutRef.current) {
          clearTimeout(redirectTimeoutRef.current);
        }

        // Aguarda 500ms antes de redirecionar para login
        redirectTimeoutRef.current = setTimeout(() => {
          console.log(
            "          logger.debug('ProtectedRoute: redirecionando para login', { currentPath: pathname });",
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

      logger.debug('ProtectedRoute: usuário autenticado', { uid: user.uid });

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
        logger.debug('ProtectedRoute: dados do Firestore carregados', { orgId: data?.orgId });

        if (!data?.orgId) {
          console.warn(
            "[ProtectedRoute] Usuário sem orgId, redirecionando para onboarding",
          );
          router.replace("/onboarding");
          return;
        }

        // Consideramos válido quando orgId existe no documento do usuário
        // Evita dependência imediata das rules de leitura da org

        logger.debug('ProtectedRoute: acesso liberado');
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
      <div className="flex h-screen w-full items-center justify-center ">
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
