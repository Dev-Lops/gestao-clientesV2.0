"use client";

import { AuthDebug } from "@/components/AuthDebug";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useUser } from "@/context/UserContext";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function LoginPageInner() {
  const { loginWithGoogle, loading, user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const [isLogging, setIsLogging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasInvite = !!inviteToken;

  // Verificar se há redirect pendente ao montar
  useEffect(() => {
    console.log("[LoginPage] 🚀 Componente montado");
    console.log("[LoginPage] URL:", window.location.href);
    console.log("[LoginPage] Query params:", window.location.search);

    const wasPendingRedirect =
      typeof window !== "undefined" &&
      localStorage.getItem("pendingAuthRedirect") === "true";

    console.log("[LoginPage] Redirect pendente?", wasPendingRedirect);

    if (wasPendingRedirect) {
      console.log(
        "[LoginPage] 🔄 Redirect pendente detectado, aguardando processamento...",
      );

      // Usar função de transição para evitar cascading renders
      const timeoutId = setTimeout(() => {
        setIsLogging(true);
      }, 0);

      // Timeout de segurança: se após 15 segundos ainda estiver loading, resetar
      const cleanupTimeout = setTimeout(() => {
        console.log(
          "[LoginPage] ⚠️ Timeout ao processar redirect, resetando estado",
        );
        setIsLogging(false);
        setError(
          "Timeout ao processar autenticação. Por favor, tente novamente.",
        );
        localStorage.removeItem("pendingAuthRedirect");
        sessionStorage.removeItem("pendingInviteToken");
      }, 15000);

      return () => {
        clearTimeout(timeoutId);
        clearTimeout(cleanupTimeout);
      };
    }
  }, []);

  useEffect(() => {
    if (!loading && user) {
      console.log("[LoginPage] Usuário já autenticado, redirecionando para /");
      router.replace("/");
    }
  }, [loading, user, router]);

  const handleLogin = async () => {
    setIsLogging(true);
    setError(null);
    try {
      await loginWithGoogle(inviteToken);
    } catch (error) {
      console.error("[LoginPage] Erro no login:", error);
      const err = error as { code?: string; message?: string };

      // Mensagens de erro amigáveis
      let errorMessage = "Erro ao fazer login. Por favor, tente novamente.";
      if (err.code === "auth/popup-blocked") {
        errorMessage = "Popup bloqueado. Redirecionando...";
      } else if (err.code === "auth/cancelled-popup-request") {
        errorMessage = "Login cancelado.";
      } else if (err.code === "auth/network-request-failed") {
        errorMessage = "Erro de conexão. Verifique sua internet.";
      }

      setError(errorMessage);
      setIsLogging(false);
    }
  };

  // Se está processando redirect, mostrar tela de loading
  if (isLogging) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-900 p-4">
        <div className="text-center space-y-6">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-linear-to-tr from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-50 animate-pulse" />
            <div className="relative w-16 h-16 bg-linear-to-tr from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white animate-spin" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Conectando...
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              {hasInvite ? "Processando convite" : "Autenticando com Google"}
            </p>
          </div>
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full overflow-hidden bg-background text-foreground items-center justify-center">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob bg-blue-300/40 dark:bg-blue-600/30" />
        <div className="absolute top-0 -right-4 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-2000 bg-purple-300/40 dark:bg-purple-600/30" />
        <div className="absolute -bottom-8 left-20 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-4000 bg-pink-300/40 dark:bg-pink-600/30" />
      </div>

      {/* Left Panel - Brand & Features */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-8 xl:p-10">
        <div className="relative z-10 flex flex-col gap-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-linear-to-tr from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-50" />
              <div className="relative w-12 h-12 bg-linear-to-tr from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            </div>
            <span className="text-3xl font-bold bg-linear-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              MyGest
            </span>
          </div>

          {/* Headline */}
          <div className="space-y-4 max-w-lg">
            <h1 className="text-5xl font-bold leading-tight text-slate-900 dark:text-white">
              Gestão inteligente
              <br />
              <span className="bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                para seu negócio
              </span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              Centralize clientes, projetos e equipes em uma plataforma moderna
              e intuitiva
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            {[
              {
                icon: CheckCircle2,
                title: "Gestão completa de clientes",
                desc: "Acompanhe cada etapa do relacionamento",
              },
              {
                icon: Zap,
                title: "Workflow otimizado",
                desc: "Tarefas, prazos e prioridades organizadas",
              },
              {
                icon: ShieldCheck,
                title: "Seguro e confiável",
                desc: "Autenticação robusta e dados protegidos",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="flex items-start gap-4 p-4 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 transition-all hover:bg-white/80 dark:hover:bg-slate-800/80"
              >
                <div className="shrink-0 w-10 h-10 bg-linear-to-tr from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-sm text-slate-500 dark:text-slate-500">
          © {new Date().getFullYear()} MyGest. Todos os direitos reservados.
        </p>
      </div>

      {/* Right Panel - Login Form */}
      <div className="relative flex w-full lg:w-1/2 items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-linear-to-tr from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-50" />
              <div className="relative w-12 h-12 bg-linear-to-tr from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            </div>
            <span className="text-3xl font-bold bg-linear-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              MyGest
            </span>
          </div>

          {/* Login Card */}
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-linear-to-r from-blue-600 to-purple-600 rounded-3xl blur opacity-20" />

            {/* Card */}
            <div className="relative bg-card text-card-foreground rounded-2xl shadow-2xl border border-border p-8 space-y-6 transition-colors">
              {/* Header */}
              <div className="text-center space-y-2">
                {hasInvite ? (
                  <>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                      Você foi convidado!
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400">
                      Entre para aceitar o convite e acessar a organização
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                      Bem-vindo de volta
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400">
                      Entre com sua conta para continuar
                    </p>
                  </>
                )}
              </div>

              {/* Google Button */}
              <Button
                onClick={handleLogin}
                disabled={isLogging || loading}
                className="w-full h-14 text-base font-semibold bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isLogging || loading ? (
                  <div className="flex items-center gap-3">
                    <LoadingSpinner size="sm" className="text-white" />
                    <span>
                      {hasInvite ? "Aceitando convite..." : "Conectando..."}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span>
                      {hasInvite
                        ? "Aceitar convite com Google"
                        : "Continuar com Google"}
                    </span>
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </div>
                )}
              </Button>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400 text-center">
                    {error}
                  </p>
                </div>
              )}

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Acesso seguro
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="space-y-4">
                <p className="text-center text-xs text-muted-foreground leading-relaxed">
                  Ao continuar, você concorda com nossos{" "}
                  <a
                    href="#"
                    className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline underline-offset-2"
                  >
                    Termos de Uso
                  </a>{" "}
                  e{" "}
                  <a
                    href="#"
                    className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline underline-offset-2"
                  >
                    Política de Privacidade
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Help text */}
          <p className="text-center text-sm text-muted-foreground">
            Precisa de uma conta?{" "}
            <span className="font-semibold text-foreground">
              Solicite acesso ao administrador
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Carregando...
        </div>
      }
    >
      <LoginPageInner />
      <AuthDebug />
    </Suspense>
  );
}
