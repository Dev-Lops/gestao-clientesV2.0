import { can, type AppRole } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const { orgId, role } = await getSessionProfile()
  if (!orgId || !role)
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!can(role as unknown as AppRole, 'read', 'finance'))
    return NextResponse.json({ error: 'Proibido' }, { status: 403 })

  const rows = await prisma.fixedExpense.findMany({
    where: { orgId },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const { orgId, role } = await getSessionProfile()
  if (!orgId || !role)
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!can(role as unknown as AppRole, 'create', 'finance'))
    return NextResponse.json({ error: 'Proibido' }, { status: 403 })

  const body = await req.json()
  const {
    name,
    amount,
    category,
    cycle = 'MONTHLY',
    dayOfMonth,
    notes,
  } = body || {}
  if (!name || typeof amount !== 'number') {
    return NextResponse.json(
      { error: 'Campos obrigatórios faltando' },
      { status: 400 }
    )
  }
  const created = await prisma.fixedExpense.create({
    data: { orgId, name, amount, category, cycle, dayOfMonth, notes },
  })
  return NextResponse.json(created, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const { orgId, role } = await getSessionProfile()
  if (!orgId || !role)
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!can(role as unknown as AppRole, 'update', 'finance'))
    return NextResponse.json({ error: 'Proibido' }, { status: 403 })

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  const body = await req.json()
  const updated = await prisma.fixedExpense.update({
    where: { id },
    data: body,
  })
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest) {
  const { orgId, role } = await getSessionProfile()
  if (!orgId || !role)
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!can(role as unknown as AppRole, 'delete', 'finance'))
    return NextResponse.json({ error: 'Proibido' }, { status: 403 })

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  await prisma.fixedExpense.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
