import { prisma } from '@/lib/prisma'
import { clientSchema } from '@/lib/validations'
import { getSessionProfile } from '@/services/auth/session'
import { ClientStatus } from '@/types/client'
import type { ClientPlan, SocialChannel } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, orgId, role } = await getSessionProfile()

    if (!user || !orgId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Only OWNER can update clients
    if (role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Sem permissão para editar clientes' },
        { status: 403 }
      )
    }

    const { id: clientId } = await params

    // Verify client belongs to org
    const existingClient = await prisma.client.findFirst({
      where: { id: clientId, orgId },
    })

    if (!existingClient) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }

    const body = await req.json()

    // Validate with Zod (partial schema for updates)
    const validated = clientSchema.partial().parse(body)

    // Update client
    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        name: validated.name,
        email: validated.email ?? null,
        phone: validated.phone ?? null,
        status: validated.status as ClientStatus | undefined,
        plan: validated.plan ? (validated.plan as ClientPlan) : null,
        mainChannel: validated.mainChannel
          ? (validated.mainChannel as SocialChannel)
          : null,
        contractStart: validated.contractStart ?? null,
        contractEnd: validated.contractEnd ?? null,
        paymentDay: validated.paymentDay ?? null,
        contractValue: validated.contractValue ?? null,
      },
    })

    return NextResponse.json(updatedClient)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Erro ao atualizar cliente:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar cliente' },
      { status: 500 }
    )
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, orgId } = await getSessionProfile()

    if (!user || !orgId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id: clientId } = await params

    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        orgId,
      },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('Erro ao buscar cliente:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar cliente' },
      { status: 500 }
    )
  }
}
