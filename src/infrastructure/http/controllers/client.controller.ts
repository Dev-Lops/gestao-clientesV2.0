import { ApiResponseHandler } from '@/infra/http/response'
import { prisma } from '@/lib/prisma'
import { CreateClientInput, clientListQuerySchema, createClientSchema } from '@/shared/schemas/client.schema'
import { ClientBillingService } from '@/services/billing/ClientBillingService'
import { createClient } from '@/services/repositories/clients'
import { CLIENT_STATUS, type ClientStatus } from '@/types/enums'

interface AuthContext {
  orgId: string
  role: string
  userId: string
}

export async function createClientController(body: unknown, orgId: string) {
  const validationResult = createClientSchema.safeParse(body)
  if (!validationResult.success) {
    return ApiResponseHandler.badRequest(
      'Dados inválidos',
      validationResult.error.issues
    )
  }

  const validated: CreateClientInput = validationResult.data
  const client = await createClient({
    name: validated.name,
    email: validated.email,
    phone: validated.phone,
    status: (validated.status as ClientStatus) || CLIENT_STATUS.NEW,
    plan: validated.plan as any,
    mainChannel: validated.mainChannel as any,
    orgId,
    contractStart: validated.contractStart
      ? new Date(validated.contractStart)
      : undefined,
    contractEnd: validated.contractEnd ? new Date(validated.contractEnd) : undefined,
    paymentDay: validated.paymentDay,
    contractValue: validated.contractValue,
    isInstallment: validated.isInstallment,
    installmentCount: validated.installmentCount,
    installmentValue: validated.installmentValue,
    installmentPaymentDays: validated.installmentPaymentDays,
  })

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

  return ApiResponseHandler.created(client)
}

export async function listClientsController(
  searchParams: URLSearchParams,
  authContext: AuthContext
) {
  const query = clientListQuerySchema.safeParse({
    lite: searchParams.get('lite') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
    cursor: searchParams.get('cursor') ?? undefined,
  })

  if (!query.success) {
    return ApiResponseHandler.badRequest(
      'Parâmetros inválidos',
      query.error.flatten()
    )
  }

  const { orgId, role, userId } = authContext
  const { lite, limit, cursor } = query.data
  const take = Math.min(limit ?? 50, 200)

  if (role === 'CLIENT') {
    const client = await prisma.client.findFirst({
      where: { orgId, clientUserId: userId, deletedAt: null },
    })
    if (!client) {
      return ApiResponseHandler.success([], 'Nenhum cliente associado')
    }
    return ApiResponseHandler.success([
      { id: client.id, name: client.name, email: client.email },
    ])
  }

  const liteMode = lite === '1'
  const baseQuery = {
    where: { orgId, deletedAt: null },
    orderBy: [{ createdAt: 'desc' as const }, { id: 'desc' as const }],
    take: take + 1,
    ...(cursor
      ? {
          cursor: { id: cursor },
          skip: 1,
        }
      : {}),
  }

  if (liteMode) {
    const clients = await prisma.client.findMany({
      ...baseQuery,
      select: {
        id: true,
        name: true,
      },
    })
    const hasNextPage = clients.length > take
    const data = clients.slice(0, take)
    const nextCursor = hasNextPage ? data[data.length - 1]?.id ?? null : null

    return ApiResponseHandler.success({
      data,
      meta: {
        page: 1,
        limit: take,
        total: data.length,
        totalPages: 1,
        hasNextPage,
        hasPreviousPage: Boolean(cursor),
        nextCursor,
      },
    })
  }

  const clients = await prisma.client.findMany({
    ...baseQuery,
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
  })

  const hasNextPage = clients.length > take
  const data = clients.slice(0, take)
  const nextCursor = hasNextPage ? data[data.length - 1]?.id ?? null : null

  return ApiResponseHandler.success({
    data,
    meta: {
      page: 1,
      limit: take,
      total: data.length,
      totalPages: 1,
      hasNextPage,
      hasPreviousPage: Boolean(cursor),
      nextCursor,
    },
  })
}
