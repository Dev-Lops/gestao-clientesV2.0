import { prisma } from '@/lib/prisma'
import { createClientSchema } from '@/lib/validations'
import { getSessionProfile } from '@/services/auth/session'
import { createClient } from '@/services/repositories/clients'
import { ClientStatus } from '@/types/client'
import type { ClientPlan, SocialChannel } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'

export async function POST(req: NextRequest) {
  try {
    const { user, orgId, role } = await getSessionProfile()

    if (!user || !orgId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Only OWNER can create clients
    if (role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Sem permissão para criar clientes' },
        { status: 403 }
      )
    }

    const body = await req.json()

    // Validate request body with Zod
    const validated = createClientSchema.parse(body)

    const client = await createClient({
      name: validated.name,
      email: validated.email,
      phone: validated.phone,
      status: validated.status as ClientStatus,
      plan: validated.plan ? (validated.plan as ClientPlan) : undefined,
      mainChannel: validated.mainChannel
        ? (validated.mainChannel as SocialChannel)
        : undefined,
      orgId,
      contractStart: validated.contractStart,
      contractEnd: validated.contractEnd,
      paymentDay: validated.paymentDay,
      contractValue: validated.contractValue,
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Erro ao criar cliente:', error)
    return NextResponse.json(
      { error: 'Erro ao criar cliente' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const { user, orgId, role } = await getSessionProfile()
    if (!user || !orgId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // CLIENT só vê seu próprio registro (derivado de clientUserId)
    if (role === 'CLIENT') {
      // Busca o Client vinculado
      const client = await prisma.client.findFirst({
        where: { orgId, clientUserId: user.id },
      })
      if (!client) return NextResponse.json({ data: [] })
      return NextResponse.json({
        data: [
          {
            id: client.id,
            name: client.name,
            email: client.email,
          },
        ],
      })
    }

    // OWNER / STAFF: retorno reduzido quando ?lite=1, completo caso contrário
    const lite = req.nextUrl.searchParams.get('lite') === '1'
    const clients = await prisma.client.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
    if (lite) {
      return NextResponse.json({
        data: clients.map((c) => ({ id: c.id, name: c.name })),
      })
    }
    return NextResponse.json({ data: clients })
  } catch (e) {
    console.error('Erro ao listar clientes', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
