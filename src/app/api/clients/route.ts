import { prisma } from '@/lib/prisma'
import { createClientSchema } from '@/lib/validations'
import { getSessionProfile } from '@/services/auth/session'
import { createClient } from '@/services/repositories/clients'
import { ClientStatus } from '@/types/enums'
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
      isInstallment: validated.isInstallment,
      installmentCount: validated.installmentCount,
      installmentValue: validated.installmentValue,
      installmentPaymentDays: validated.installmentPaymentDays,
    })

    // Se é pagamento parcelado, criar automaticamente as parcelas
    if (
      validated.isInstallment &&
      validated.installmentCount &&
      validated.contractValue &&
      validated.contractStart
    ) {
      const installmentAmount =
        validated.installmentValue ||
        validated.contractValue / validated.installmentCount
      const startDate = new Date(validated.contractStart)
      const installmentPaymentDays = validated.installmentPaymentDays || []

      // Se não há dias específicos, usar o paymentDay padrão ou dia do contrato
      const daysToUse =
        installmentPaymentDays.length > 0
          ? installmentPaymentDays
          : [validated.paymentDay || startDate.getDate()]

      const installmentsToCreate = []
      let installmentNumber = 1
      const currentDate = new Date(startDate)

      while (installmentNumber <= validated.installmentCount) {
        for (const day of daysToUse) {
          if (installmentNumber > validated.installmentCount) break

          // Ajustar para o dia específico do mês
          const dueDate = new Date(currentDate)
          dueDate.setDate(
            Math.min(
              day,
              new Date(
                dueDate.getFullYear(),
                dueDate.getMonth() + 1,
                0
              ).getDate()
            )
          )

          installmentsToCreate.push({
            clientId: client.id,
            number: installmentNumber,
            amount: installmentAmount,
            dueDate: dueDate,
            status: 'PENDING' as const,
          })

          installmentNumber++
        }

        // Avançar para o próximo mês
        currentDate.setMonth(currentDate.getMonth() + 1)
      }

      // Criar todas as parcelas no banco de dados
      if (installmentsToCreate.length > 0) {
        await prisma.installment.createMany({
          data: installmentsToCreate,
        })
      }
    }

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

    // OWNER / STAFF: retorno otimizado com select
    const lite = req.nextUrl.searchParams.get('lite') === '1'

    if (lite) {
      const clients = await prisma.client.findMany({
        where: { orgId },
        select: {
          id: true,
          name: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      })
      return NextResponse.json({ data: clients })
    }

    // Select apenas campos necessários para listagem completa
    const clients = await prisma.client.findMany({
      where: { orgId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        plan: true,
        mainChannel: true,
        paymentStatus: true,
        contractStart: true,
        contractEnd: true,
        contractValue: true,
        paymentDay: true,
        isInstallment: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
    return NextResponse.json({ data: clients })
  } catch (e) {
    console.error('Erro ao listar clientes', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
