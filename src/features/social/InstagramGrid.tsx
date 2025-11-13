"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useEffect, useState } from 'react'

type IgMedia = {
  id: string
  media_url: string
  permalink: string
  thumbnail_url?: string
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
}

interface InstagramGridProps {
  clientId: string
  limit?: number
}

export function InstagramGrid({ clientId, limit = 12 }: InstagramGridProps) {
  const [items, setItems] = useState<IgMedia[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      if (!clientId) return
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/instagram/feed?clientId=${encodeURIComponent(clientId)}&limit=${limit}`, { cache: 'no-store' })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'Falha ao carregar feed do Instagram')
        setItems(data.items || [])
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [clientId, limit])

  if (!clientId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Instagram</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-slate-600 dark:text-slate-400">
            Use o botão &quot;Conectar Instagram&quot; na página do cliente para conectar a conta.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feed do Instagram</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-2">
              Instagram não conectado
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-300">
              {error.includes('não conectado') || error.includes('Token')
                ? 'Use o botão &quot;Conectar Instagram&quot; no formulário de edição do cliente para autorizar o acesso.'
                : error
              }
            </p>
          </div>
        )}
        {loading && !items.length && (
          <div className="text-sm text-slate-500">Carregando feed...</div>
        )}
        {!error && items.length > 0 && (
          <div className="grid grid-cols-3 gap-1 sm:gap-2">
            {items.map((m) => {
              const img = m.media_type === 'VIDEO' ? (m.thumbnail_url || m.media_url) : m.media_url
              return (
                <a
                  key={m.id}
                  href={m.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative w-full aspect-square overflow-hidden rounded-md bg-slate-100 hover:opacity-90 transition-opacity"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="Instagram post" className="h-full w-full object-cover" />
                </a>
              )
            })}
          </div>
        )}
        {!loading && !error && items.length === 0 && (
          <p className="text-sm text-slate-500 mt-2">Nenhuma mídia encontrada no Instagram.</p>
        )}
      </CardContent>
    </Card>
  )
}
