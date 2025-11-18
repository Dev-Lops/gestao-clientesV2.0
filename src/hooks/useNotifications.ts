import { logger } from '@/lib/logger'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useRef, useState } from 'react'

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

export interface NotificationItem {
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

export function useNotifications(options?: UseNotificationsOptions): {
  notifications: NotificationItem[]
  total: number
  unreadCount: number
  hasMore: boolean
  isLoading: boolean
  error: unknown
  actionLoading: boolean
  markAsRead: (id: string) => Promise<void>
  markMultipleAsRead: (ids: string[]) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  refresh: () => Promise<unknown>
} {
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

  const queryClient = useQueryClient()
  const queryKey = ['notifications', { unreadOnly, limit, type }]
  const { data, error, isLoading, refetch } = useQuery<NotificationsResponse>({
    queryKey,
    queryFn: ({ signal }) => {
      // cancela anterior manualmente se quiser manter ref
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()
      // Prioriza o signal do react-query para cancelamento no refetch; usa interno para abort manual
      const controllerSignal = abortControllerRef.current.signal
      // combinar signals: se qualquer abort ocorrer, fetch falha
      const fetchSignal = controllerSignal
      return fetcher(`/api/notifications?${params.toString()}`, fetchSignal)
    },
    refetchInterval: refreshInterval,
    refetchOnWindowFocus: true,
    staleTime: 15_000,
  })

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
        await refetch()
      } catch (err) {
        logger.error(`Error performing action ${action})`, err)
        throw err
      } finally {
        setActionLoading(false)
      }
    },
    [refetch]
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
    refresh: refetch,
  }
}
