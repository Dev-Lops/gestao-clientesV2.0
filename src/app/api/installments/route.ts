import { authenticateRequest } from '@/infrastructure/http/middlewares/auth.middleware'
import { ApiResponseHandler } from '@/infrastructure/http/response'
import { prisma } from '@/lib/prisma'
import * as Sentry from '@sentry/nextjs'
import { NextRequest } from 'next/server'

// GET /api/installments - List installments due this month for the organization
export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req, {
      rateLimit: true,
      requireOrg: true,
    })

    if ('error' in authResult) {
      return authResult.error
    }

    const { orgId } = authResult.context
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    )

    const rows = await prisma.installment.findMany({
      where: {
        client: { orgId },
        dueDate: { gte: startOfMonth, lte: endOfMonth },
        NOT: { status: 'CONFIRMED' },
      },
      orderBy: { dueDate: 'asc' },
      include: {
        client: { select: { id: true, name: true } },
      },
    })

    const data = rows.map((r) => ({
      id: r.id,
      number: r.number,
      amount: r.amount,
      dueDate: r.dueDate.toISOString(),
      status: r.status,
      clientId: r.clientId,
      client: r.client,
    }))

    return ApiResponseHandler.success(data, 'Parcelas do mês listadas')
  } catch (error) {
    Sentry.captureException(error)
    console.error('Error fetching installments:', error)
    return ApiResponseHandler.error(error, 'Erro ao buscar parcelas')
  }
}

// PATCH /api/installments?id=<installmentId> - Confirm payment and create a finance income
export async function PATCH(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req, {
      rateLimit: true,
      requireOrg: true,
    })

    if ('error' in authResult) {
      return authResult.error
    }

    const { orgId } = authResult.context
    const { searchParams } = new URL(req.url)
    const installmentId = searchParams.get('id')

    if (!installmentId) {
      return ApiResponseHandler.badRequest('ID da parcela não fornecido', [
        { field: 'id', message: 'Required' },
      ])
    }

    const inst = await prisma.installment.findUnique({
      where: { id: installmentId },
      include: { client: true },
    })

    if (!inst || inst.client.orgId !== orgId) {
      return ApiResponseHandler.internalError(
        new Error('Installment not found'),
        'installments:patch'
      )
    }

    // Already confirmed
    if (inst.status === 'CONFIRMED') {
      return ApiResponseHandler.success({ ok: true })
    }

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.installment.update({
        where: { id: inst.id },
        data: { status: 'CONFIRMED', paidAt: new Date() },
      })

      await tx.transaction.create({
        data: {
          orgId,
          clientId: inst.clientId,
          type: 'INCOME',
          subtype: 'OTHER_INCOME',
          amount: inst.amount,
          description: `Parcela ${inst.number} - ${inst.client.name}`,
          category: 'Parcelas',
          date: new Date(),
        },
      })

      return u
    })

    return ApiResponseHandler.success({ id: updated.id }, 'Parcela confirmada')
  } catch (error) {
    Sentry.captureException(error)
    console.error('Error confirming installment:', error)
    return ApiResponseHandler.error(error, 'Erro ao confirmar parcela')
  }
}
