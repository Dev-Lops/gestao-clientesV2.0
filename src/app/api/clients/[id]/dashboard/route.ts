import { can } from '@/lib/permissions'
import { getSessionProfile } from '@/services/auth/session'
import { getClientDashboard } from '@/services/clients/getClientDashboard'
import { NextResponse } from 'next/server'

// GET /api/clients/[id]/dashboard
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params
    const { user, orgId, role } = await getSessionProfile()
    if (!user || !orgId || !role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verifica se pode ler o cliente
    if (!can(role, 'read', 'client')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const data = await getClientDashboard(orgId, clientId)
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(data)
  } catch (e) {
    console.error('Erro dashboard cliente:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
