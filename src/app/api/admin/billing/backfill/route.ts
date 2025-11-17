import { can, type AppRole } from '@/lib/permissions'
import { getSessionProfile } from '@/services/auth/session'
import { BillingBackfillService } from '@/services/billing/BillingBackfillService'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { orgId, role } = await getSessionProfile()
  if (!orgId || !role)
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!can(role as AppRole, 'manage', 'finance'))
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const url = new URL(req.url)
  const modeParam = (url.searchParams.get('mode') || 'installments') as
    | 'installments'
    | 'finance'
    | 'all'
  const body = (await req.json().catch(() => ({}))) as { dryRun?: boolean }
  const dryRun = !!body?.dryRun

  try {
    const res = await BillingBackfillService.backfill(orgId, modeParam, dryRun)
    return NextResponse.json({ success: true, mode: modeParam, dryRun, ...res })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao executar backfill'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
