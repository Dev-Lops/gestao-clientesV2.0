'use client'
import { formatDateInput } from '@/lib/utils'
import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { Task, TaskPriority, TaskStats, TaskStatus } from '../types'

interface UseTasksOptions {
  clientId: string
  initial?: Task[]
}

export function useTasks({ clientId, initial = [] }: UseTasksOptions) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all')

  const { data, isLoading, mutate, error } = useSWR<Task[]>(
    clientId ? `/api/clients/${clientId}/tasks` : null,
    async (url) => {
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) {
        let body: unknown = undefined
        try {
          body = await res.json()
        } catch {
          /* ignore */
        }
        const err: Error & { status?: number; body?: unknown } = new Error(
          `Falha ao carregar tarefas (${res.status})`
        )
        err.status = res.status
        err.body = body
        throw err
      }
      const raw: unknown = await res.json()
      if (!Array.isArray(raw)) return []
      return (raw as Array<Record<string, unknown>>).map((t) => ({
        id: String(t.id),
        title: String(t.title ?? ''),
        description: (t.description as string | undefined) ?? undefined,
        status: (t.status as TaskStatus) ?? 'todo',
        priority: (t.priority as TaskPriority) ?? 'medium',
        assignee: (t.assignee as string | undefined) ?? undefined,
        dueDate: t.dueDate ? formatDateInput(String(t.dueDate)) : undefined,
        createdAt: new Date(String(t.createdAt ?? new Date().toISOString())),
      }))
    },
    { fallbackData: initial }
  )
  const tasks = useMemo(() => data || [], [data])

  const stats: TaskStats = useMemo(
    () => ({
      total: tasks.length,
      todo: tasks.filter((t) => t.status === 'todo').length,
      doing: tasks.filter((t) => t.status === 'in-progress').length,
      done: tasks.filter((t) => t.status === 'done').length,
    }),
    [tasks]
  )

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false
      if (search && !t.title.toLowerCase().includes(search.toLowerCase()))
        return false
      return true
    })
  }, [tasks, statusFilter, search])

  return {
    tasks,
    filtered,
    stats,
    isLoading,
    mutate,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    error: error as (Error & { status?: number; body?: unknown }) | undefined,
  }
}
