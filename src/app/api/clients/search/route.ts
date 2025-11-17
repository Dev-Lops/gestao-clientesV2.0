import { can, type AppRole } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { orgId, role } = await getSessionProfile()
  if (!orgId || !role)
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!can(role as AppRole, 'read', 'client'))
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const url = new URL(req.url)
  const q = url.searchParams.get('q') || ''
  const take = Math.max(
    1,
    Math.min(50, Number(url.searchParams.get('take') || '20'))
  )
  const items = await prisma.client.findMany({
    where: { orgId, name: { contains: q, mode: 'insensitive' } },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
    take,
  })
  return NextResponse.json(items)
}
