import { logger } from '@/lib/logger'
import { useCallback, useRef, useState } from 'react'
import useSWR from 'swr'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  time: string
  unread: boolean
  link: string
  priority?: string
  clientId: string
  createdAt: Date
}

interface NotificationsResponse {
  notifications: Notification[]
  total: number
  unreadCount: number
  hasMore: boolean
}

/**
 * Fetcher com suporte a AbortController
 */
const fetcher = async (url: string, signal?: AbortSignal) => {
  const res = await fetch(url, {
    credentials: 'include',
    signal,
  })
  if (!res.ok) throw new Error('Failed to fetch notifications')
  return res.json()
}

export interface UseNotificationsOptions {
  unreadOnly?: boolean
  limit?: number
  type?: string
  refreshInterval?: number
}

export function useNotifications(options?: UseNotificationsOptions) {
  const {
    unreadOnly = false,
    limit = 50,
    type,
    refreshInterval = 30000, // 30 segundos
  } = options || {}

  const abortControllerRef = useRef<AbortController | null>(null)

  const params = new URLSearchParams()
  if (unreadOnly) params.set('unread', 'true')
  params.set('limit', limit.toString())
  if (type) params.set('type', type)

  const { data, error, isLoading, mutate } = useSWR<NotificationsResponse>(
    `/api/notifications?${params.toString()}`,
    (url) => {
      // Cancela request anterior se existir
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Cria novo controller
      abortControllerRef.current = new AbortController()

      return fetcher(url, abortControllerRef.current.signal)
    },
    {
      refreshInterval,
      revalidateOnFocus: true,
      onError: (err) => {
        // Ignora erros de abort (esperado quando componente desmonta)
        if (err.name === 'AbortError') return
        logger.error('Error fetching notifications', err)
      },
    }
  )

  const [actionLoading, setActionLoading] = useState(false)

  const performAction = useCallback(
    async (action: string, payload: Record<string, unknown>) => {
      setActionLoading(true)
      try {
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ action, ...payload }),
        })
        await mutate()
      } catch (err) {
        logger.error(`Error performing action ${action})`, err)
        throw err
      } finally {
        setActionLoading(false)
      }
    },
    [mutate]
  )

  const markAsRead = useCallback(
    async (id: string) => {
      await performAction('mark_read', { id })
    },
    [performAction]
  )

  const markMultipleAsRead = useCallback(
    async (ids: string[]) => {
      await performAction('mark_multiple_read', { ids })
    },
    [performAction]
  )

  const markAllAsRead = useCallback(async () => {
    await performAction('mark_all_read', {})
  }, [performAction])

  const deleteNotification = useCallback(
    async (id: string) => {
      await performAction('delete', { id })
    },
    [performAction]
  )

  return {
    notifications: data?.notifications || [],
    total: data?.total || 0,
    unreadCount: data?.unreadCount || 0,
    hasMore: data?.hasMore || false,
    isLoading,
    error,
    actionLoading,
    markAsRead,
    markMultipleAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: mutate,
  }
}
