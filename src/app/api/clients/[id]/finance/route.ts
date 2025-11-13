import { can, type AppRole } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'
import { NextRequest, NextResponse } from 'next/server'

// Helper to validate client belongs to user's org
async function verifyClientAccess(clientId: string, orgId: string) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, orgId: true },
  })
  if (!client || client.orgId !== orgId) return null
  return client
}

// GET /api/clients/[id]/finance - List finance records for the client
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId, role } = await getSessionProfile()

    if (!orgId || !role) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    if (!can(role as AppRole, 'read', 'finance')) {
      return NextResponse.json({ error: 'Proibido' }, { status: 403 })
    }

    const { id: clientId } = await params

    const client = await verifyClientAccess(clientId, orgId)
    if (!client) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }

    const finances = await prisma.finance.findMany({
      where: { clientId: client.id },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(finances)
  } catch (error) {
    console.error('Error fetching client finances:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar finanças do cliente' },
      { status: 500 }
    )
  }
}

// POST /api/clients/[id]/finance - Create finance record for the client
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId, role } = await getSessionProfile()

    if (!orgId || !role) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    if (!can(role as AppRole, 'create', 'finance')) {
      return NextResponse.json({ error: 'Proibido' }, { status: 403 })
    }

    const { id: clientId } = await params
    const client = await verifyClientAccess(clientId, orgId)
    if (!client) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }

    const body = await req.json()
    const { type, amount, description, category, date } = body

    if (!type || amount === undefined || amount === null) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      )
    }

    const finance = await prisma.finance.create({
      data: {
        orgId,
        clientId: client.id,
        type,
        amount: parseFloat(String(amount)),
        description,
        category,
        date: date ? new Date(date) : new Date(),
      },
    })

    return NextResponse.json(finance, { status: 201 })
  } catch (error) {
    console.error('Error creating client finance:', error)
    return NextResponse.json(
      { error: 'Erro ao criar finança do cliente' },
      { status: 500 }
    )
  }
}

// PATCH /api/clients/[id]/finance?id=<financeId> - Update finance record
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(req.url)
    const financeId = searchParams.get('id')

    if (!financeId) {
      return NextResponse.json(
        { error: 'ID da transação não fornecido' },
        { status: 400 }
      )
    }

    const { orgId, role } = await getSessionProfile()

    if (!orgId || !role) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    if (!can(role as AppRole, 'update', 'finance')) {
      return NextResponse.json({ error: 'Proibido' }, { status: 403 })
    }

    const { id: clientId } = await params
    const client = await verifyClientAccess(clientId, orgId)
    if (!client) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }

    // Verify finance belongs to this client and org
    const existing = await prisma.finance.findUnique({
      where: { id: financeId },
      select: { id: true, clientId: true, orgId: true },
    })

    if (
      !existing ||
      existing.clientId !== client.id ||
      existing.orgId !== orgId
    ) {
      return NextResponse.json(
        { error: 'Transação não encontrada' },
        { status: 404 }
      )
    }

    const body = await req.json()
    const { type, amount, description, category, date } = body

    const updated = await prisma.finance.update({
      where: { id: financeId },
      data: {
        ...(type !== undefined && { type }),
        ...(amount !== undefined && { amount: parseFloat(String(amount)) }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(date !== undefined && { date: new Date(date) }),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating client finance:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar finança do cliente' },
      { status: 500 }
    )
  }
}

// DELETE /api/clients/[id]/finance?id=<financeId> - Delete finance record
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(req.url)
    const financeId = searchParams.get('id')

    if (!financeId) {
      return NextResponse.json(
        { error: 'ID da transação não fornecido' },
        { status: 400 }
      )
    }

    const { orgId, role } = await getSessionProfile()

    if (!orgId || !role) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    if (!can(role as AppRole, 'delete', 'finance')) {
      return NextResponse.json({ error: 'Proibido' }, { status: 403 })
    }

    const { id: clientId } = await params
    const client = await verifyClientAccess(clientId, orgId)
    if (!client) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }

    // Verify finance belongs to this client and org
    const existing = await prisma.finance.findUnique({
      where: { id: financeId },
      select: { id: true, clientId: true, orgId: true },
    })

    if (
      !existing ||
      existing.clientId !== client.id ||
      existing.orgId !== orgId
    ) {
      return NextResponse.json(
        { error: 'Transação não encontrada' },
        { status: 404 }
      )
    }

    await prisma.finance.delete({ where: { id: financeId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting client finance:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar finança do cliente' },
      { status: 500 }
    )
  }
}
