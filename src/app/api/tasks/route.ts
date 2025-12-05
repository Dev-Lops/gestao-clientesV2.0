import { authenticateRequest } from '@/infrastructure/http/middlewares/auth.middleware'
import { ApiResponseHandler } from '@/infrastructure/http/response'
import { prisma } from '@/lib/prisma'
import * as Sentry from '@sentry/nextjs'
import { NextRequest } from 'next/server'
import { z } from 'zod'

// ============================================================================
// SCHEMAS
// ============================================================================

const CreateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z
    .enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED'])
    .default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().datetime().optional(),
  assignee: z.string().optional(),
  clientId: z.string().min(1, 'Client ID is required'),
})

const UpdateTaskSchema = CreateTaskSchema.partial()

const TaskListQuerySchema = z.object({
  status: z.string().optional(),
  priority: z.string().optional(),
  clientId: z.string().optional(),
  assignee: z.string().optional(),
  limit: z.coerce.number().min(1).max(200).default(50),
  cursor: z.string().optional(),
})

// ============================================================================
// GET - List tasks
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req, {
      rateLimit: true,
      requireOrg: true,
    })

    if ('error' in authResult) {
      return authResult.error
    }

    const { orgId } = authResult.context
    const { searchParams } = new URL(req.url)

    const parsed = TaskListQuerySchema.safeParse({
      status: searchParams.get('status') ?? undefined,
      priority: searchParams.get('priority') ?? undefined,
      clientId: searchParams.get('clientId') ?? undefined,
      assignee: searchParams.get('assignee') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      cursor: searchParams.get('cursor') ?? undefined,
    })

    if (!parsed.success) {
      return ApiResponseHandler.badRequest(
        'Parâmetros inválidos',
        parsed.error.format()
      )
    }

    const { status, priority, clientId, assignee, limit, cursor } = parsed.data
    const take = limit

    // Build where clause
    const where: any = {
      orgId,
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(clientId ? { clientId } : {}),
      ...(assignee ? { assignee } : {}),
    }

    const tasks = await prisma.task.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        assignee: true,
        clientId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: take + 1,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
    })

    const hasNextPage = tasks.length > take
    const data = tasks.slice(0, take)
    const nextCursor = hasNextPage ? (data[data.length - 1]?.id ?? null) : null

    return ApiResponseHandler.success(
      {
        tasks: data,
        meta: {
          limit: take,
          nextCursor,
          hasNextPage,
        },
      },
      'Tarefas listadas'
    )
  } catch (error) {
    Sentry.captureException(error)
    console.error('Erro ao listar tarefas:', error)
    return ApiResponseHandler.error(error, 'Erro ao listar tarefas')
  }
}

// ============================================================================
// POST - Create task
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req, {
      rateLimit: true,
      requireOrg: true,
    })

    if ('error' in authResult) {
      return authResult.error
    }

    const { orgId } = authResult.context
    const body = await req.json()

    const validationResult = CreateTaskSchema.safeParse(body)
    if (!validationResult.success) {
      return ApiResponseHandler.badRequest(
        'Dados inválidos',
        validationResult.error.issues
      )
    }

    const validated = validationResult.data

    // If assignee is specified, verify it's a valid user in the org
    if (validated.assignee) {
      const assignedUser = await prisma.user.findFirst({
        where: {
          id: validated.assignee,
          memberships: {
            some: { orgId },
          },
        },
        select: { id: true },
      })

      if (!assignedUser) {
        return ApiResponseHandler.badRequest(
          'Usuário não encontrado na organização',
          [{ field: 'assignee', message: 'Usuário não encontrado' }]
        )
      }
    }

    const task = await prisma.task.create({
      data: {
        title: validated.title,
        ...(validated.description && { description: validated.description }),
        status: validated.status || 'TODO',
        priority: validated.priority,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
        ...(validated.assignee && { assignee: validated.assignee }),
        clientId: validated.clientId,
        orgId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        assignee: true,
        clientId: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return ApiResponseHandler.created(task, 'Tarefa criada com sucesso')
  } catch (error) {
    Sentry.captureException(error)
    console.error('Erro ao criar tarefa:', error)
    return ApiResponseHandler.error(error, 'Erro ao criar tarefa')
  }
}

// ============================================================================
// PATCH - Update task
// ============================================================================

export async function PATCH(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req, {
      rateLimit: true,
      requireOrg: true,
    })

    if ('error' in authResult) {
      return authResult.error
    }

    const { orgId } = authResult.context

    // Get task ID from URL
    const taskId = req.nextUrl.searchParams.get('id')
    if (!taskId) {
      return ApiResponseHandler.badRequest('Parâmetro obrigatório ausente', [
        { field: 'id', message: 'ID é obrigatório' },
      ])
    }

    // Verify task exists and belongs to org
    const existingTask = await prisma.task.findFirst({
      where: { id: taskId, orgId },
      select: { id: true },
    })

    if (!existingTask) {
      return ApiResponseHandler.internalError(
        new Error('Tarefa não encontrada'),
        'tasks:update'
      )
    }

    const body = await req.json()
    const validationResult = UpdateTaskSchema.safeParse(body)

    if (!validationResult.success) {
      return ApiResponseHandler.badRequest(
        'Dados inválidos',
        validationResult.error.issues
      )
    }

    const validated = validationResult.data

    // Verify assignee if provided
    if (validated.assignee) {
      const assignedUser = await prisma.user.findFirst({
        where: {
          id: validated.assignee,
          memberships: {
            some: { orgId },
          },
        },
        select: { id: true },
      })

      if (!assignedUser) {
        return ApiResponseHandler.badRequest('Usuário não encontrado', [
          { field: 'assignee', message: 'Usuário não encontrado' },
        ])
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(validated.title !== undefined && { title: validated.title }),
        ...(validated.description !== undefined && {
          description: validated.description,
        }),
        ...(validated.status !== undefined && { status: validated.status }),
        ...(validated.priority !== undefined && {
          priority: validated.priority,
        }),
        ...(validated.dueDate !== undefined && {
          dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
        }),
        ...(validated.assignee !== undefined && {
          assignee: validated.assignee,
        }),
        ...(validated.clientId !== undefined && {
          clientId: validated.clientId,
        }),
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        assignee: true,
        clientId: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return ApiResponseHandler.success(
      updatedTask,
      'Tarefa atualizada com sucesso'
    )
  } catch (error) {
    Sentry.captureException(error)
    console.error('Erro ao atualizar tarefa:', error)
    return ApiResponseHandler.error(error, 'Erro ao atualizar tarefa')
  }
}

// ============================================================================
// DELETE - Delete task
// ============================================================================

export async function DELETE(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req, {
      rateLimit: true,
      requireOrg: true,
    })

    if ('error' in authResult) {
      return authResult.error
    }

    const { orgId } = authResult.context

    // Get task ID from URL
    const taskId = req.nextUrl.searchParams.get('id')
    if (!taskId) {
      return ApiResponseHandler.badRequest('Parâmetro obrigatório ausente', [
        { field: 'id', message: 'ID é obrigatório' },
      ])
    }

    // Verify task exists and belongs to org
    const existingTask = await prisma.task.findFirst({
      where: { id: taskId, orgId },
      select: { id: true },
    })

    if (!existingTask) {
      return ApiResponseHandler.internalError(
        new Error('Tarefa não encontrada'),
        'tasks:delete'
      )
    }

    await prisma.task.delete({
      where: { id: taskId },
    })

    return ApiResponseHandler.success(null, 'Tarefa deletada com sucesso')
  } catch (error) {
    Sentry.captureException(error)
    console.error('Erro ao deletar tarefa:', error)
    return ApiResponseHandler.error(error, 'Erro ao deletar tarefa')
  }
}
