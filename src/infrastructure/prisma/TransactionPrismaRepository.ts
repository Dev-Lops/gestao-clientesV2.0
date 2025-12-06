import type {
  TransactionInput,
  TransactionRepository,
} from '@/domain/transactions/TransactionService'
import { PrismaClient } from '@prisma/client'

export class TransactionPrismaRepository implements TransactionRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: TransactionInput): Promise<any> {
    const created = await this.prisma.transaction.create({
      data: {
        orgId: data.orgId,
        type: data.type,
        subtype: data.subtype as any,
        amount: data.amount,
        date: new Date(data.date),
        description: data.description,
        clientId: data.clientId ?? null,
      },
      include: {
        client: {
          select: { id: true, name: true, email: true },
        },
        invoice: {
          select: { id: true, number: true, status: true },
        },
        costItem: {
          select: { id: true, name: true, category: true },
        },
      },
    })
    return created
  }

  async listInRange(
    orgId: string,
    start: Date,
    end: Date
  ): Promise<ReadonlyArray<{ type: 'INCOME' | 'EXPENSE'; amount: number }>> {
    const rows = await this.prisma.transaction.findMany({
      where: { orgId, date: { gte: start, lte: end }, deletedAt: null },
      select: { type: true, amount: true },
    })
    return rows.map((r) => ({
      type: r.type as 'INCOME' | 'EXPENSE',
      amount: Number(r.amount),
    }))
  }
}
