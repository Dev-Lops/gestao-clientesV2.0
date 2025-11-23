import { can } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { sanitizeObject } from '@/lib/sanitize'
import { createTaskSchema, updateTaskSchema } from '@/lib/validations'
import { getSessionProfile } from '@/services/auth/session'
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { user, orgId, role } = await getSessionProfile()
    if (!user || !orgId)
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    if (!role || !can(role, 'read', 'task'))
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

    const { id: clientId } = await params

    // Verifica se o cliente pertence à org
    const client = await prisma.client.findFirst({
      where: { id: clientId, orgId },
    })
    if (!client)
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )

    const tasks = await prisma.task.findMany({
      where: { clientId, orgId },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        assignee: true,
        dueDate: true,
        clientId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Erro ao buscar tarefas:', error)
    // If debug requested, expose details to caller for faster debugging (only when explicitly asked)
    const debugRequested =
      process.env.DEBUG === 'true' ||
      (typeof process !== 'undefined' &&
        _request.headers?.get?.('x-debug') === '1')

    if (debugRequested) {
      return NextResponse.json(
        { error: 'Erro ao buscar tarefas', details: String(error) },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao buscar tarefas' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, orgId, role } = await getSessionProfile()
    if (!user || !orgId)
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    if (!role || !can(role, 'create', 'task'))
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

    const { id: clientId } = await params
    const body = await request.json()

    // Validate with Zod
    const validated = createTaskSchema.parse(body)

    // Sanitize user-generated content
    const sanitized = await sanitizeObject(validated, {
      textFields: ['title', 'description', 'assignee'],
    })

    const client = await prisma.client.findFirst({
      where: { id: clientId, orgId },
    })
    if (!client)
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )

    // Normalize dueDate to a valid Date or null
    const normalizedDueDate =
      sanitized.dueDate instanceof Date && !isNaN(sanitized.dueDate.getTime())
        ? sanitized.dueDate
        : null

    const task = await prisma.task.create({
      data: {
        clientId,
        orgId,
        title: sanitized.title,
        description: sanitized.description ?? null,
        status: sanitized.status ?? 'todo',
        priority: sanitized.priority ?? 'medium',
        assignee: sanitized.assignee ?? null,
        dueDate: normalizedDueDate,
      },
    })

    return NextResponse.json(task)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Erro ao criar tarefa:', error)
    return NextResponse.json({ error: 'Erro ao criar tarefa' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user, orgId, role } = await getSessionProfile()
    if (!user || !orgId)
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    if (!role || !can(role, 'update', 'task'))
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

    const url = new URL(request.url)
    const taskId = url.searchParams.get('taskId')
    if (!taskId)
      return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 })

    const body = await request.json()

    // Validate with Zod (partial for updates)
    const validated = updateTaskSchema.parse(body)

    // Sanitize user-generated content
    const sanitized = await sanitizeObject(validated, {
      textFields: ['title', 'description', 'assignee'],
    })

    const task = await prisma.task.findUnique({ where: { id: taskId } })
    if (!task || task.orgId !== orgId)
      return NextResponse.json(
        { error: 'Tarefa não encontrada' },
        { status: 404 }
      )

    const normalizedUpdateDueDate =
      sanitized.dueDate instanceof Date && !isNaN(sanitized.dueDate.getTime())
        ? sanitized.dueDate
        : sanitized.dueDate === null
          ? null
          : undefined

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: sanitized.title,
        description: sanitized.description,
        status: sanitized.status,
        priority: sanitized.priority,
        assignee: sanitized.assignee,
        // Only update dueDate if provided; set to null if explicitly null
        ...(normalizedUpdateDueDate !== undefined && {
          dueDate: normalizedUpdateDueDate,
        }),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Erro ao atualizar tarefa:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar tarefa' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, orgId, role } = await getSessionProfile()
    if (!user || !orgId)
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    if (!role || !can(role, 'delete', 'task'))
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

    const url = new URL(request.url)
    const taskId = url.searchParams.get('taskId')
    if (!taskId)
      return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 })

    const task = await prisma.task.findUnique({ where: { id: taskId } })
    if (!task || task.orgId !== orgId)
      return NextResponse.json(
        { error: 'Tarefa não encontrada' },
        { status: 404 }
      )

    await prisma.task.delete({ where: { id: taskId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar tarefa:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar tarefa' },
      { status: 500 }
    )
  }
}
