import {
  TaskPriority,
  TaskStatus,
} from '@/domain/task/value-objects/task-type.vo'
import { TaskController } from '@/infrastructure/http/controllers/task.controller'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const controller = new TaskController(prisma)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const result = await controller.create({
      title: body.title,
      orgId: body.orgId,
      priority: body.priority,
      description: body.description,
      clientId: body.clientId,
      assignee: body.assignee,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      createdBy: body.createdBy,
      autoAssign: body.autoAssign !== false, // Padrão: true (ativa atribuição automática)
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validação falhou', details: error.issues },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const orgId = searchParams.get('orgId')
    const page = searchParams.get('page')
    const limit = searchParams.get('limit')
    const statusParams = searchParams.getAll('status')
    const priorityParams = searchParams.getAll('priority')
    const assignee = searchParams.get('assignee')
    const clientId = searchParams.get('clientId')

    if (!orgId) {
      return NextResponse.json(
        { error: 'orgId é obrigatório' },
        { status: 400 }
      )
    }

    const result = await controller.list({
      orgId,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
      status: statusParams.length
        ? statusParams
            .map((value) =>
              Object.values(TaskStatus).includes(value as TaskStatus)
                ? (value as TaskStatus)
                : undefined
            )
            .filter((value): value is TaskStatus => Boolean(value))
        : undefined,
      priority: priorityParams.length
        ? priorityParams
            .map((value) =>
              Object.values(TaskPriority).includes(value as TaskPriority)
                ? (value as TaskPriority)
                : undefined
            )
            .filter((value): value is TaskPriority => Boolean(value))
        : undefined,
      assignee: assignee || undefined,
      clientId: clientId || undefined,
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
