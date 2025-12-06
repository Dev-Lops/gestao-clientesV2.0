'use client'

import { useCallback, useEffect, useState } from 'react'

interface UseFetchOptions<T = unknown> {
  cacheTime?: number // em ms, default 5 min
  skipOnMount?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

interface CacheEntry {
  data: unknown
  timestamp: number
}

// Cache global simples
const requestCache = new Map<string, CacheEntry>()

export function useFetchData<T = unknown>(
  url: string,
  options: UseFetchOptions<T> = {}
): {
  data: T | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
  isRefetching: boolean
} {
  const {
    cacheTime = 5 * 60 * 1000,
    skipOnMount = false,
    onSuccess,
    onError,
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(!skipOnMount)
  const [error, setError] = useState<Error | null>(null)
  const [isRefetching, setIsRefetching] = useState(false)

  const fetchData = useCallback(
    async (forceRefresh = false) => {
      // Verifica cache
      if (!forceRefresh && requestCache.has(url)) {
        const cached = requestCache.get(url)!
        if (Date.now() - cached.timestamp < cacheTime) {
          setData(cached.data as T)
          setLoading(false)
          onSuccess?.(cached.data as T)
          return
        }
      }

      try {
        setIsRefetching(true)
        // Adiciona timestamp para evitar cache do navegador
        const urlWithTs = url.includes('?')
          ? `${url}&ts=${Date.now()}`
          : `${url}?ts=${Date.now()}`

        const response = await globalThis.fetch(urlWithTs, {
          cache: 'no-store',
        })

        if (!response.ok) {
          throw new Error(`Erro ao carregar dados: ${response.statusText}`)
        }

        const result = await response.json()
        const fetchedData = (result.data || result) as T

        // Armazena no cache
        requestCache.set(url, {
          data: fetchedData,
          timestamp: Date.now(),
        })

        setData(fetchedData)
        setError(null)
        setLoading(false)
        onSuccess?.(fetchedData)
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Erro desconhecido')
        setError(error)
        setLoading(false)
        onError?.(error)
      } finally {
        setIsRefetching(false)
      }
    },
    [url, cacheTime, onSuccess, onError]
  )

  // Carrega dados na primeira renderização
  useEffect(() => {
    if (!skipOnMount) {
      fetchData()
    }
  }, [fetchData, skipOnMount])

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(true),
    isRefetching,
  }
}

// Função auxiliar para limpar cache
export function clearDataCache(pattern?: string) {
  if (!pattern) {
    requestCache.clear()
    return
  }

  const regex = new RegExp(pattern)
  for (const key of requestCache.keys()) {
    if (regex.test(key)) {
      requestCache.delete(key)
    }
  }
}

// Função auxiliar para pré-carregar dados
export function prefetchData(url: string) {
  if (!requestCache.has(url)) {
    fetch(url, { cache: 'no-store' }).then((r) => {
      if (r.ok) {
        return r.json().then((data) => {
          requestCache.set(url, {
            data: data.data || data,
            timestamp: Date.now(),
          })
        })
      }
    })
  }
}
