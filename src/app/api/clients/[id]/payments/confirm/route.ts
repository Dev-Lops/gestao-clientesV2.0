import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, orgId, role } = await getSessionProfile()

    if (!user || !orgId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Only OWNER and STAFF can confirm payments
    if (role === 'CLIENT') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { id: clientId } = await params

    // Get client with contract info
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

    // Validate contract info
    if (!client.contractValue || client.contractValue <= 0) {
      return NextResponse.json(
        { error: 'Cliente não possui valor de contrato definido' },
        { status: 400 }
      )
    }

    // Check if already confirmed this month
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const existingPayment = await prisma.finance.findFirst({
      where: {
        clientId,
        type: 'income',
        date: {
          gte: new Date(currentYear, currentMonth, 1),
          lt: new Date(currentYear, currentMonth + 1, 1),
        },
        description: {
          contains: 'Pagamento mensal',
        },
      },
    })

    if (existingPayment) {
      return NextResponse.json(
        { error: 'Pagamento deste mês já foi confirmado' },
        { status: 400 }
      )
    }

    // Create finance entry and update payment status in a transaction
    const [finance, updatedClient] = await prisma.$transaction([
      prisma.finance.create({
        data: {
          orgId,
          type: 'income',
          amount: client.contractValue,
          description: `Pagamento mensal - ${client.name}`,
          category: 'Pagamento Cliente',
          date: now,
          clientId,
        },
      }),
      prisma.client.update({
        where: { id: clientId },
        data: {
          paymentStatus: 'CONFIRMED',
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      finance,
      client: updatedClient,
    })
  } catch (error) {
    console.error('Erro ao confirmar pagamento:', error)
    return NextResponse.json(
      { error: 'Erro ao confirmar pagamento' },
      { status: 500 }
    )
  }
}
