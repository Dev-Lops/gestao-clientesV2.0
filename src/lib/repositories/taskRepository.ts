import { prisma } from '@/lib/prisma'
import { getApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const DUAL_WRITE = process.env.DUAL_WRITE?.toLowerCase() === 'true'

export type TaskCreateInput = {
  orgId: string
  clientId: string
  title: string
  description?: string | null
  status?: string
  assignee?: string | null
  dueDate?: Date | null
  priority?: string
}

export async function createTask(input: TaskCreateInput) {
  const task = await prisma.task.create({
    data: {
      orgId: input.orgId,
      clientId: input.clientId,
      title: input.title,
      description: input.description ?? undefined,
      status: input.status ?? undefined,
      assignee: input.assignee ?? undefined,
      dueDate: input.dueDate ?? undefined,
      priority: input.priority ?? undefined,
    },
  })

  if (DUAL_WRITE) {
    try {
      const firestore = getFirestore(getApp())
      await firestore
        .collection('orgs')
        .doc(input.orgId)
        .collection('clients')
        .doc(input.clientId)
        .collection('tasks')
        .doc(task.id)
        .set({
          id: task.id,
          title: task.title,
          description: task.description ?? null,
          status: task.status,
          assignee: task.assignee ?? null,
          dueDate: task.dueDate ? task.dueDate.toISOString() : null,
          priority: task.priority,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
        })
    } catch (err) {
      // Enfileira para retry via WebhookEvent
      try {
        await prisma.webhookEvent.create({
          data: {
            provider: 'dual-write',
            eventType: 'firestore',
            payload: {
              entity: 'task',
              op: 'create',
              attempts: 0,
              orgId: input.orgId,
              clientId: input.clientId,
              data: {
                id: task.id,
                title: task.title,
                description: task.description ?? null,
                status: task.status,
                assignee: task.assignee ?? null,
                dueDate: task.dueDate ? task.dueDate.toISOString() : null,
                priority: task.priority,
                createdAt: task.createdAt.toISOString(),
                updatedAt: task.updatedAt.toISOString(),
              },
            },
          },
        })
      } catch (e) {
        console.error('[dual-write:task:create] falhou enfileirar Outbox', e)
      }
      console.error('[dual-write:task:create] falhou no Firestore', err)
    }
  }

  return task
}
