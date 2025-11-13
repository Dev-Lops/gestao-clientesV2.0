import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'
import { NextResponse } from 'next/server'

/**
 * API Manual para processar pagamentos mensais
 * Apenas para OWNER testar o processamento sem esperar o cron
 */
export async function POST() {
  try {
    const profile = await getSessionProfile()
    if (!profile || profile.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Apenas OWNER pode executar' },
        { status: 403 }
      )
    }

    if (!profile.orgId) {
      return NextResponse.json(
        { error: 'Organização não encontrada' },
        { status: 400 }
      )
    }

    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()

    // Buscar clientes da organização do usuário
    const clients = await prisma.client.findMany({
      where: {
        orgId: profile.orgId,
        status: { in: ['active', 'onboarding'] },
        OR: [
          { isInstallment: false, contractValue: { not: null } },
          {
            isInstallment: true,
            installments: {
              some: {
                dueDate: {
                  gte: new Date(currentYear, currentMonth, 1),
                  lt: new Date(currentYear, currentMonth + 1, 1),
                },
              },
            },
          },
        ],
      },
      include: {
        installments: {
          where: {
            dueDate: {
              gte: new Date(currentYear, currentMonth, 1),
              lt: new Date(currentYear, currentMonth + 1, 1),
            },
          },
        },
      },
    })

    type InstallmentInfo = {
      id: string
      number: number
      total: number | null
      status: string
    }

    type DetailType = {
      client: string
      amount?: number
      type?: 'installment' | 'monthly'
      installment?: InstallmentInfo
      action?: string
      error?: string
    }

    const results = {
      processed: 0,
      created: 0,
      updated: 0,
      errors: 0,
      details: [] as DetailType[],
    }

    for (const client of clients) {
      try {
        let amountToPay = 0
        let description = ''
        let installmentInfo: InstallmentInfo | null = null

        if (client.isInstallment && client.installments.length > 0) {
          // Cliente com pagamento parcelado
          const installment = client.installments[0]
          amountToPay = installment.amount
          description = `Parcela ${installment.number}/${client.installmentCount} - ${client.name}`
          installmentInfo = {
            id: installment.id,
            number: installment.number,
            total: client.installmentCount,
            status: installment.status,
          }

          // Atualizar status da parcela se ainda está pendente e passou da data
          if (installment.status === 'PENDING') {
            const dueDate = new Date(installment.dueDate)
            if (today > dueDate) {
              await prisma.installment.update({
                where: { id: installment.id },
                data: { status: 'LATE' },
              })
              results.updated++
              installmentInfo.status = 'LATE'
            }
          }
        } else if (client.contractValue) {
          // Cliente com pagamento mensal normal
          amountToPay = client.contractValue
          description = `Pagamento mensal - ${client.name}`
        } else {
          continue
        }

        // Verificar se já existe entrada financeira para este mês
        const existingEntry = await prisma.finance.findFirst({
          where: {
            clientId: client.id,
            type: 'income',
            date: {
              gte: new Date(currentYear, currentMonth, 1),
              lt: new Date(currentYear, currentMonth + 1, 1),
            },
            OR: [
              { description: { contains: 'Parcela' } },
              { description: { contains: 'Pagamento mensal' } },
            ],
          },
        })

        if (!existingEntry) {
          await prisma.finance.create({
            data: {
              orgId: profile.orgId,
              clientId: client.id,
              type: 'income',
              amount: amountToPay,
              description,
              category: 'Mensalidade',
              date: new Date(currentYear, currentMonth, client.paymentDay || 1),
            },
          })

          results.created++
          results.details.push({
            client: client.name,
            amount: amountToPay,
            type: client.isInstallment ? 'installment' : 'monthly',
            installment: installmentInfo || undefined,
            action: 'created',
          })
        } else {
          results.details.push({
            client: client.name,
            amount: amountToPay,
            type: client.isInstallment ? 'installment' : 'monthly',
            installment: installmentInfo || undefined,
            action: 'already_exists',
          })
        }

        results.processed++
      } catch (error) {
        results.errors++
        console.error(`Erro ao processar cliente ${client.name}:`, error)
        results.details.push({
          client: client.name,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Pagamentos mensais processados',
      results,
      month: `${currentMonth + 1}/${currentYear}`,
      timestamp: today.toISOString(),
    })
  } catch (error) {
    console.error('Erro ao processar pagamentos:', error)
    return NextResponse.json(
      { error: 'Erro ao processar pagamentos mensais' },
      { status: 500 }
    )
  }
}
