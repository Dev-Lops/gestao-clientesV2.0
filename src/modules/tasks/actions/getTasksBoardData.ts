import { prisma } from '@/lib/prisma'
import { cache } from 'react'
import { TaskBoardDataSchema, type TaskBoardData } from '../domain/schema'

export const getTasksBoardData = cache(async (): Promise<TaskBoardData> => {
  // Basic auth acquisition could be integrated via getSessionProfile; simplified here
  const tasks = await prisma.task.findMany({
    orderBy: { createdAt: 'desc' },
    take: 300,
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      clientId: true,
      dueDate: true,
      description: true,
      client: { select: { name: true } },
    },
  })

  const mapped = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    status: (['todo', 'in-progress', 'done'].includes(t.status)
      ? t.status
      : 'todo') as 'todo' | 'in-progress' | 'done',
    priority: (['low', 'medium', 'high'].includes(t.priority)
      ? t.priority
      : 'medium') as 'low' | 'medium' | 'high',
    clientName: t.client?.name || 'Sem cliente',
    clientId: t.clientId,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    description: t.description ?? null,
  }))

  return TaskBoardDataSchema.parse({ tasks: mapped })
})
