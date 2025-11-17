import { can, type AppRole } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'
import { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'

function toCsvValue(val: unknown) {
  if (val === null || val === undefined) return ''
  const s = String(val)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

export async function GET(req: Request) {
  const { orgId, role } = await getSessionProfile()
  if (!orgId || !role)
    return new NextResponse('Não autenticado', { status: 401 })
  if (!can(role as AppRole, 'read', 'finance'))
    return new NextResponse('Sem permissão', { status: 403 })

  const url = new URL(req.url)
  const type = url.searchParams.get('type') || undefined
  const q = url.searchParams.get('q') || undefined
  const category = url.searchParams.get('category') || undefined
  const from = url.searchParams.get('from')
    ? new Date(url.searchParams.get('from') as string)
    : undefined
  const to = url.searchParams.get('to')
    ? new Date(url.searchParams.get('to') as string)
    : undefined

  const where: Prisma.FinanceWhereInput = { orgId }
  if (type) where.type = type
  if (category) where.category = { contains: category, mode: 'insensitive' }
  if (q)
    where.OR = [
      { description: { contains: q, mode: 'insensitive' } },
      { category: { contains: q, mode: 'insensitive' } },
    ]
  if (from || to) where.date = { gte: from, lte: to }

  const rows = await prisma.finance.findMany({
    where,
    orderBy: { date: 'desc' },
    include: { client: true },
  })
  const headers = [
    'Data',
    'Tipo',
    'Valor',
    'Categoria',
    'Descrição',
    'Cliente',
    'ClientId',
    'FinanceId',
  ]
  const lines = [headers.join(',')]
  for (const r of rows) {
    lines.push(
      [
        toCsvValue(r.date.toISOString()),
        toCsvValue(r.type),
        toCsvValue(r.amount),
        toCsvValue(r.category || ''),
        toCsvValue(r.description || ''),
        toCsvValue(r.client?.name || ''),
        toCsvValue(r.clientId || ''),
        toCsvValue(r.id),
      ].join(',')
    )
  }
  const csv = lines.join('\n')
  const filename = `finance-${new Date().toISOString().slice(0, 10)}.csv`
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename=${filename}`,
    },
  })
}
