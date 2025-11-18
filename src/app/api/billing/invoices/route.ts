import { can } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
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

    return NextResponse.json(invoice)
  } catch (err) {
    console.error('POST /api/billing/invoices error:', err)
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json(
      { error: message, details: String(err) },
      { status: 500 }
    )
  }
}
