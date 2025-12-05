import { prisma } from '@/lib/prisma'
import { Payment, PaymentStatus } from '@/core/domain/payment/entities/payment.entity'
import { Money } from '@/core/domain/payment/value-objects/money.vo'
import {
  Transaction,
  TransactionStatus,
  TransactionSubtype,
  TransactionType,
} from '@prisma/client'

export class PrismaPaymentRepository {
  async upsert(payment: Payment): Promise<void> {
    const data = this.mapToTransaction(payment)

    await prisma.transaction.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    })
  }

  async findById(id: string): Promise<Payment | null> {
    const record = await prisma.transaction.findUnique({ where: { id } })
    if (!record) return null
    return this.mapToDomain(record)
  }

  private mapToTransaction(payment: Payment) {
    const props = payment.toPrimitives()

    return {
      id: props.id,
      orgId: props.orgId,
      clientId: props.clientId,
      amount: props.amount,
      description: props.description,
      date: props.dueDate,
      status: this.mapStatus(props.status),
      type: TransactionType.INCOME,
      subtype: TransactionSubtype.INVOICE_PAYMENT,
      invoiceId: undefined,
      costItemId: undefined,
      metadata: undefined,
      createdAt: props.createdAt,
      createdBy: undefined,
      updatedAt: props.updatedAt,
      updatedBy: undefined,
      deletedAt: undefined,
      deletedBy: undefined,
      category: 'payment',
    }
  }

  private mapStatus(status: PaymentStatus): TransactionStatus {
    switch (status) {
      case PaymentStatus.CONFIRMED:
        return TransactionStatus.CONFIRMED
      case PaymentStatus.LATE:
        return TransactionStatus.CANCELLED
      default:
        return TransactionStatus.PENDING
    }
  }

  private mapToDomain(transaction: Transaction): Payment {
    return new Payment({
      id: transaction.id,
      orgId: transaction.orgId,
      clientId: transaction.clientId ?? '',
      amount: new Money(transaction.amount),
      dueDate: transaction.date,
      status: this.mapToPaymentStatus(transaction.status),
      description: transaction.description,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      paidAt: null,
    })
  }

  private mapToPaymentStatus(status: TransactionStatus): PaymentStatus {
    switch (status) {
      case TransactionStatus.CONFIRMED:
        return PaymentStatus.CONFIRMED
      case TransactionStatus.CANCELLED:
        return PaymentStatus.LATE
      default:
        return PaymentStatus.PENDING
    }
  }
}

