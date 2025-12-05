import type {
  ClientAggregate,
  LiteClientAggregate,
} from '@/core/domain/client/entities/client.entity'
import type {
  ClientRepository,
  CreateClientRepositoryInput,
  ListClientsRepositoryInput,
  ListClientsRepositoryOutput,
} from '@/core/ports/repositories/client.repository'
import { prisma } from '@/lib/prisma'

export class PrismaClientRepository implements ClientRepository {
  async create(data: CreateClientRepositoryInput): Promise<ClientAggregate> {
    const client = await prisma.client.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        status: data.status,
        plan: data.plan,
        mainChannel: data.mainChannel,
        orgId: data.orgId,
        contractStart: data.contractStart ?? undefined,
        contractEnd: data.contractEnd ?? undefined,
        paymentDay: data.paymentDay ?? undefined,
        contractValue: data.contractValue ?? undefined,
        isInstallment: data.isInstallment ?? false,
        installmentCount: data.installmentCount ?? undefined,
        installmentValue: data.installmentValue ?? undefined,
        installmentPaymentDays: data.installmentPaymentDays ?? undefined,
      },
    })

    return this.toAggregate(client)
  }

  async findClientForUser(params: {
    orgId: string
    userId: string
  }): Promise<LiteClientAggregate | null> {
    const client = await prisma.client.findFirst({
      where: { orgId: params.orgId, clientUserId: params.userId, deletedAt: null },
    })

    if (!client) return null

    return {
      id: client.id,
      name: client.name,
      email: client.email ?? null,
    }
  }

  async list(params: ListClientsRepositoryInput): Promise<ListClientsRepositoryOutput> {
    const baseQuery = {
      where: { orgId: params.orgId, deletedAt: null },
      orderBy: [{ createdAt: 'desc' as const }, { id: 'desc' as const }],
      take: params.take + 1,
      ...(params.cursor
        ? {
            cursor: { id: params.cursor },
            skip: 1,
          }
        : {}),
    }

    if (params.lite) {
      const rows = await prisma.client.findMany({
        ...baseQuery,
        select: {
          id: true,
          name: true,
          email: true,
        },
      })

      return this.buildPagination(rows, params.take)
    }

    const rows = await prisma.client.findMany({
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
        installmentCount: true,
        installmentValue: true,
        installmentPaymentDays: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return this.buildPagination(rows, params.take)
  }

  private buildPagination(
    rows: any[],
    take: number
  ): ListClientsRepositoryOutput {
    const hasNextPage = rows.length > take
    const data = rows.slice(0, take)
    const nextCursor = hasNextPage ? data[data.length - 1]?.id ?? null : null

    return {
      data: data.map((row) => this.toAggregate(row)),
      hasNextPage,
      nextCursor,
    }
  }

  private toAggregate(row: any): ClientAggregate {
    return {
      id: row.id,
      name: row.name,
      email: row.email ?? null,
      phone: row.phone ?? null,
      status: row.status,
      plan: row.plan ?? null,
      mainChannel: row.mainChannel ?? null,
      paymentStatus: row.paymentStatus ?? null,
      contractStart: row.contractStart ?? null,
      contractEnd: row.contractEnd ?? null,
      contractValue: row.contractValue ?? null,
      paymentDay: row.paymentDay ?? null,
      isInstallment: row.isInstallment ?? false,
      installmentCount: row.installmentCount ?? null,
      installmentValue: row.installmentValue ?? null,
      installmentPaymentDays: row.installmentPaymentDays ?? [],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  }
}
