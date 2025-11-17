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

    // Suporta tanto JSON quanto FormData
    let method = 'manual'
    let amount: number | undefined

    const contentType = req.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      const body = await req.json().catch(() => ({}))
      method = body.method || 'manual'
      amount = body.amount
    } else {
      // FormData
      const formData = await req.formData()
      method = (formData.get('method') as string) || 'manual'
      const amountStr = formData.get('amount') as string
      if (amountStr) amount = parseFloat(amountStr)
    }

    const invoice = await BillingService.markInvoicePaid(
      invoiceId,
      orgId,
      method,
      amount
    )

    // Se foi chamado por form (não tem Accept: application/json), redireciona
    const acceptHeader = req.headers.get('accept')
    if (!acceptHeader?.includes('application/json')) {
      // Busca o clientId da fatura para redirecionar
      redirect(`/clients/${invoice.clientId}/billing`)
    }

    return NextResponse.json({ success: true, invoice })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao pagar fatura'
    const code = msg.includes('não encontrada') ? 404 : 400
    return NextResponse.json({ error: msg }, { status: code })
  }
}
