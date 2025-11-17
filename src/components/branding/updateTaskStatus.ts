'use server'
import { prisma } from '@/lib/prisma'

import {
  TaskBoardItemSchema,
  TaskStatusEnum,
} from '@/modules/tasks/domain/schema'
import { revalidatePath } from 'next/cache'

export async function updateTaskStatus(taskId: string, status: string) {
  // Validate incoming status
  const parsed = TaskStatusEnum.safeParse(status)
  if (!parsed.success) {
    throw new Error('Status inválido')
  }
  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { status: parsed.data },
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
  revalidatePath('/tasks')
  return TaskBoardItemSchema.parse({
    id: updated.id,
    title: updated.title,
    status: updated.status,
    priority: (['low', 'medium', 'high'].includes(updated.priority)
      ? updated.priority
      : 'medium') as 'low' | 'medium' | 'high',
    clientName: updated.client?.name || 'Sem cliente',
    clientId: updated.clientId,
    dueDate: updated.dueDate ? updated.dueDate.toISOString() : null,
    description: updated.description ?? null,
  })
}
