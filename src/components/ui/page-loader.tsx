"use client";

import { Spinner } from "@/components/ui/spinner";
import { useEffect, useState } from "react";

export function PageLoader() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Delay para evitar flash em carregamentos rápidos
    const timer = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-slate-950/80">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          {/* Círculo externo animado */}
          <div className="absolute inset-0 rounded-full bg-linear-to-tr from-blue-500 to-purple-600 opacity-20 blur-xl animate-pulse" />

          {/* Spinner principal */}
          <div className="relative">
            <Spinner size="xl" variant="primary" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 animate-pulse">
            Carregando...
          </p>
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function FullPageLoader({ message }: { message?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900">
      <div className="flex flex-col items-center gap-6 p-8">
        {/* Logo ou ícone animado */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-linear-to-tr from-blue-500 via-purple-500 to-pink-500 opacity-30 blur-2xl animate-pulse" />
          <div className="relative w-24 h-24 rounded-full bg-linear-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-2xl">
            <Spinner size="lg" variant="white" />
          </div>
        </div>

        {/* Texto */}
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
            {message || "Preparando tudo para você"}
          </h2>
          <div className="flex gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-2 h-2 bg-pink-600 rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CardLoader() {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" variant="primary" />
        <p className="text-sm text-slate-500">Carregando dados...</p>
      </div>
    </div>
  );
}

export function InlineLoader() {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-600">
      <Spinner size="sm" variant="primary" />
      <span>Carregando...</span>
    </div>
  );
}
