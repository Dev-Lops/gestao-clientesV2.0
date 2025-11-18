import { can, type AppRole } from '@/lib/permissions'
import { getSessionProfile } from '@/services/auth/session'
import { BillingService } from '@/services/billing/BillingService'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId, role } = await getSessionProfile()
    if (!orgId || !role)
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    const { id: clientId } = await params
    const invoices = await BillingService.listClientInvoices(clientId, orgId)
    return NextResponse.json(invoices)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao listar faturas'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId, role } = await getSessionProfile()
    if (!orgId || !role)
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    if (!can(role as AppRole, 'create', 'finance'))
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

    const { id: clientId } = await params
    // Criação automática da fatura do mês
    try {
      const invoice = await BillingService.generateMonthlyInvoice(
        clientId,
        orgId
      )
      return NextResponse.json({ success: true, invoice })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro desconhecido'
      return NextResponse.json(
        { success: false, error: message },
        { status: 500 }
      )
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao gerar fatura'
    const code = msg.includes('não encontrado') ? 404 : 400
    return NextResponse.json({ error: msg }, { status: code })
  }
}
