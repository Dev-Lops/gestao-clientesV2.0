import { prisma } from '@/lib/prisma'
import { Payment, PaymentStatus } from '@/core/domain/payment/entities/payment.entity'
import { Money } from '@/core/domain/payment/value-objects/money.vo'
import { TransactionStatus, TransactionSubtype, TransactionType } from '@prisma/client'

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
      invoiceId: null,
      costItemId: null,
      metadata: null,
      createdAt: props.createdAt,
      createdBy: null,
      updatedAt: props.updatedAt,
      updatedBy: null,
      deletedAt: null,
      deletedBy: null,
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

  private mapToDomain(transaction: {
    id: string
    orgId: string
    clientId: string | null
    amount: number
    date: Date
    status: TransactionStatus
    description: string | null
    createdAt: Date
    updatedAt: Date
  }): Payment {
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

