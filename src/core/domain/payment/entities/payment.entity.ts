import { Money } from '../value-objects/money.vo'
import { PaymentStatus } from '../value-objects/payment-status.vo'

/**
 * Payment Entity
 * Representa um pagamento de fatura no domínio
 *
 * Regras de Negócio:
 * - Pagamento só pode ser feito de fatura com status PENDING ou OVERDUE
 * - Pagamento total completa a fatura
 * - Pagamento parcial mantém fatura PENDING
 * - Reembolso reverte status para PENDING
 * - Pagamento confirmado (VERIFIED) é irreversível
 */

export interface PaymentProps {
  id: string
  orgId: string
  invoiceId: string
  amount: Money
  status: PaymentStatus
  method: PaymentMethod
  reference?: string | null
  processedAt?: Date | null
  verifiedAt?: Date | null
  failureReason?: string | null
  refundedAt?: Date | null
  refundedAmount?: Money | null
  notes?: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
  createdBy?: string | null
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  PIX = 'PIX',
  BOLETO = 'BOLETO',
  CHECK = 'CHECK',
  CASH = 'CASH',
  OTHER = 'OTHER',
}

export class Payment {
  private constructor(private props: PaymentProps) {
    this.validateInvariant()
  }

  static create(props: Omit<PaymentProps, 'createdAt' | 'updatedAt'>): Payment {
    return new Payment({
      ...props,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  static restore(props: PaymentProps): Payment {
    return new Payment(props)
  }

  // ============ Getters ============

  get id(): string {
    return this.props.id
  }

  get orgId(): string {
    return this.props.orgId
  }

  get invoiceId(): string {
    return this.props.invoiceId
  }

  get amount(): Money {
    return this.props.amount
  }

  get status(): PaymentStatus {
    return this.props.status
  }

  get method(): PaymentMethod {
    return this.props.method
  }

  get reference(): string | null {
    return this.props.reference ?? null
  }

  get processedAt(): Date | null {
    return this.props.processedAt ?? null
  }

  get verifiedAt(): Date | null {
    return this.props.verifiedAt ?? null
  }

  get failureReason(): string | null {
    return this.props.failureReason ?? null
  }

  get refundedAt(): Date | null {
    return this.props.refundedAt ?? null
  }

  get refundedAmount(): Money | null {
    return this.props.refundedAmount ?? null
  }

  get notes(): string | null {
    return this.props.notes ?? null
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt ?? null
  }

  get isVerified(): boolean {
    return this.props.status === PaymentStatus.VERIFIED
  }

  get isFailed(): boolean {
    return this.props.status === PaymentStatus.FAILED
  }

  get isPending(): boolean {
    return this.props.status === PaymentStatus.PENDING
  }

  get isRefunded(): boolean {
    return this.props.status === PaymentStatus.REFUNDED
  }

  // ============ Business Methods ============

  /**
   * Marca pagamento como processado
   */
  process(reference: string): void {
    if (this.isVerified) {
      throw new Error('Pagamento verificado não pode ser reprocessado')
    }
    if (this.isFailed) {
      throw new Error('Pagamento falhado não pode ser reprocessado')
    }

    this.props.status = PaymentStatus.PROCESSED
    this.props.reference = reference
    this.props.processedAt = new Date()
    this.props.updatedAt = new Date()
  }

  /**
   * Verifica/confirma pagamento
   */
  verify(): void {
    if (!this.props.processedAt) {
      throw new Error('Pagamento deve estar processado antes de verificar')
    }
    if (this.isVerified) {
      throw new Error('Pagamento já foi verificado')
    }

    this.props.status = PaymentStatus.VERIFIED
    this.props.verifiedAt = new Date()
    this.props.updatedAt = new Date()
  }

  /**
   * Marca pagamento como falhado
   */
  fail(reason: string): void {
    if (this.isVerified) {
      throw new Error('Pagamento verificado não pode falhar')
    }

    this.props.status = PaymentStatus.FAILED
    this.props.failureReason = reason
    this.props.updatedAt = new Date()
  }

  /**
   * Reembolsa pagamento (total ou parcial)
   */
  refund(amount?: Money): void {
    if (this.isRefunded) {
      throw new Error('Pagamento já foi reembolsado')
    }
    if (!this.isVerified) {
      throw new Error('Apenas pagamentos verificados podem ser reembolsados')
    }

    const refundAmount = amount ?? this.props.amount

    if (refundAmount.isGreaterThan(this.props.amount)) {
      throw new Error('Valor do reembolso não pode exceder o pagamento')
    }

    this.props.status = PaymentStatus.REFUNDED
    this.props.refundedAmount = refundAmount
    this.props.refundedAt = new Date()
    this.props.updatedAt = new Date()
  }

  /**
   * Adiciona notas ao pagamento
   */
  addNote(note: string): void {
    if (!note || note.trim().length === 0) {
      throw new Error('Nota não pode ser vazia')
    }
    this.props.notes = note.trim()
    this.props.updatedAt = new Date()
  }

  /**
   * Valida invariantes de domínio
   */
  private validateInvariant(): void {
    if (!this.props.id) throw new Error('Payment ID é obrigatório')
    if (!this.props.orgId) throw new Error('OrgId é obrigatório')
    if (!this.props.invoiceId) throw new Error('InvoiceId é obrigatório')
    if (this.props.amount.value <= 0)
      throw new Error('Valor deve ser maior que 0')

    // Se verificado, deve ter processedAt
    if (
      this.props.status === PaymentStatus.VERIFIED &&
      !this.props.processedAt
    ) {
      throw new Error('Pagamento verificado deve ter data de processamento')
    }

    // Se processado, deve ter referência
    if (
      this.props.status === PaymentStatus.PROCESSED &&
      !this.props.reference
    ) {
      throw new Error('Pagamento processado deve ter referência')
    }
  }

  canBeRefunded(): boolean {
    return this.isVerified && !this.isRefunded
  }

  toJSON(): PaymentProps {
    return { ...this.props }
  }
}
