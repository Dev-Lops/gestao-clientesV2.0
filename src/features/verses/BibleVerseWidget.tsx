"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

interface Verse {
  id: number;
  text: string;
  book: { id: number; name: string };
  chapter: number;
  verse: number;
  translationId?: string;
  translationName?: string;
}

interface BibleVerseWidgetProps {
  compact?: boolean;
}

export function BibleVerseWidget({ compact = false }: BibleVerseWidgetProps) {
  const [verse, setVerse] = useState<Verse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentId, setCurrentId] = useState<number | null>(null);

  async function fetchRandomVerse() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/verses/random`, { cache: "no-store" });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Falha ao carregar versículo");
      }
      const data = await res.json();
      setVerse(data);
      setCurrentId(data.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  async function goNext() {
    if (!currentId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/verses/${currentId}/next`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Falha ao carregar próximo versículo");
      const data = await res.json();
      setCurrentId(data.id);
      setVerse(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  async function goPrev() {
    if (!currentId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/verses/${currentId}/previous`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Falha ao carregar versículo anterior");
      const data = await res.json();
      setCurrentId(data.id);
      setVerse(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchRandomVerse();
  }, []);

  const translationLabel =
    verse?.translationId?.toUpperCase() ||
    (verse?.translationName ? verse.translationName : "ALMEIDA");

  if (compact) {
    return (
      <div
        className="p-3 rounded-lg bg-card border border-border shadow-sm transition-colors"
        aria-label="Widget Versículo do Dia"
        role="region"
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-foreground" id="verse-widget-title">
            ✨ Versículo do dia
          </p>
          <div className="flex items-center gap-1">
            {verse && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 dark:bg-primary/25 text-primary font-semibold" aria-label={`Tradução: ${translationLabel}`}>{translationLabel}</span>
            )}
            <button
              onClick={fetchRandomVerse}
              disabled={loading}
              className="h-5 w-5 rounded hover:bg-accent/50 dark:hover:bg-accent/30 transition-colors flex items-center justify-center disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              title="Novo verso"
              aria-label="Carregar novo versículo aleatório"
            >
              <RefreshCw
                className={`h-3 w-3 text-primary ${loading ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
        {error && (
          <div className="text-[10px] text-destructive mb-2" role="alert">{error}</div>
        )}
        {loading && !verse && (
          <div className="text-xs text-muted-foreground" aria-live="polite">Carregando...</div>
        )}
        {verse && (
          <div className="text-xs text-muted-foreground space-y-2" aria-labelledby="verse-widget-title">
            <p className="line-clamp-3 leading-relaxed italic text-foreground" aria-label="Texto do versículo">&ldquo;{verse.text}&rdquo;</p>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-muted-foreground font-medium" aria-label={`Referência: ${verse.book.name} ${verse.chapter}:${verse.verse}`}>
                {verse.book.name} {verse.chapter}:{verse.verse}
              </span>
            </div>
          </div>
        )}
        {!verse && !loading && !error && (
          <div className="text-[10px] text-muted-foreground" role="alert">
            Não foi possível carregar o versículo agora.
          </div>
        )}
      </div>
    );
  }

  return (
    <Card aria-label="Widget Versículo do Dia" role="region">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base" id="verse-widget-title-full">
            Verso do Dia{verse ? ` (${translationLabel})` : ""}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchRandomVerse}
            disabled={loading}
            className="h-8 w-8 p-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            title="Novo verso aleatório"
            aria-label="Carregar novo versículo aleatório"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && <div className="text-sm text-red-600 mb-3" role="alert">{error}</div>}
        {loading && !verse && (
          <div className="text-sm text-muted-foreground" aria-live="polite">Carregando...</div>
        )}
        {verse && (
          <div className="space-y-3" aria-labelledby="verse-widget-title-full">
            <p className="text-sm text-foreground leading-relaxed" aria-label="Texto do versículo">&ldquo;{verse.text}&rdquo;</p>
            <p className="text-xs text-muted-foreground" aria-label={`Referência: ${verse.book.name} ${verse.chapter}:${verse.verse}`}>
              {verse.book.name} {verse.chapter}:{verse.verse}
            </p>
            <div className="flex items-center gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={goPrev}
                disabled={loading || !currentId}
                aria-label="Versículo anterior"
                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Anterior
              </Button>
              <Button
                size="sm"
                onClick={goNext}
                disabled={loading || !currentId}
                aria-label="Próximo versículo"
                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Próximo
              </Button>
            </div>
          </div>
        )}
        {!verse && !loading && !error && (
          <div className="text-sm text-muted-foreground" role="alert">
            Não foi possível carregar o versículo agora.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
