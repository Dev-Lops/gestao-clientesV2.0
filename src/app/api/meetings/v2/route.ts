import { PrismaMeetingRepository } from '@/infrastructure/database/repositories/prisma-meeting.repository'
import { MeetingController } from '@/infrastructure/http/controllers/meeting.controller'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET e POST /api/meetings/v2
 * GET: Listar reuniões
 * POST: Criar nova reunião
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('orgId')
    const page = searchParams.get('page')
      ? parseInt(searchParams.get('page')!)
      : 1
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!)
      : 10

    if (!orgId) {
      return NextResponse.json(
        { error: 'orgId é obrigatório' },
        { status: 400 }
      )
    }

    const repository = new PrismaMeetingRepository(prisma)
    const controller = new MeetingController(repository)

    const result = await controller.list({
      orgId,
      page,
      limit,
    })

    return NextResponse.json(result, { status: 200 })
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Erro ao listar reuniões'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      type,
      clientId,
      participantIds,
      startDate,
      endDate,
      location,
      notes,
      orgId,
      createdBy,
    } = body

    if (
      !title ||
      !type ||
      !participantIds ||
      !startDate ||
      !endDate ||
      !orgId
    ) {
      return NextResponse.json(
        {
          error:
            'Campos obrigatórios: title, type, participantIds, startDate, endDate, orgId',
        },
        { status: 400 }
      )
    }

    const repository = new PrismaMeetingRepository(prisma)
    const controller = new MeetingController(repository)

    const meeting = await controller.create({
      title,
      description,
      type,
      clientId,
      participantIds,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      location,
      notes,
      orgId,
      createdBy: createdBy || 'system',
    })

    return NextResponse.json(meeting, { status: 201 })
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Erro ao criar reunião'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
