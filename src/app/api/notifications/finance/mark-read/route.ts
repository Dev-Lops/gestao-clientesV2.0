import { can, type AppRole } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'
import { NextResponse } from 'next/server'

export async function POST() {
  const { orgId, role } = await getSessionProfile()
  if (!orgId || !role)
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!can(role as AppRole, 'update', 'finance'))
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const res = await prisma.notification.updateMany({
    where: {
      orgId,
      read: false,
      type: { in: ['billing_due_soon', 'billing_overdue'] },
    },
    data: { read: true },
  })

  return NextResponse.json({ success: true, updated: res.count })
}
