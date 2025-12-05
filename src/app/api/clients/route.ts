import {
  clientListQuerySchema,
  createClientSchema,
} from '@/domain/clients/validators'
import { authenticateRequest } from '@/infra/http/auth-middleware'
import { ApiResponseHandler } from '@/infra/http/response'
import { prisma } from '@/lib/prisma'
import { applySecurityHeaders } from '@/proxy'
import { ClientBillingService } from '@/services/billing/ClientBillingService'
import { createClient } from '@/services/repositories/clients'
import { ClientStatus } from '@/types/enums'
import type { ClientPlan, SocialChannel } from '@prisma/client'
import * as Sentry from '@sentry/nextjs'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    // ✨ Autenticação centralizada com middleware
    const authResult = await authenticateRequest(req, {
      allowedRoles: ['OWNER'],
      rateLimit: true,
      requireOrg: true,
    })

    if ('error' in authResult) {
      return authResult.error
    }

    const { orgId } = authResult.context
    const body = await req.json()

    // Validate request body with Zod
    const validationResult = createClientSchema.safeParse(body)
    if (!validationResult.success) {
      return ApiResponseHandler.badRequest(
        'Dados inválidos',
        validationResult.error.issues
      )
    }

    const validated = validationResult.data

    const client = await createClient({
      name: validated.name,
      email: validated.email,
      phone: validated.phone,
      status: validated.status as ClientStatus,
      plan: validated.plan ? (validated.plan as ClientPlan) : undefined,
      mainChannel: validated.mainChannel
        ? (validated.mainChannel as SocialChannel)
        : undefined,
      orgId,
      contractStart: validated.contractStart
        ? new Date(validated.contractStart)
        : undefined,
      contractEnd: validated.contractEnd
        ? new Date(validated.contractEnd)
        : undefined,
      paymentDay: validated.paymentDay,
      contractValue: validated.contractValue,
      isInstallment: validated.isInstallment,
      installmentCount: validated.installmentCount,
      installmentValue: validated.installmentValue,
      installmentPaymentDays: validated.installmentPaymentDays,
    })

    // Geração de parcelas delegada à camada de serviço
    await ClientBillingService.generateInstallments({
      clientId: client.id,
      isInstallment: validated.isInstallment,
      installmentCount: validated.installmentCount ?? undefined,
      contractValue: validated.contractValue ?? undefined,
      contractStart: validated.contractStart
        ? new Date(validated.contractStart)
        : undefined,
      paymentDay: validated.paymentDay ?? null,
      installmentValue: validated.installmentValue ?? null,
      installmentPaymentDays: validated.installmentPaymentDays ?? null,
    })

    const res = NextResponse.json(client, { status: 201 })
    return applySecurityHeaders(req, res)
  } catch (error) {
    Sentry.captureException(error)
    console.error('Erro ao criar cliente:', error)
    return ApiResponseHandler.error(error, 'Erro ao criar cliente')
  }
}

export async function GET(req: NextRequest) {
  try {
    // ✨ Autenticação centralizada
    const authResult = await authenticateRequest(req, {
      rateLimit: true,
      requireOrg: true,
    })

    if ('error' in authResult) {
      return authResult.error
    }

    const { user, orgId, role } = authResult.context

    // CLIENT só vê seu próprio registro
    if (role === 'CLIENT') {
      const client = await prisma.client.findFirst({
        where: { orgId, clientUserId: user.id },
      })
      if (!client) {
        return ApiResponseHandler.success([], 'Nenhum cliente associado')
      }
      return ApiResponseHandler.success([
        { id: client.id, name: client.name, email: client.email },
      ])
    }

    const query = clientListQuerySchema.safeParse({
      lite: req.nextUrl.searchParams.get('lite') ?? undefined,
      limit: req.nextUrl.searchParams.get('limit') ?? undefined,
      cursor: req.nextUrl.searchParams.get('cursor') ?? undefined,
    })

    if (!query.success) {
      return ApiResponseHandler.badRequest(
        'Parâmetros inválidos',
        query.error.flatten()
      )
    }

    const { lite, limit, cursor } = query.data
    const take = Math.min(limit ?? 50, 200)

    // OWNER / STAFF: retorno otimizado com select
    const liteMode = lite === '1'

    if (liteMode) {
      const clients = await prisma.client.findMany({
        where: { orgId },
        select: {
          id: true,
          name: true,
        },
        orderBy: { createdAt: 'desc' },
        take,
      })
      return ApiResponseHandler.success(clients, 'Clientes listados')
    }

    // Select apenas campos necessários para listagem completa
    const clients = await prisma.client.findMany({
      where: { orgId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        plan: true,
        mainChannel: true,
        paymentStatus: true,
        contractStart: true,
        contractEnd: true,
        contractValue: true,
        paymentDay: true,
        isInstallment: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: take + 1,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
    })
    const hasNextPage = clients.length > take
    const data = clients.slice(0, take)
    const nextCursor = hasNextPage ? (data[data.length - 1]?.id ?? null) : null

    return ApiResponseHandler.success({
      data,
      meta: {
        limit: take,
        nextCursor,
        hasNextPage,
      },
    })
  } catch (e) {
    Sentry.captureException(e)
    console.error('Erro ao listar clientes', e)
    return ApiResponseHandler.error(e, 'Erro ao listar clientes')
  }
}
