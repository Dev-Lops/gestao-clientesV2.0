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
  const status = url.searchParams.get('status') || undefined
  const q = url.searchParams.get('q') || undefined

  const where: Prisma.InvoiceWhereInput = { orgId }
  if (status) where.status = status as Prisma.InvoiceWhereInput['status']
  if (q)
    where.OR = [
      { number: { contains: q, mode: 'insensitive' } },
      { notes: { contains: q, mode: 'insensitive' } },
      { client: { name: { contains: q, mode: 'insensitive' } } },
    ]

  const rows = await prisma.invoice.findMany({
    where,
    orderBy: { issueDate: 'desc' },
    include: { client: true, payments: true },
  })
  const headers = [
    'Número',
    'Cliente',
    'Status',
    'Emissão',
    'Vencimento',
    'Total',
    'Moeda',
    'Pagamentos',
  ]
  const lines = [headers.join(',')]
  for (const r of rows) {
    const pays =
      r.payments?.map((p) => `${p.method}:${p.amount}:${p.status}`).join('|') ||
      ''
    lines.push(
      [
        toCsvValue(r.number),
        toCsvValue(r.client?.name || ''),
        toCsvValue(r.status),
        toCsvValue(r.issueDate.toISOString()),
        toCsvValue(r.dueDate.toISOString()),
        toCsvValue(r.total),
        toCsvValue(r.currency),
        toCsvValue(pays),
      ].join(',')
    )
  }
  const csv = lines.join('\n')
  const filename = `invoices-${new Date().toISOString().slice(0, 10)}.csv`
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename=${filename}`,
    },
  })
}
