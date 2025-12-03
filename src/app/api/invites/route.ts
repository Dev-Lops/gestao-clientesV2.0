import { can } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { applySecurityHeaders, guardAccess } from '@/proxy'
import { getSessionProfile } from '@/services/auth/session'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const guard = guardAccess(req as any)
  if (guard) return guard
  const { user, orgId, role } = await getSessionProfile()
  if (!user || !orgId || !role) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  if (!can(role, 'read', 'invite')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }
  const invites = await prisma.invite.findMany({
    where: { orgId },
    orderBy: { createdAt: 'desc' },
  })
  return applySecurityHeaders(req as any, NextResponse.json({ data: invites }))
}
