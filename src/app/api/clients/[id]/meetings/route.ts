import { can } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/clients/[id]/meetings - Lista reuniões do cliente
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: clientId } = await params
    const { user, orgId, role } = await getSessionProfile()

    console.log('GET /meetings - Session:', { user, orgId, role })

    if (!user || !orgId || !role) {
      console.error('GET /meetings - Não autorizado:', { user, orgId, role })
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    console.log('GET /meetings - Checking permission:', {
      role,
      action: 'read',
      resource: 'meeting',
    })
    const hasPermission = can(role, 'read', 'meeting')
    console.log('GET /meetings - Has permission:', hasPermission)

    if (!hasPermission) {
      console.error('GET /meetings - Sem permissão:', { role })
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    // Verificar se cliente pertence à org
    const client = await prisma.client.findFirst({
      where: { id: clientId, orgId },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }

    const meetings = await prisma.meeting.findMany({
      where: { clientId },
      orderBy: { startTime: 'desc' },
    })

    return NextResponse.json(meetings)
  } catch (error) {
    console.error('Erro ao buscar reuniões:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar reuniões' },
      { status: 500 }
    )
  }
}

// POST /api/clients/[id]/meetings - Criar reunião
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: clientId } = await params
    const { user, orgId, role } = await getSessionProfile()

    if (!user || !orgId || !role) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (!can(role, 'create', 'meeting')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    // Verificar se cliente pertence à org
    const client = await prisma.client.findFirst({
      where: { id: clientId, orgId },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }

    const body = await req.json()
    const { title, description, startTime, endTime, location, status, notes } =
      body

    // Validações
    if (!title || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Título, data de início e término são obrigatórios' },
        { status: 400 }
      )
    }

    const start = new Date(startTime)
    const end = new Date(endTime)

    if (end <= start) {
      return NextResponse.json(
        { error: 'Horário de término deve ser posterior ao início' },
        { status: 400 }
      )
    }

    const meeting = await prisma.meeting.create({
      data: {
        title,
        description: description || null,
        startTime: start,
        endTime: end,
        location: location || null,
        status: status || 'scheduled',
        notes: notes || null,
        clientId,
      },
    })

    return NextResponse.json(meeting)
  } catch (error) {
    console.error('Erro ao criar reunião:', error)
    return NextResponse.json(
      { error: 'Erro ao criar reunião' },
      { status: 500 }
    )
  }
}

// PATCH /api/clients/[id]/meetings - Atualizar reunião (body deve conter id)
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: clientId } = await params
    const { user, orgId, role } = await getSessionProfile()

    if (!user || !orgId || !role) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (!can(role, 'update', 'meeting')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await req.json()
    const meetingId = body.id

    if (!meetingId) {
      return NextResponse.json(
        { error: 'ID da reunião não fornecido' },
        { status: 400 }
      )
    }

    // Verificar se reunião existe e pertence ao cliente da org
    const existing = await prisma.meeting.findFirst({
      where: {
        id: meetingId,
        clientId,
        client: { orgId },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Reunião não encontrada' },
        { status: 404 }
      )
    }

    const { title, description, startTime, endTime, location, status, notes } =
      body

    // Validar horários se fornecidos
    if (startTime && endTime) {
      const start = new Date(startTime)
      const end = new Date(endTime)

      if (end <= start) {
        return NextResponse.json(
          { error: 'Horário de término deve ser posterior ao início' },
          { status: 400 }
        )
      }
    }

    const meeting = await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        title: title !== undefined ? title : existing.title,
        description:
          description !== undefined ? description : existing.description,
        startTime: startTime ? new Date(startTime) : existing.startTime,
        endTime: endTime ? new Date(endTime) : existing.endTime,
        location: location !== undefined ? location : existing.location,
        status: status !== undefined ? status : existing.status,
        notes: notes !== undefined ? notes : existing.notes,
      },
    })

    return NextResponse.json(meeting)
  } catch (error) {
    console.error('Erro ao atualizar reunião:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar reunião' },
      { status: 500 }
    )
  }
}

// DELETE /api/clients/[id]/meetings - Deletar reunião (body: {id})
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: clientId } = await params
    const { user, orgId, role } = await getSessionProfile()

    if (!user || !orgId || !role) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (!can(role, 'delete', 'meeting')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await req.json()
    const meetingId = body.id

    if (!meetingId) {
      return NextResponse.json(
        { error: 'ID da reunião não fornecido' },
        { status: 400 }
      )
    }

    // Verificar se reunião existe e pertence ao cliente da org
    const existing = await prisma.meeting.findFirst({
      where: {
        id: meetingId,
        clientId,
        client: { orgId },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Reunião não encontrada' },
        { status: 404 }
      )
    }

    await prisma.meeting.delete({
      where: { id: meetingId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar reunião:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar reunião' },
      { status: 500 }
    )
  }
}
