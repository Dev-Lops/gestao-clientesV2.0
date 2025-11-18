import { can } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'
import { NextResponse } from 'next/server'

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const { invoiceId } = await params
    if (!invoiceId) {
      return NextResponse.json({ error: 'Missing invoiceId' }, { status: 400 })
    }
    const { orgId, role } = await getSessionProfile()
    if (!orgId || !role)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!can(role, 'delete', 'finance'))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    })
    if (!invoice || invoice.orgId !== orgId) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    await prisma.invoice.delete({ where: { id: invoiceId } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/billing/invoices/[invoiceId] error:', err)
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json(
      { error: message, details: String(err) },
      { status: 500 }
    )
  }
}
