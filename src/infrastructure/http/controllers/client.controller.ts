import { CreateClientUseCase } from '@/core/use-cases/client/create-client.use-case'
import { ListClientsUseCase } from '@/core/use-cases/client/list-clients.use-case'
import { ApiResponseHandler } from '@/infrastructure/http/response'
import { PrismaClientRepository } from '@/infrastructure/database/repositories/prisma-client.repository'
import { ClientBillingServiceAdapter } from '@/infrastructure/services/billing/client-billing.service'
import {
  type CreateClientInput,
  clientListQuerySchema,
  createClientSchema,
} from '@/shared/schemas/client.schema'

interface AuthContext {
  orgId: string
  role: string
  userId: string
}

const clientRepository = new PrismaClientRepository()
const billingService = new ClientBillingServiceAdapter()
const createClientUseCase = new CreateClientUseCase(clientRepository, billingService)
const listClientsUseCase = new ListClientsUseCase(clientRepository)

function mapClientResponse(client: any) {
  if (!('status' in client)) {
    return {
      id: client.id,
      name: client.name,
      email: client.email ?? null,
    }
  }

  return {
    id: client.id,
    name: client.name,
    email: client.email ?? null,
    phone: client.phone ?? null,
    status: client.status,
    plan: client.plan,
    mainChannel: client.mainChannel,
    paymentStatus: client.paymentStatus ?? null,
    contractStart: client.contractStart,
    contractEnd: client.contractEnd,
    contractValue: client.contractValue,
    paymentDay: client.paymentDay,
    isInstallment: client.isInstallment,
    installmentCount: client.installmentCount,
    installmentValue: client.installmentValue,
    installmentPaymentDays: client.installmentPaymentDays,
    createdAt: client.createdAt,
    updatedAt: client.updatedAt,
  }
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
  const client = await createClientUseCase.execute({ ...validated, orgId })

  return ApiResponseHandler.created(mapClientResponse(client))
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
  const listResult = await listClientsUseCase.execute({
    orgId,
    role,
    userId,
    ...query.data,
  })

  if ('client' in listResult) {
    if (!listResult.client) {
      return ApiResponseHandler.success([], 'Nenhum cliente associado')
    }
    return ApiResponseHandler.success([listResult.client])
  }

  const mappedData = listResult.data.map(mapClientResponse)
  return ApiResponseHandler.paginatedList(mappedData, listResult.meta)
}
