import { can, type AppRole } from '@/lib/permissions'
import { getSessionProfile } from '@/services/auth/session'
import { BillingService } from '@/services/billing/BillingService'
import { redirect } from 'next/navigation'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId, role } = await getSessionProfile()
    if (!orgId || !role)
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    if (!can(role as AppRole, 'read', 'finance'))
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

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
    // const invoice = await BillingService.generateMonthlyInvoice(clientId, orgId)

    // Redirect para a página de billing do cliente após criar a fatura
    redirect(`/clients/${clientId}/billing`)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao gerar fatura'
    const code = msg.includes('não encontrado') ? 404 : 400
    return NextResponse.json({ error: msg }, { status: code })
  }
}
