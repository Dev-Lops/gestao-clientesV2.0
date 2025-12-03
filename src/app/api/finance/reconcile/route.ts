import { can, type AppRole } from '@/lib/permissions'
import { getSessionProfile } from '@/services/auth/session'
import { runFinanceReconciliation } from '@/services/billing/FinanceReconciliationService'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { orgId, role } = await getSessionProfile()
  if (!role)
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!can(role as unknown as AppRole, 'update', 'finance'))
    return NextResponse.json({ error: 'Proibido' }, { status: 403 })

  const url = new URL(req.url)
  const notify = url.searchParams.get('notify') === 'true'
  await runFinanceReconciliation({ notify, orgId: orgId || undefined })
  return NextResponse.json({ ok: true })
}
