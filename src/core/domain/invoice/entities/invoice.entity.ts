import { InvoiceStatus } from '../value-objects/invoice-status.vo'
import { Money } from '../value-objects/money.vo'

/**
 * Invoice Entity
 * Representa uma fatura no domínio
 *
 * Regras de Negócio:
 * - Total = Subtotal - Desconto + Taxa
 * - Status PAID só pode ser definido com data de pagamento
 * - Status OVERDUE é calculado automaticamente se passou da dueDate
 * - Fatura cancelada (VOID) não pode ser alterada
 * - Fatura paga não pode ser cancelada
 */

export interface InvoiceProps {
  id: string
  orgId: string
  clientId: string
  number: string
  status: InvoiceStatus
  issueDate: Date
  dueDate: Date
  subtotal: Money
  discount: Money
  tax: Money
  total: Money
  notes?: string | null
  internalNotes?: string | null
  paidAt?: Date | null
  cancelledAt?: Date | null
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
  createdBy?: string | null
  updatedBy?: string | null
}

export class Invoice {
  private constructor(private props: InvoiceProps) {
    this.validateInvariant()
  }

  // ============ Getters ============

  get id(): string {
    return this.props.id
  }

  get orgId(): string {
    return this.props.orgId
  }

  get clientId(): string {
    return this.props.clientId
  }

  get number(): string {
    return this.props.number
  }

  get status(): InvoiceStatus {
    return this.props.status
  }

  get issueDate(): Date {
    return this.props.issueDate
  }

  get dueDate(): Date {
    return this.props.dueDate
  }

  get subtotal(): Money {
    return this.props.subtotal
  }

  get discount(): Money {
    return this.props.discount
  }

  get tax(): Money {
    return this.props.tax
  }

  get total(): Money {
    return this.props.total
  }

  get notes(): string | null {
    return this.props.notes ?? null
  }

  get internalNotes(): string | null {
    return this.props.internalNotes ?? null
  }

  get paidAt(): Date | null {
    return this.props.paidAt ?? null
  }

  get cancelledAt(): Date | null {
    return this.props.cancelledAt ?? null
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

  // ============ Factory Methods ============

  /**
   * Cria uma nova fatura
   */
  static create(props: {
    orgId: string
    clientId: string
    number: string
    issueDate: Date
    dueDate: Date
    subtotal: Money
    discount?: Money
    tax?: Money
    notes?: string
    internalNotes?: string
    createdBy?: string
  }): Invoice {
    const discount = props.discount ?? new Money(0, props.subtotal.currency)
    const tax = props.tax ?? new Money(0, props.subtotal.currency)

    // Calcular total: subtotal - desconto + taxa
    const total = props.subtotal.subtract(discount).add(tax)

    return new Invoice({
      id: '', // Será gerado pelo repositório
      orgId: props.orgId,
      clientId: props.clientId,
      number: props.number,
      status: InvoiceStatus.DRAFT,
      issueDate: props.issueDate,
      dueDate: props.dueDate,
      subtotal: props.subtotal,
      discount,
      tax,
      total,
      notes: props.notes,
      internalNotes: props.internalNotes,
      paidAt: null,
      cancelledAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: props.createdBy,
      updatedBy: null,
    })
  }

  /**
   * Restaura uma fatura existente do banco
   */
  static restore(props: InvoiceProps): Invoice {
    return new Invoice(props)
  }

  // ============ Business Logic ============

  /**
   * Marca fatura como aberta (enviada ao cliente)
   */
  open(): void {
    if (this.props.status === InvoiceStatus.VOID) {
      throw new Error('Fatura cancelada não pode ser reaberta')
    }

    if (this.props.status === InvoiceStatus.PAID) {
      throw new Error('Fatura paga não pode ser reaberta')
    }

    this.props.status = InvoiceStatus.OPEN
    this.props.updatedAt = new Date()
  }

  /**
   * Marca fatura como paga
   */
  markAsPaid(paidAt: Date = new Date()): void {
    if (this.props.status === InvoiceStatus.VOID) {
      throw new Error('Fatura cancelada não pode ser marcada como paga')
    }

    if (this.props.status === InvoiceStatus.PAID) {
      throw new Error('Fatura já está paga')
    }

    this.props.status = InvoiceStatus.PAID
    this.props.paidAt = paidAt
    this.props.updatedAt = new Date()
  }

  /**
   * Cancela a fatura
   */
  cancel(): void {
    if (this.props.status === InvoiceStatus.PAID) {
      throw new Error('Fatura paga não pode ser cancelada')
    }

    if (this.props.status === InvoiceStatus.VOID) {
      throw new Error('Fatura já está cancelada')
    }

    this.props.status = InvoiceStatus.VOID
    this.props.cancelledAt = new Date()
    this.props.updatedAt = new Date()
  }

  /**
   * Atualiza valores da fatura
   */
  updateValues(props: {
    subtotal?: Money
    discount?: Money
    tax?: Money
  }): void {
    if (this.props.status === InvoiceStatus.VOID) {
      throw new Error('Fatura cancelada não pode ser alterada')
    }

    if (this.props.status === InvoiceStatus.PAID) {
      throw new Error('Fatura paga não pode ser alterada')
    }

    if (props.subtotal) {
      this.props.subtotal = props.subtotal
    }

    if (props.discount) {
      this.props.discount = props.discount
    }

    if (props.tax) {
      this.props.tax = props.tax
    }

    // Recalcular total
    this.props.total = this.props.subtotal
      .subtract(this.props.discount)
      .add(this.props.tax)

    this.props.updatedAt = new Date()
    this.validateInvariant()
  }

  /**
   * Atualiza datas
   */
  updateDates(props: { issueDate?: Date; dueDate?: Date }): void {
    if (this.props.status === InvoiceStatus.VOID) {
      throw new Error('Fatura cancelada não pode ser alterada')
    }

    if (this.props.status === InvoiceStatus.PAID) {
      throw new Error('Fatura paga não pode ter datas alteradas')
    }

    if (props.issueDate) {
      this.props.issueDate = props.issueDate
    }

    if (props.dueDate) {
      this.props.dueDate = props.dueDate
    }

    this.props.updatedAt = new Date()
  }

  /**
   * Atualiza notas
   */
  updateNotes(notes?: string, internalNotes?: string): void {
    if (this.props.status === InvoiceStatus.VOID) {
      throw new Error('Fatura cancelada não pode ser alterada')
    }

    if (notes !== undefined) {
      this.props.notes = notes
    }

    if (internalNotes !== undefined) {
      this.props.internalNotes = internalNotes
    }

    this.props.updatedAt = new Date()
  }

  /**
   * Verifica se está vencida
   */
  isOverdue(): boolean {
    if (this.props.status === InvoiceStatus.PAID) {
      return false
    }

    if (this.props.status === InvoiceStatus.VOID) {
      return false
    }

    return new Date() > this.props.dueDate
  }

  /**
   * Atualiza status para vencida se necessário
   */
  checkAndUpdateOverdue(): void {
    if (this.isOverdue() && this.props.status === InvoiceStatus.OPEN) {
      this.props.status = InvoiceStatus.OVERDUE
      this.props.updatedAt = new Date()
    }
  }

  /**
   * Soft delete
   */
  softDelete(): void {
    if (this.props.status === InvoiceStatus.PAID) {
      throw new Error('Fatura paga não pode ser deletada')
    }

    this.props.deletedAt = new Date()
    this.props.updatedAt = new Date()
  }

  /**
   * Verifica se pode ser editada
   */
  canBeEdited(): boolean {
    return (
      this.props.status !== InvoiceStatus.PAID &&
      this.props.status !== InvoiceStatus.VOID &&
      !this.props.deletedAt
    )
  }

  /**
   * Verifica se pode ser paga
   */
  canBePaid(): boolean {
    return (
      (this.props.status === InvoiceStatus.OPEN ||
        this.props.status === InvoiceStatus.OVERDUE) &&
      !this.props.deletedAt
    )
  }

  /**
   * Verifica se pode ser cancelada
   */
  canBeCancelled(): boolean {
    return this.props.status !== InvoiceStatus.PAID && !this.props.deletedAt
  }

  // ============ Validações ============

  /**
   * Valida invariantes da entidade
   */
  private validateInvariant(): void {
    // Total deve ser igual a subtotal - desconto + taxa
    const calculatedTotal = this.props.subtotal
      .subtract(this.props.discount)
      .add(this.props.tax)

    if (!this.props.total.equals(calculatedTotal)) {
      throw new Error('Total calculado não confere com o total armazenado')
    }

    // Data de vencimento deve ser maior ou igual à data de emissão
    if (this.props.dueDate < this.props.issueDate) {
      throw new Error('Data de vencimento deve ser posterior à data de emissão')
    }

    // Se paga, deve ter data de pagamento
    if (this.props.status === InvoiceStatus.PAID && !this.props.paidAt) {
      throw new Error('Fatura paga deve ter data de pagamento')
    }

    // Se cancelada, deve ter data de cancelamento
    if (this.props.status === InvoiceStatus.VOID && !this.props.cancelledAt) {
      throw new Error('Fatura cancelada deve ter data de cancelamento')
    }
  }
}
