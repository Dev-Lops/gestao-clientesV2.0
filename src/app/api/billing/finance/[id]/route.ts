import { can, type AppRole } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { orgId, role } = await getSessionProfile()
  if (!orgId || !role)
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const url = new URL(req.url)
  const action = url.searchParams.get('_action')
  if (action === 'delete') {
    if (!can(role as AppRole, 'delete', 'finance'))
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  } else {
    if (!can(role as AppRole, 'update', 'finance'))
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const { id } = await params
  const existing = await prisma.finance.findUnique({ where: { id } })
  if (!existing || existing.orgId !== orgId)
    return NextResponse.json(
      { error: 'Registro não encontrado' },
      { status: 404 }
    )
  if (action === 'delete') {
    await prisma.finance.delete({ where: { id } })
    return NextResponse.json({ success: true })
  }

  const body = await req.json().catch(() => ({}))
  const { amount, description, category, date, type, clientId } = body

  const updated = await prisma.finance.update({
    where: { id },
    data: {
      amount: amount !== undefined ? Number(amount) : existing.amount,
      description:
        description !== undefined ? description : existing.description,
      category: category !== undefined ? category : existing.category,
      date: date ? new Date(date) : existing.date,
      type: type || existing.type,
      clientId: clientId !== undefined ? clientId : existing.clientId,
    },
  })

  return NextResponse.json({ success: true, finance: updated })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { orgId, role } = await getSessionProfile()
  if (!orgId || !role)
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!can(role as AppRole, 'delete', 'finance'))
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id } = await params
  const existing = await prisma.finance.findUnique({ where: { id } })
  if (!existing || existing.orgId !== orgId)
    return NextResponse.json(
      { error: 'Registro não encontrado' },
      { status: 404 }
    )

  await prisma.finance.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
