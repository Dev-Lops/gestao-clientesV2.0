import { withOrgScope } from '@/lib/db/scope'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const orgId = req.headers.get('x-org-id')
  const status = req.nextUrl.searchParams.get('status') || 'active'
  if (!orgId)
    return NextResponse.json({ error: 'x-org-id obrigatório' }, { status: 400 })

  // Exemplo real usando withOrgScope para respeitar RLS por organização
  const result = await withOrgScope(orgId, async (tx) => {
    const clients = await tx.client.findMany({ where: { status } })
    return clients
  })

  return NextResponse.json({ clients: result })
}
