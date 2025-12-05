import type {
  ClientAggregate,
  LiteClientAggregate,
} from '@/core/domain/client/entities/client.entity'
import type { ClientRepository } from '@/core/ports/repositories/client.repository'
import type { ClientListQuery } from '@/shared/schemas/client.schema'

interface ListClientsInput extends ClientListQuery {
  orgId: string
  role: string
  userId: string
}

interface ListClientsResult {
  data: (ClientAggregate | LiteClientAggregate)[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
    nextCursor: string | null
  }
}

interface ClientOnlyResult {
  client: LiteClientAggregate | null
}

export class ListClientsUseCase {
  constructor(private readonly repository: ClientRepository) {}

  async execute(input: ListClientsInput): Promise<ListClientsResult | ClientOnlyResult> {
    const take = Math.min(input.limit ?? 50, 200)

    if (input.role === 'CLIENT') {
      const client = await this.repository.findClientForUser({
        orgId: input.orgId,
        userId: input.userId,
      })
      return { client }
    }

    const { data, hasNextPage, nextCursor } = await this.repository.list({
      orgId: input.orgId,
      take,
      cursor: input.cursor ?? undefined,
      lite: input.lite === '1',
    })

    return {
      data,
      meta: {
        page: 1,
        limit: take,
        total: data.length,
        totalPages: 1,
        hasNextPage,
        hasPreviousPage: Boolean(input.cursor),
        nextCursor,
      },
    }
  }
}
