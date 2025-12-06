import { PrismaMeetingRepository } from '@/infrastructure/database/repositories/prisma-meeting.repository'
import { MeetingController } from '@/infrastructure/http/controllers/meeting.controller'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET, PATCH e DELETE /api/meetings/v2/[id]
 * GET: Obter uma reunião
 * PATCH: Atualizar reunião
 * DELETE: Deletar reunião
 */

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    const repository = new PrismaMeetingRepository(prisma)
    const controller = new MeetingController(repository)

    const meeting = await controller.get(id)

    if (!meeting) {
      return NextResponse.json(
        { error: 'Reunião não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(meeting, { status: 200 })
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Erro ao obter reunião'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      clientId,
      participantIds,
      location,
      notes,
      updatedBy,
    } = body

    const repository = new PrismaMeetingRepository(prisma)
    const controller = new MeetingController(repository)

    const { id } = await context.params

    const meeting = await controller.update({
      id,
      title,
      description,
      clientId,
      participantIds,
      location,
      notes,
      updatedBy: updatedBy || 'system',
    })

    return NextResponse.json(meeting, { status: 200 })
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Erro ao atualizar reunião'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const { searchParams } = new URL(request.url)
    const deletedBy = searchParams.get('deletedBy') || 'system'

    const repository = new PrismaMeetingRepository(prisma)
    const controller = new MeetingController(repository)

    await controller.delete(id, deletedBy)

    return NextResponse.json(
      { message: 'Reunião deletada com sucesso' },
      { status: 204 }
    )
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Erro ao deletar reunião'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
