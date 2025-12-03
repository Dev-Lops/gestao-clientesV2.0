import { can } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { applySecurityHeaders, guardAccess } from '@/proxy'
import { getSessionProfile } from '@/services/auth/session'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const guard = guardAccess(req as any)
    if (guard) return guard
    const { orgId, role } = await getSessionProfile()
    if (!orgId || !role)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!can(role, 'create', 'finance'))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const { clientId, dueDate, total, items, ...rest } = body
    if (!clientId || !dueDate || !total) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validação para evitar duplicidade de fatura por cliente/período
    // Considera período como mês/ano do dueDate
    const due = new Date(dueDate)
    const periodKey = `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, '0')}`
    const existing = await prisma.invoice.findFirst({
      where: {
        orgId,
        clientId,
        dueDate: {
          gte: new Date(due.getFullYear(), due.getMonth(), 1),
          lte: new Date(
            due.getFullYear(),
            due.getMonth() + 1,
            0,
            23,
            59,
            59,
            999
          ),
        },
      },
    })
    if (existing) {
      return NextResponse.json(
        {
          error: 'Já existe uma fatura para este cliente neste período.',
          invoiceId: existing.id,
        },
        { status: 409 }
      )
    }

    // Cria a fatura
    const invoice = await prisma.invoice.create({
      data: {
        orgId,
        clientId,
        dueDate: new Date(dueDate),
        total,
        ...rest,
        items:
          items && Array.isArray(items)
            ? {
                create: items.map(
                  (item: {
                    description: string
                    quantity?: number
                    unitAmount: number
                    total: number
                  }) => ({
                    description: item.description,
                    quantity: item.quantity || 1,
                    unitAmount: item.unitAmount,
                    total: item.total,
                  })
                ),
              }
            : undefined,
      },
      include: { items: true },
    })

    const res = NextResponse.json(invoice)
    return applySecurityHeaders(req as any, res)
  } catch (err) {
    console.error('POST /api/billing/invoices error:', err)
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    const res = NextResponse.json(
      { error: message, details: String(err) },
      { status: 500 }
    )
    return applySecurityHeaders(req as any, res)
  }
}
