"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Instagram, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

type IgMedia = {
  id: string;
  media_url: string;
  permalink: string;
  thumbnail_url?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
};

interface InstagramGridProps {
  clientId: string;
  limit?: number;
}

export function InstagramGrid({ clientId, limit = 12 }: InstagramGridProps) {
  const [items, setItems] = useState<IgMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!clientId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/instagram/feed?clientId=${encodeURIComponent(clientId)}&limit=${limit}`,
          { cache: "no-store" },
        );
        const data = await res.json();
        if (!res.ok)
          throw new Error(data?.error || "Falha ao carregar feed do Instagram");
        setItems(data.items || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [clientId, limit]);

  if (!clientId) {
    return (
      <Card className="border-border shadow-sm transition-colors">
        <CardHeader className="bg-linear-to-r from-pink-50 via-purple-50 to-indigo-50 dark:from-pink-950/30 dark:via-purple-950/30 dark:to-indigo-950/30 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-linear-to-br from-pink-600 via-purple-600 to-indigo-600 flex items-center justify-center shadow-md">
              <Instagram className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-lg">Feed do Instagram</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="p-4 rounded-lg bg-linear-to-br from-pink-50/50 to-purple-50/50 dark:from-pink-950/20 dark:to-purple-950/20 border border-border/50">
            <Instagram className="h-8 w-8 text-pink-400 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground text-center">
              Use o botão &quot;Conectar Instagram&quot; na página do cliente
              para conectar a conta.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="bg-linear-to-r from-pink-50 via-purple-50 to-indigo-50 dark:from-pink-950/30 dark:via-purple-950/30 dark:to-indigo-950/30 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-linear-to-br from-pink-600 via-purple-600 to-indigo-600 flex items-center justify-center shadow-md">
              <Instagram className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Feed do Instagram</CardTitle>
              {items.length > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {items.length} posts recentes
                </p>
              )}
            </div>
          </div>
          {items.length > 0 && (
            <a
              href={`https://www.instagram.com`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-pink-600 hover:text-pink-700 flex items-center gap-1 font-medium"
            >
              Ver perfil <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {error && (
          <div className="p-5 rounded-xl bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-border/50">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                <Instagram className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-800 font-semibold mb-1">
                  Instagram não conectado
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {error.includes("não conectado") || error.includes("Token")
                    ? 'Use o botão "Conectar Instagram" no formulário de edição do cliente para autorizar o acesso.'
                    : error}
                </p>
              </div>
            </div>
          </div>
        )}
        {loading && !items.length && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 text-pink-500 animate-spin mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Carregando feed...
              </p>
            </div>
          </div>
        )}
        {!error && items.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {items.map((m) => {
              const img =
                m.media_type === "VIDEO"
                  ? m.thumbnail_url || m.media_url
                  : m.media_url;
              return (
                <a
                  key={m.id}
                  href={m.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative w-full aspect-square overflow-hidden rounded-lg bg-muted hover:opacity-80 hover:scale-105 transition-all group shadow-sm hover:shadow-md"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt="Instagram post"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                    <ExternalLink className="h-4 w-4 text-white" />
                  </div>
                </a>
              );
            })}
          </div>
        )}
        {!loading && !error && items.length === 0 && (
          <div className="p-8 text-center">
            <Instagram className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm text-muted-foreground">
              Nenhuma mídia encontrada no Instagram.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
