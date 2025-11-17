import { can, type AppRole } from '@/lib/permissions'
import { getSessionProfile } from '@/services/auth/session'
import { BillingService } from '@/services/billing/BillingService'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { orgId, role } = await getSessionProfile()
    if (!orgId || !role)
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    if (!can(role as AppRole, 'update', 'finance'))
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    const url = new URL(req.url)
    const send =
      url.searchParams.get('sendNotifications') ||
      url.searchParams.get('notify')
    const sendNotifications = send === '1' || send === 'true'
    const res = await BillingService.dailyJob(orgId, { sendNotifications })
    return NextResponse.json({ success: true, ...res })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro no job diário'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
