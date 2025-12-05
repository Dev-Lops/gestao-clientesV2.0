import { Money } from '@/core/domain/invoice/value-objects/money.vo'
import {
  Payment,
  PaymentMethod,
} from '@/core/domain/payment/entities/payment.entity'
import { PaymentStatus } from '@/core/domain/payment/value-objects/payment-status.vo'
import { IPaymentRepository } from '@/core/ports/repositories/payment.repository.interface'
import { PrismaClient } from '@prisma/client'

/**
 * Implementação do Repository de Pagamentos usando Prisma
 */
export class PrismaPaymentRepository implements IPaymentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(payment: Payment): Promise<void> {
    const data = {
      id: payment.id,
      orgId: payment.orgId,
      invoiceId: payment.invoiceId,
      amount: payment.amount.amount,
      status: payment.status,
      method: payment.method,
      reference: payment.reference,
      processedAt: payment.processedAt,
      verifiedAt: payment.verifiedAt,
      failureReason: payment.failureReason,
      refundedAt: payment.refundedAt,
      refundedAmount: payment.refundedAmount?.amount ?? null,
      notes: payment.notes,
      updatedAt: payment.updatedAt,
      deletedAt: payment.deletedAt,
      createdBy: payment.toJSON().createdBy,
    }

    await this.prisma.payment.upsert({
      where: { id: payment.id },
      create: {
        ...data,
        createdAt: payment.createdAt,
      },
      update: data,
    })
  }

  async findById(id: string): Promise<Payment | null> {
    const data = await this.prisma.payment.findUnique({
      where: { id },
    })

    return data ? this.toDomain(data) : null
  }

  async findByInvoiceId(invoiceId: string): Promise<Payment[]> {
    const data = await this.prisma.payment.findMany({
      where: {
        invoiceId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    })

    return data.map((d) => this.toDomain(d))
  }

  async findByOrgId(
    orgId: string,
    options?: {
      invoiceId?: string
      page?: number
      limit?: number
      status?: string[]
    }
  ): Promise<{ payments: Payment[]; total: number }> {
    const page = options?.page ?? 1
    const limit = options?.limit ?? 10
    const skip = (page - 1) * limit

    const where: {
      orgId: string
      deletedAt: null
      invoiceId?: string
      status?: { in: string[] }
    } = {
      orgId,
      deletedAt: null,
    }

    if (options?.invoiceId) {
      where.invoiceId = options.invoiceId
    }

    if (options?.status && options.status.length > 0) {
      where.status = { in: options.status }
    }

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.count({ where }),
    ])

    return {
      payments: data.map((d) => this.toDomain(d)),
      total,
    }
  }

  async delete(id: string): Promise<void> {
    await this.prisma.payment.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    })
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.payment.count({
      where: { id, deletedAt: null },
    })
    return count > 0
  }

  /**
   * Converte dados do Prisma para entidade de domínio
   */
  private toDomain(data: {
    id: string
    orgId: string
    invoiceId: string
    amount: number
    status: string
    method: string
    reference: string | null
    processedAt: Date | null
    verifiedAt: Date | null
    failureReason: string | null
    refundedAt: Date | null
    refundedAmount: number | null
    notes: string | null
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
    createdBy: string | null
  }): Payment {
    return Payment.restore({
      id: data.id,
      orgId: data.orgId,
      invoiceId: data.invoiceId,
      amount: new Money(data.amount),
      status: data.status as PaymentStatus,
      method: data.method as PaymentMethod,
      reference: data.reference,
      processedAt: data.processedAt,
      verifiedAt: data.verifiedAt,
      failureReason: data.failureReason,
      refundedAt: data.refundedAt,
      refundedAmount: data.refundedAmount
        ? new Money(data.refundedAmount)
        : null,
      notes: data.notes,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt,
      createdBy: data.createdBy,
    })
  }
}
