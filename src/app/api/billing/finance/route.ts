import { can, type AppRole } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'
import { Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { orgId, role } = await getSessionProfile()
  if (!orgId || !role)
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!can(role as AppRole, 'read', 'finance'))
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const url = new URL(req.url)
  const type = url.searchParams.get('type') || undefined // 'income' | 'expense'
  const q = url.searchParams.get('q') || undefined
  const category = url.searchParams.get('category') || undefined
  const from = url.searchParams.get('from')
    ? new Date(url.searchParams.get('from') as string)
    : undefined
  const to = url.searchParams.get('to')
    ? new Date(url.searchParams.get('to') as string)
    : undefined
  const page = Math.max(1, Number(url.searchParams.get('page') || '1'))
  const pageSize = Math.max(
    1,
    Math.min(100, Number(url.searchParams.get('pageSize') || '20'))
  )

  const where: Prisma.FinanceWhereInput = { orgId }
  if (type) where.type = type
  if (category) where.category = { contains: category, mode: 'insensitive' }
  if (q) {
    where.OR = [
      { description: { contains: q, mode: 'insensitive' } },
      { category: { contains: q, mode: 'insensitive' } },
    ]
  }
  if (from || to) where.date = { gte: from, lte: to }

  const skip = (page - 1) * pageSize
  const [items, total] = await Promise.all([
    prisma.finance.findMany({
      where,
      skip,
      take: pageSize,
      select: {
        id: true,
        type: true,
        amount: true,
        description: true,
        category: true,
        date: true,
        clientId: true,
        createdAt: true,
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    }),
    prisma.finance.count({ where }),
  ])

  return NextResponse.json({ items, total, page, pageSize })
}

export async function POST(req: NextRequest) {
  const { orgId, role } = await getSessionProfile()
  if (!orgId || !role)
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!can(role as AppRole, 'create', 'finance'))
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const body = await req.json()
  const { type, amount, description, category, date, clientId } = body || {}
  if (!type || !amount || isNaN(Number(amount)))
    return NextResponse.json(
      { error: 'Campos obrigatórios ausentes' },
      { status: 400 }
    )

  const created = await prisma.finance.create({
    data: {
      orgId,
      clientId: clientId || null,
      type,
      amount: Number(amount),
      description: description || null,
      category: category || null,
      date: date ? new Date(date) : new Date(),
    },
  })
  return NextResponse.json({ success: true, finance: created })
}
