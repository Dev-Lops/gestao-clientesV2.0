import { can } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { sanitizeObject } from '@/lib/sanitize'
import { createStrategySchema, updateStrategySchema } from '@/lib/validations'
import { getSessionProfile } from '@/services/auth/session'
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, orgId, role } = await getSessionProfile()
    if (!user || !orgId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    if (!role || !can(role, 'read', 'strategy')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { id: clientId } = await params

    const client = await prisma.client.findFirst({
      where: { id: clientId, orgId: orgId },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }

    const strategies = await prisma.strategy.findMany({
      where: { clientId: clientId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(strategies)
  } catch (error) {
    console.error('Erro ao buscar estratégias:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar estratégias' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, orgId, role } = await getSessionProfile()
    if (!user || !orgId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    if (!role || !can(role, 'create', 'strategy')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { id: clientId } = await params
    const body = await request.json()

    const client = await prisma.client.findFirst({
      where: { id: clientId, orgId: orgId },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }

    // validação + sanitização
    const validated = createStrategySchema.parse({ ...body, clientId })

    const sanitized = await sanitizeObject(validated, {
      textFields: ['title', 'description', 'type', 'content'],
    })

    const strategy = await prisma.strategy.create({
      data: {
        clientId,
        title: sanitized.title,
        description: sanitized.description ?? null,
        type: sanitized.type,
        content: sanitized.content,
      },
    })

    return NextResponse.json(strategy)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Erro ao criar estratégia:', error)
    return NextResponse.json(
      { error: 'Erro ao criar estratégia' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user, orgId, role } = await getSessionProfile()
    if (!user || !orgId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    if (!role || !can(role, 'update', 'strategy')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const url = new URL(request.url)
    const id = url.searchParams.get('id') || url.searchParams.get('strategyId')
    if (!id) {
      return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 })
    }

    const body = await request.json()
    const validated = updateStrategySchema.parse(body)
    const sanitized = await sanitizeObject(validated, {
      textFields: ['title', 'description', 'type', 'content'],
    })

    const strategy = await prisma.strategy.findUnique({
      where: { id },
      include: { client: true },
    })
    if (!strategy || strategy.client.orgId !== orgId) {
      return NextResponse.json(
        { error: 'Estratégia não encontrada' },
        { status: 404 }
      )
    }

    // Build update object only with provided fields
    const data: Record<string, unknown> = {}
    if (Object.prototype.hasOwnProperty.call(sanitized, 'title'))
      data.title = sanitized.title
    if (Object.prototype.hasOwnProperty.call(sanitized, 'description'))
      data.description = sanitized.description ?? null
    if (Object.prototype.hasOwnProperty.call(sanitized, 'type'))
      data.type = sanitized.type
    if (Object.prototype.hasOwnProperty.call(sanitized, 'content'))
      data.content = sanitized.content

    const updated = await prisma.strategy.update({
      where: { id },
      data,
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Erro ao atualizar estratégia:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar estratégia' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, orgId, role } = await getSessionProfile()
    if (!user || !orgId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    if (!role || !can(role, 'delete', 'strategy')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const url = new URL(request.url)
    const strategyId =
      url.searchParams.get('id') || url.searchParams.get('strategyId')

    if (!strategyId) {
      return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 })
    }

    const strategy = await prisma.strategy.findUnique({
      where: { id: strategyId },
      include: { client: true },
    })

    if (!strategy || strategy.client.orgId !== orgId) {
      return NextResponse.json(
        { error: 'Estratégia não encontrada' },
        { status: 404 }
      )
    }

    await prisma.strategy.delete({
      where: { id: strategyId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar estratégia:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar estratégia' },
      { status: 500 }
    )
  }
}
