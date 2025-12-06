import { Money } from '@/core/domain/payment/value-objects/money.vo'

export enum PaymentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  LATE = 'LATE',
}

export enum PaymentMethod {
  PIX = 'PIX',
  CREDIT_CARD = 'CREDIT_CARD',
  BOLETO = 'BOLETO',
  CASH = 'CASH',
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
  method?: PaymentMethod
  reference?: string | null
}

export class Payment {
  constructor(private props: PaymentProps) {}

  static create(params: {
    id: string
    orgId: string
    clientId: string
    amount: number | Money
    dueDate: Date
    description?: string | null
    method?: PaymentMethod
    reference?: string | null
    status?: PaymentStatus
    createdAt?: Date
    updatedAt?: Date
    paidAt?: Date | null
  }): Payment {
    const now = new Date()
    const amount = params.amount instanceof Money ? params.amount : new Money(params.amount)

    return new Payment({
      id: params.id,
      orgId: params.orgId,
      clientId: params.clientId,
      amount,
      dueDate: params.dueDate,
      description: params.description ?? null,
      method: params.method,
      reference: params.reference ?? null,
      status: params.status ?? PaymentStatus.PENDING,
      createdAt: params.createdAt ?? now,
      updatedAt: params.updatedAt ?? now,
      paidAt: params.paidAt ?? null,
    })
  }

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

  get method() {
    return this.props.method
  }

  get reference() {
    return this.props.reference ?? null
  }

  process(reference: string) {
    this.props.status = PaymentStatus.CONFIRMED
    this.props.paidAt = this.props.paidAt ?? new Date()
    this.props.reference = reference
    this.props.updatedAt = new Date()
  }

  refund(amount?: Money) {
    if (amount && amount.isGreaterThan(this.props.amount)) {
      throw new Error('Refund amount cannot exceed payment total')
    }
    this.props.status = PaymentStatus.LATE
    this.props.paidAt = null
    this.props.updatedAt = new Date()
  }

  verify() {
    if (!this.props.amount || this.props.amount.isZero()) {
      throw new Error('Pagamento inválido')
    }
    this.props.updatedAt = new Date()
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
      reference: this.props.reference ?? null,
      method: this.props.method,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
      paidAt: this.paidAt,
    }
  }
}

