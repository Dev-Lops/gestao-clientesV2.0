import { can, type AppRole } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { applySecurityHeaders, guardAccess } from '@/proxy'
import { getSessionProfile } from '@/services/auth/session'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/finance - List all finance records for the organization
export async function GET(req: NextRequest) {
  try {
    const guard = guardAccess(req)
    if (guard) return guard
    const { orgId, role } = await getSessionProfile()

    if (!orgId || !role) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    if (!can(role as unknown as AppRole, 'read', 'finance')) {
      return NextResponse.json({ error: 'Proibido' }, { status: 403 })
    }

    const finances = await prisma.finance.findMany({
      where: {
        orgId,
      },
      select: {
        id: true,
        type: true,
        amount: true,
        description: true,
        category: true,
        date: true,
        clientId: true,
        createdAt: true,
        updatedAt: true,
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    })

    const res = NextResponse.json(finances)
    return applySecurityHeaders(req, res)
  } catch (error) {
    console.error('Error fetching finances:', error)
    const res = NextResponse.json(
      { error: 'Erro ao buscar finanças' },
      { status: 500 }
    )
    return applySecurityHeaders(req, res)
  }
}

// POST /api/finance - Create finance record
export async function POST(req: NextRequest) {
  try {
    const guard = guardAccess(req)
    if (guard) return guard
    const { orgId, role } = await getSessionProfile()

    if (!orgId || !role) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    if (!can(role as unknown as AppRole, 'create', 'finance')) {
      return NextResponse.json({ error: 'Proibido' }, { status: 403 })
    }

    const body = await req.json()
    const { type, amount, description, category, date, clientId } = body

    if (!type || !amount) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      )
    }

    // If clientId is provided, verify it belongs to the org
    if (clientId) {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        select: { orgId: true },
      })

      if (!client || client.orgId !== orgId) {
        return NextResponse.json(
          { error: 'Cliente não encontrado' },
          { status: 404 }
        )
      }
    }

    // Garantir vínculo com fatura para receitas (income)
    let invoiceId: string | null = null
    const parsedAmount =
      typeof amount === 'string' ? parseFloat(amount) : amount
    const entryDate = date ? new Date(date) : new Date()

    if (type === 'income' && clientId) {
      // tenta achar fatura do mês correspondente
      const periodStart = new Date(
        entryDate.getFullYear(),
        entryDate.getMonth(),
        1
      )
      const periodEnd = new Date(
        entryDate.getFullYear(),
        entryDate.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      )
      const existingInvoice = await prisma.invoice.findFirst({
        where: {
          orgId,
          clientId,
          dueDate: { gte: periodStart, lte: periodEnd },
          status: { in: ['OPEN', 'OVERDUE'] },
        },
      })

      if (existingInvoice) {
        invoiceId = existingInvoice.id
      } else {
        // cria fatura simples para vincular a receita
        const number = `INV-${entryDate.getFullYear()}${String(entryDate.getMonth() + 1).padStart(2, '0')}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
        const created = await prisma.invoice.create({
          data: {
            orgId,
            clientId,
            number,
            status: 'OPEN',
            issueDate: entryDate,
            dueDate: periodEnd,
            subtotal: parsedAmount,
            discount: 0,
            tax: 0,
            total: parsedAmount,
            currency: 'BRL',
            notes: `Criada automaticamente por lançamento de receita`,
            items: {
              create: [
                {
                  description: description ?? 'Receita',
                  quantity: 1,
                  unitAmount: parsedAmount,
                  total: parsedAmount,
                },
              ],
            },
          },
        })
        invoiceId = created.id
      }
    }

    const finance = await prisma.finance.create({
      data: {
        orgId,
        clientId: clientId ?? null,
        type,
        amount: parsedAmount,
        description,
        category,
        date: entryDate,
        invoiceId,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    const res = NextResponse.json(finance, { status: 201 })
    return applySecurityHeaders(req, res)
  } catch (error) {
    console.error('Error creating finance:', error)
    const res = NextResponse.json(
      { error: 'Erro ao criar finanças' },
      { status: 500 }
    )
    return applySecurityHeaders(req, res)
  }
}

// PATCH /api/finance?id=<financeId> - Update finance record
export async function PATCH(req: NextRequest) {
  try {
    const guard = guardAccess(req)
    if (guard) return guard
    const { searchParams } = new URL(req.url)
    const financeId = searchParams.get('id')

    if (!financeId) {
      return NextResponse.json(
        { error: 'ID da transação não fornecido' },
        { status: 400 }
      )
    }

    const { orgId, role } = await getSessionProfile()

    if (!orgId || !role) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    if (!can(role as unknown as AppRole, 'update', 'finance')) {
      return NextResponse.json({ error: 'Proibido' }, { status: 403 })
    }

    // Verify finance belongs to org (support legacy by also checking client.orgId)
    const existingFinance = await prisma.finance.findUnique({
      where: { id: financeId },
      include: { client: { select: { orgId: true } } },
    })

    const belongsToOrg =
      !!existingFinance &&
      (existingFinance.orgId === orgId ||
        existingFinance.client?.orgId === orgId)

    if (!belongsToOrg) {
      return NextResponse.json(
        { error: 'Transação não encontrada' },
        { status: 404 }
      )
    }

    const body = await req.json()
    const { type, amount, description, category, date, clientId } = body

    // If clientId is provided, verify it belongs to the org
    if (clientId) {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        select: { orgId: true },
      })

      if (!client || client.orgId !== orgId) {
        return NextResponse.json(
          { error: 'Cliente não encontrado' },
          { status: 404 }
        )
      }
    }

    const finance = await prisma.finance.update({
      where: { id: financeId },
      data: {
        ...(type !== undefined && { type }),
        ...(amount !== undefined && {
          amount: typeof amount === 'string' ? parseFloat(amount) : amount,
        }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(clientId !== undefined && { clientId: clientId || null }),
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    const res = NextResponse.json(finance)
    return applySecurityHeaders(req, res)
  } catch (error) {
    console.error('Error updating finance:', error)
    const res = NextResponse.json(
      { error: 'Erro ao atualizar finanças' },
      { status: 500 }
    )
    return applySecurityHeaders(req, res)
  }
}

// DELETE /api/finance?id=<financeId> - Delete finance record
export async function DELETE(req: NextRequest) {
  try {
    const guard = guardAccess(req)
    if (guard) return guard
    const { searchParams } = new URL(req.url)
    const financeId = searchParams.get('id')

    if (!financeId) {
      return NextResponse.json(
        { error: 'ID da transação não fornecido' },
        { status: 400 }
      )
    }

    const { orgId, role } = await getSessionProfile()

    if (!orgId || !role) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    if (!can(role as unknown as AppRole, 'delete', 'finance')) {
      return NextResponse.json({ error: 'Proibido' }, { status: 403 })
    }

    // Verify finance belongs to org (support legacy by also checking client.orgId)
    const existingFinance = await prisma.finance.findUnique({
      where: { id: financeId },
      include: { client: { select: { orgId: true } } },
    })

    const belongsToOrg =
      !!existingFinance &&
      (existingFinance.orgId === orgId ||
        existingFinance.client?.orgId === orgId)

    if (!belongsToOrg) {
      return NextResponse.json(
        { error: 'Transação não encontrada' },
        { status: 404 }
      )
    }

    await prisma.finance.delete({
      where: { id: financeId },
    })

    const res = NextResponse.json({ success: true })
    return applySecurityHeaders(req, res)
  } catch (error) {
    console.error('Error deleting finance:', error)
    const res = NextResponse.json(
      { error: 'Erro ao deletar finanças' },
      { status: 500 }
    )
    return applySecurityHeaders(req, res)
  }
}
