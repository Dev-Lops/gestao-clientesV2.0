import { Money } from '@/core/domain/payment/value-objects/money.vo'

export enum PaymentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  LATE = 'LATE',
}

export interface PaymentProps {
  id: string
  orgId: string
  clientId: string
  amount: Money
  dueDate: Date
  status: PaymentStatus
  description?: string | null
  createdAt: Date
  updatedAt: Date
  paidAt?: Date | null
}

export class Payment {
  constructor(private readonly props: PaymentProps) {}

  get id() {
    return this.props.id
  }

  get orgId() {
    return this.props.orgId
  }

  get clientId() {
    return this.props.clientId
  }

  get amount() {
    return this.props.amount
  }

  get status() {
    return this.props.status
  }

  get dueDate() {
    return this.props.dueDate
  }

  get paidAt() {
    return this.props.paidAt ?? null
  }

  get description() {
    return this.props.description ?? null
  }

  toPrimitives() {
    return {
      id: this.props.id,
      orgId: this.props.orgId,
      clientId: this.props.clientId,
      amount: this.props.amount.amount,
      status: this.props.status,
      dueDate: this.props.dueDate,
      description: this.props.description ?? null,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
      paidAt: this.paidAt,
    }
  }
}

