import type { ClientAggregate, LiteClientAggregate } from '@/core/domain/client/entities/client.entity'
import { ClientStatus } from '@/types/enums'
import type { ClientPlan, SocialChannel } from '@prisma/client'

export interface CreateClientRepositoryInput {
  orgId: string
  name: string
  email?: string | null
  phone?: string | null
  status?: ClientStatus
  plan?: ClientPlan | null
  mainChannel?: SocialChannel | null
  contractStart?: Date | null
  contractEnd?: Date | null
  paymentDay?: number | null
  contractValue?: number | null
  isInstallment?: boolean
  installmentCount?: number | null
  installmentValue?: number | null
  installmentPaymentDays?: number[] | null
}

export interface ListClientsRepositoryInput {
  orgId: string
  take: number
  cursor?: string
  lite?: boolean
}

export interface ListClientsRepositoryOutput {
  data: (ClientAggregate | LiteClientAggregate)[]
  hasNextPage: boolean
  nextCursor: string | null
}

export interface ClientRepository {
  create(data: CreateClientRepositoryInput): Promise<ClientAggregate>
  findClientForUser(params: { orgId: string; userId: string }): Promise<LiteClientAggregate | null>
  list(params: ListClientsRepositoryInput): Promise<ListClientsRepositoryOutput>
}
