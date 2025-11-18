import { can } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'
import { InvoiceStatus } from '@prisma/client'
import { NextResponse } from 'next/server'

export async function POST(
  req: Request,
  { params }: { params: { invoiceId: string } }
) {
  try {
    const { invoiceId } = params
    if (!invoiceId) {
      return NextResponse.json({ error: 'Missing invoiceId' }, { status: 400 })
    }
    const { orgId, role } = await getSessionProfile()
    if (!orgId || !role)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!can(role, 'update', 'finance'))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    })
    if (!invoice || invoice.orgId !== orgId) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }
    if (
      invoice.status === InvoiceStatus.CANCELED ||
      invoice.status === InvoiceStatus.VOID
    ) {
      return NextResponse.json(
        { error: 'Invoice already canceled or void' },
        { status: 400 }
      )
    }

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: InvoiceStatus.CANCELED },
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('POST /api/billing/invoices/[invoiceId]/cancel error:', err)
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'Internal Server Error',
        details: String(err),
      },
      { status: 500 }
    )
  }
}
