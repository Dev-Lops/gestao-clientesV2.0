import { TransactionController } from '@/infrastructure/http/controllers/transaction.controller'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const controller = new TransactionController(prisma)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const result = await controller.create({
      type: body.type,
      subtype: body.subtype,
      amount: body.amount,
      orgId: body.orgId,
      date: body.date ? new Date(body.date) : undefined,
      description: body.description,
      category: body.category,
      invoiceId: body.invoiceId,
      clientId: body.clientId,
      createdBy: body.createdBy,
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validação falhou', details: error.issues },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const orgId = searchParams.get('orgId')
    const page = searchParams.get('page')
    const limit = searchParams.get('limit')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.getAll('status')

    if (!orgId) {
      return NextResponse.json(
        { error: 'orgId é obrigatório' },
        { status: 400 }
      )
    }

    const result = await controller.list({
      orgId,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      status,
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
