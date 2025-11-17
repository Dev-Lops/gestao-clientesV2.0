import { can, type AppRole } from '@/lib/permissions'
import { getSessionProfile } from '@/services/auth/session'
import { BillingService } from '@/services/billing/BillingService'
import { redirect } from 'next/navigation'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const { orgId, role } = await getSessionProfile()
    if (!orgId || !role)
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    if (!can(role as AppRole, 'create', 'finance'))
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

    const { invoiceId } = await params

    const invoice = await BillingService.cancelInvoice(invoiceId, orgId)

    const acceptHeader = req.headers.get('accept')
    if (!acceptHeader?.includes('application/json')) {
      redirect(`/clients/${invoice.clientId}/billing/invoices/${invoice.id}`)
    }
    return NextResponse.json({ success: true, invoice })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao cancelar fatura'
    const code = msg.includes('não encontrada') ? 404 : 400
    return NextResponse.json({ error: msg }, { status: code })
  }
}
