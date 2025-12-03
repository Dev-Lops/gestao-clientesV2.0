import { can, type AppRole } from '@/lib/permissions'
import { applySecurityHeaders, guardAccess } from '@/proxy'
import { getSessionProfile } from '@/services/auth/session'
import { BillingBackfillService } from '@/services/billing/BillingBackfillService'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const guard = guardAccess(req)
  if (guard) return guard
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
    const resData = await BillingBackfillService.backfill(
      orgId,
      modeParam,
      dryRun
    )
    const res = NextResponse.json({
      success: true,
      mode: modeParam,
      dryRun,
      ...resData,
    })
    return applySecurityHeaders(req, res)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao executar backfill'
    const res = NextResponse.json({ error: msg }, { status: 500 })
    return applySecurityHeaders(req, res)
  }
}
