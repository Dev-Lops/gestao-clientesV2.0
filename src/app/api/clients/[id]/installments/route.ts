import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'
import { NextRequest, NextResponse } from 'next/server'

type Params = {
  params: Promise<{ id: string }>
}

// GET - Listar parcelas do cliente
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const profile = await getSessionProfile()
    if (!profile) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (!profile.orgId) {
      return NextResponse.json(
        { error: 'Organização não encontrada' },
        { status: 400 }
      )
    }

    const { id } = await params

    // Verificar se o cliente pertence à org do usuário
    const client = await prisma.client.findFirst({
      where: {
        id,
        orgId: profile.orgId,
      },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }

    const installments = await prisma.installment.findMany({
      where: { clientId: id },
      orderBy: { number: 'asc' },
    })

    return NextResponse.json(installments)
  } catch (error) {
    console.error('Erro ao buscar parcelas:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar parcelas' },
      { status: 500 }
    )
  }
}

// POST - Criar parcelas para o cliente (usa dias configurados do cliente se existirem)
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const profile = await getSessionProfile()
    if (!profile || profile.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Apenas OWNER pode criar parcelas' },
        { status: 403 }
      )
    }

    const { id } = await params
    let body: { installmentCount?: number; startDate?: string } = {}
    try {
      body = await request.json()
    } catch {
      body = {}
    }
    const { installmentCount, startDate } = body

    if (!installmentCount || !startDate) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    if (!profile.orgId) {
      return NextResponse.json(
        { error: 'Organização não encontrada' },
        { status: 400 }
      )
    }

    const client = await prisma.client.findFirst({
      where: { id, orgId: profile.orgId },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }

    if (!client.contractValue) {
      return NextResponse.json(
        { error: 'Cliente não possui valor de contrato definido' },
        { status: 400 }
      )
    }

    const installmentValue = client.contractValue / installmentCount

    await prisma.client.update({
      where: { id },
      data: {
        isInstallment: true,
        installmentCount,
        installmentValue,
      },
    })

    // Parse start date
    let initial: Date
    if (/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      const [y, m, d] = startDate.split('-').map(Number)
      initial = new Date(y, m - 1, d, 12)
    } else {
      const tmp = new Date(startDate)
      initial = new Date(tmp.getFullYear(), tmp.getMonth(), tmp.getDate(), 12)
    }

    // Dias configurados no cliente (installmentPaymentDays) — se vazio usa dia da data inicial
    const daysConfigured = client.installmentPaymentDays || []
    const daysSequence =
      daysConfigured.length > 0 ? daysConfigured.slice() : [initial.getDate()]

    const installmentsData: {
      clientId: string
      number: number
      amount: number
      dueDate: Date
      status: 'PENDING'
    }[] = []

    let installmentNumber = 1
    // Começa do mês da data inicial
    const currentMonthDate = new Date(
      initial.getFullYear(),
      initial.getMonth(),
      1,
      12
    )

    while (installmentNumber <= installmentCount) {
      for (const day of daysSequence) {
        if (installmentNumber > installmentCount) break
        const year = currentMonthDate.getFullYear()
        const month = currentMonthDate.getMonth()
        const lastDay = new Date(year, month + 1, 0).getDate()
        const safeDay = Math.min(day, lastDay)
        const dueDate = new Date(year, month, safeDay, 12)

        // Primeira parcela: se data for anterior à inicial, avança para próxima iteração
        if (installmentNumber === 1 && dueDate < initial) {
          continue
        }

        installmentsData.push({
          clientId: id,
          number: installmentNumber,
          amount: installmentValue,
          dueDate,
          status: 'PENDING',
        })
        installmentNumber++
      }
      // próximo mês
      currentMonthDate.setMonth(currentMonthDate.getMonth() + 1)
    }

    const created = await prisma.installment.createMany({
      data: installmentsData,
    })

    return NextResponse.json({
      message: `${created.count} parcelas criadas com sucesso`,
      count: created.count,
    })
  } catch (error) {
    console.error('Erro ao criar parcelas:', error)
    return NextResponse.json(
      { error: 'Erro ao criar parcelas' },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar / editar parcela (status, notas, pagamento, dueDate, amount)
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const profile = await getSessionProfile()
    if (!profile || profile.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Apenas OWNER pode atualizar parcelas' },
        { status: 403 }
      )
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const installmentId = searchParams.get('installmentId')

    if (!installmentId) {
      return NextResponse.json(
        { error: 'ID da parcela não fornecido' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { status, paidAt, notes, dueDate, amount } = body

    if (!profile.orgId) {
      return NextResponse.json(
        { error: 'Organização não encontrada' },
        { status: 400 }
      )
    }

    const installment = await prisma.installment.findFirst({
      where: {
        id: installmentId,
        clientId: id,
        client: { orgId: profile.orgId },
      },
      include: { client: true },
    })

    if (!installment) {
      return NextResponse.json(
        { error: 'Parcela não encontrada' },
        { status: 404 }
      )
    }

    // Preparar updates básicos (não confirmação)
    const simpleUpdate: {
      notes?: string | null
      paidAt?: Date | null
      status?: 'PENDING' | 'CONFIRMED' | 'LATE'
      dueDate?: Date
      amount?: number
    } = {}
    if (notes !== undefined) simpleUpdate.notes = notes
    if (paidAt !== undefined)
      simpleUpdate.paidAt = paidAt ? new Date(paidAt) : null
    if (status && status !== 'CONFIRMED')
      simpleUpdate.status = status as 'PENDING' | 'LATE'
    if (dueDate !== undefined) {
      let parsed: Date | null = null
      if (dueDate) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
          // Parse YYYY-MM-DD diretamente como UTC ao meio-dia
          parsed = new Date(`${dueDate}T12:00:00.000Z`)
        } else {
          const tmp = new Date(dueDate)
          parsed = new Date(
            Date.UTC(tmp.getFullYear(), tmp.getMonth(), tmp.getDate(), 12)
          )
        }
      }
      if (parsed) simpleUpdate.dueDate = parsed
    }
    if (amount !== undefined) {
      const num = Number(amount)
      if (isNaN(num) || num <= 0) {
        return NextResponse.json(
          { error: 'Valor inválido para parcela' },
          { status: 400 }
        )
      }
      simpleUpdate.amount = num
    }

    // Se confirmar pagamento: aplicar edits (dueDate/amount) antes de confirmar
    if (status === 'CONFIRMED' && installment.status !== 'CONFIRMED') {
      if (Object.keys(simpleUpdate).length > 0) {
        await prisma.installment.update({
          where: { id: installmentId },
          data: simpleUpdate,
        })
      }
      const { PaymentService } = await import(
        '@/services/payments/PaymentService'
      )
      await PaymentService.confirmInstallmentPayment(
        installmentId,
        profile.orgId!
      )
      // Recarrega registro
      const refreshed = await prisma.installment.findUnique({
        where: { id: installmentId },
      })
      return NextResponse.json(refreshed)
    } else if (Object.keys(simpleUpdate).length > 0) {
      const updated = await prisma.installment.update({
        where: { id: installmentId },
        data: simpleUpdate,
      })
      return NextResponse.json(updated)
    } else {
      return NextResponse.json(installment) // nada a atualizar
    }
  } catch (error) {
    console.error('Erro ao atualizar parcela:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar parcela' },
      { status: 500 }
    )
  }
}

// DELETE - Deletar parcela específica ou todas
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const profile = await getSessionProfile()
    if (!profile || profile.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Apenas OWNER pode deletar parcelas' },
        { status: 403 }
      )
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const installmentId = searchParams.get('installmentId')

    if (!profile.orgId) {
      return NextResponse.json(
        { error: 'Organização não encontrada' },
        { status: 400 }
      )
    }

    const client = await prisma.client.findFirst({
      where: { id, orgId: profile.orgId },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }

    if (installmentId) {
      // Deleta apenas a parcela informada
      await prisma.installment.deleteMany({
        where: { id: installmentId, clientId: id },
      })
      return NextResponse.json({ message: 'Parcela removida com sucesso' })
    }

    // Deleta todas e reseta cliente
    await prisma.installment.deleteMany({ where: { clientId: id } })
    await prisma.client.update({
      where: { id },
      data: {
        isInstallment: false,
        installmentCount: null,
        installmentValue: null,
      },
    })
    return NextResponse.json({
      message: 'Todas as parcelas removidas com sucesso',
    })
  } catch (error) {
    console.error('Erro ao deletar parcelas:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar parcelas' },
      { status: 500 }
    )
  }
}
