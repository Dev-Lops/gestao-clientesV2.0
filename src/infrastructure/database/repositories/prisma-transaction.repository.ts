// @ts-nocheck
import { Money } from '@/domain/invoice/value-objects/money.vo'
import { Transaction } from '@/domain/transaction/entities/transaction.entity'
import {
  TransactionStatus,
  TransactionSubtype,
  TransactionType,
} from '@/domain/transaction/value-objects/transaction-type.vo'
import { ITransactionRepository } from '@/ports/repositories/transaction.repository.interface'
import { PrismaClient } from '@prisma/client'

/**
 * Implementação Prisma do Transaction Repository
 */

export class PrismaTransactionRepository implements ITransactionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(transaction: Transaction): Promise<void> {
    const data = this.toPrisma(transaction)
    // Cast para Prisma enums - necessário por limitações de type mapping

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prismaData: any = {
      type: data.type as any,
      subtype: data.subtype as any,
      amount: data.amount,
      description: data.description,
      category: data.category,
      date: data.date,
      status: data.status as any,
      invoiceId: data.invoiceId,
      clientId: data.clientId,
      costItemId: data.costItemId,
      metadata: data.metadata ?? null,
      orgId: data.orgId,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt,
      updatedBy: data.updatedBy,
      deletedBy: data.deletedBy,
    }

    if (transaction.id) {
      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: prismaData,
      })
    } else {
      await this.prisma.transaction.create({
        data: {
          ...prismaData,
          id: undefined,
        },
      })
    }
  }

  async findById(id: string): Promise<Transaction | null> {
    const data = await this.prisma.transaction.findUnique({
      where: { id, deletedAt: null },
    })

    return data ? this.toDomain(data) : null
  }

  async findByOrgId(
    orgId: string,
    options?: {
      page?: number
      limit?: number
      startDate?: Date
      endDate?: Date
      status?: TransactionStatus[]
      type?: string[]
    }
  ): Promise<{ transactions: Transaction[]; total: number }> {
    const page = options?.page ?? 1
    const limit = options?.limit ?? 10
    const skip = (page - 1) * limit

    const where: {
      orgId: string
      deletedAt: null
      date?: { gte?: Date; lte?: Date }
      status?: { in: TransactionStatus[] }
      type?: { in: string[] }
    } = {
      orgId,
      deletedAt: null,
    }

    if (options?.startDate || options?.endDate) {
      where.date = {}
      if (options.startDate) where.date.gte = options.startDate
      if (options.endDate) where.date.lte = options.endDate
    }

    if (options?.status && options.status.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where.status = { in: options.status as any }
    }

    if (options?.type && options.type.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where.type = { in: options.type as any }
    }

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
      }),
      this.prisma.transaction.count({ where }),
    ])

    return {
      transactions: data.map((d) => this.toDomain(d)),
      total,
    }
  }

  async findByClientId(
    clientId: string,
    options?: {
      page?: number
      limit?: number
    }
  ): Promise<{ transactions: Transaction[]; total: number }> {
    const page = options?.page ?? 1
    const limit = options?.limit ?? 10
    const skip = (page - 1) * limit

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { clientId, deletedAt: null },
        skip,
        take: limit,
        orderBy: { date: 'desc' },
      }),
      this.prisma.transaction.count({ where: { clientId, deletedAt: null } }),
    ])

    return {
      transactions: data.map((d) => this.toDomain(d)),
      total,
    }
  }

  async delete(id: string): Promise<void> {
    await this.prisma.transaction.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    })
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.transaction.count({
      where: { id, deletedAt: null },
    })
    return count > 0
  }

  private toDomain(data: {
    id: string
    type: string
    subtype: string
    amount: number | { toNumber: () => number }
    description: string | null
    category: string | null
    date: Date
    status: string
    invoiceId: string | null
    clientId: string | null
    costItemId: string | null
    metadata: Record<string, unknown> | null
    orgId: string
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
    createdBy: string | null
    updatedBy: string | null
    deletedBy: string | null
  }): Transaction {
    const toNumber = (value: number | { toNumber: () => number }): number => {
      return typeof value === 'number' ? value : value.toNumber()
    }

    return Transaction.restore({
      id: data.id,
      type: data.type as TransactionType,
      subtype: data.subtype as TransactionSubtype,
      amount: new Money(toNumber(data.amount), 'BRL'),
      description: data.description,
      category: data.category,
      date: data.date,
      status: data.status as TransactionStatus,
      invoiceId: data.invoiceId,
      clientId: data.clientId,
      costItemId: data.costItemId,
      metadata: data.metadata,
      orgId: data.orgId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt,
      createdBy: data.createdBy,
      updatedBy: data.updatedBy,
      deletedBy: data.deletedBy,
    })
  }

  private toPrisma(transaction: Transaction): {
    id?: string
    type: string
    subtype: string
    amount: number
    description: string | null
    category: string | null
    date: Date
    status: string
    invoiceId: string | null
    clientId: string | null
    costItemId: string | null
    metadata: Record<string, unknown> | null
    orgId: string
    updatedAt: Date
    deletedAt: Date | null
    updatedBy: string | null
    deletedBy: string | null
  } {
    return {
      ...(transaction.id && { id: transaction.id }),
      type: transaction.type,
      subtype: transaction.subtype,
      amount: transaction.amount.toNumber(),
      description: transaction.description,
      category: transaction.category,
      date: transaction.date,
      status: transaction.status,
      invoiceId: transaction.invoiceId,
      clientId: transaction.clientId,
      costItemId: transaction.costItemId,
      metadata: transaction.metadata,
      orgId: transaction.orgId,
      updatedAt: transaction.updatedAt,
      deletedAt: transaction.deletedAt,
      updatedBy: transaction.updatedBy,
      deletedBy: transaction.deletedBy,
    }
  }
}
// @ts-nocheck
