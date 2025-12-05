import { authenticateRequest } from '@/infrastructure/http/middlewares/auth.middleware'
import { ApiResponseHandler } from '@/infrastructure/http/response'
import { cacheInvalidation } from '@/lib/cache'
import { getEmailNotificationService } from '@/lib/email-notifications'
import { prisma } from '@/lib/prisma'
import { invoiceListQuerySchema } from '@/lib/validations'
import { InvoiceService } from '@/services/financial'
import { InvoiceStatus } from '@prisma/client'
import * as Sentry from '@sentry/nextjs'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // ✨ Autenticação centralizada
    const authResult = await authenticateRequest(request, {
      allowedRoles: ['OWNER'],
      rateLimit: true,
      requireOrg: true,
    })

    if ('error' in authResult) {
      return authResult.error
    }

    const { orgId } = authResult.context
    const { searchParams } = new URL(request.url)

    const parsed = invoiceListQuerySchema.safeParse({
      clientId: searchParams.get('clientId') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      dateFrom: searchParams.get('dateFrom') ?? undefined,
      dateTo: searchParams.get('dateTo') ?? undefined,
      includeDeleted: searchParams.get('includeDeleted') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    })

    if (!parsed.success) {
      return ApiResponseHandler.badRequest(
        'Parâmetros inválidos',
        parsed.error.format()
      )
    }

    const q = parsed.data
    const filters = {
      orgId,
      clientId: q.clientId || undefined,
      status: q.status as InvoiceStatus | undefined,
      dateFrom: q.dateFrom || undefined,
      dateTo: q.dateTo || undefined,
      includeDeleted: q.includeDeleted === 'true',
    }

    const pagination = {
      page: q.page ?? 1,
      limit: q.limit ?? 20,
    }

    const result = await InvoiceService.list(filters, pagination)

    return ApiResponseHandler.success(
      {
        invoices: result.invoices,
        meta: {
          page: result.pagination.page,
          limit: result.pagination.limit,
          totalPages: result.pagination.totalPages,
          total: result.pagination.total,
        },
      },
      'Faturas listadas'
    )
  } catch (error) {
    Sentry.captureException(error)
    console.error('Error listing invoices:', error)
    return ApiResponseHandler.error(error, 'Erro ao listar faturas')
  }
}

export async function POST(request: NextRequest) {
  try {
    // ✨ Autenticação centralizada
    const authResult = await authenticateRequest(request, {
      allowedRoles: ['OWNER'],
      rateLimit: true,
      requireOrg: true,
    })

    if ('error' in authResult) {
      return authResult.error
    }

    const { orgId, user } = authResult.context
    const body = await request.json()

    const invoice = await InvoiceService.create({
      clientId: body.clientId,
      orgId,
      dueDate: new Date(body.dueDate),
      items: body.items,
      discount: body.discount,
      tax: body.tax,
      notes: body.notes,
      internalNotes: body.internalNotes,
      installmentId: body.installmentId,
      createdBy: user.id,
    })

    // Invalidate cache after invoice creation
    cacheInvalidation.invoices(orgId)

    // Send email notification (async, don't await)
    try {
      const emailService = getEmailNotificationService()
      const client = await prisma.client.findUnique({
        where: { id: body.clientId },
        select: { name: true, email: true },
      })
      if (client?.email) {
        emailService
          .sendInvoiceCreatedEmail({
            invoiceNumber: invoice.number,
            clientName: client.name,
            clientEmail: client.email,
            dueDate: new Date(invoice.dueDate).toLocaleDateString('pt-BR'),
            amount:
              typeof invoice.total === 'object'
                ? invoice.total.toNumber()
                : invoice.total,
            currency: 'BRL',
            orgName: 'Gestão Clientes',
            invoiceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${invoice.id}`,
          })
          .catch((err: unknown) => {
            if (err instanceof Error) {
              console.error('Failed to send invoice email:', err.message)
              Sentry.captureException(err)
            }
          })
      }
    } catch (emailError) {
      console.error('Error sending invoice email:', emailError)
      if (emailError instanceof Error) {
        Sentry.captureException(emailError)
      }
      // Don't fail the request if email fails
    }

    return ApiResponseHandler.created(invoice, 'Fatura criada com sucesso')
  } catch (error) {
    Sentry.captureException(error)
    console.error('Error creating invoice:', error)
    return ApiResponseHandler.error(error, 'Erro ao criar fatura')
  }
}
