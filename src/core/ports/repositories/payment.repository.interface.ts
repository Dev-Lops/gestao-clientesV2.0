import { Payment } from '@/core/domain/payment/entities/payment.entity'

/**
 * Interface do Repository de Pagamentos
 * Define o contrato para persistência de pagamentos
 */

export interface IPaymentRepository {
  /**
   * Salva um pagamento (create ou update)
   */
  save(payment: Payment): Promise<void>

  /**
   * Busca um pagamento por ID
   */
  findById(id: string): Promise<Payment | null>

  /**
   * Busca pagamentos por invoiceId
   */
  findByInvoiceId(invoiceId: string): Promise<Payment[]>

  /**
   * Lista pagamentos de uma organização
   */
  findByOrgId(
    orgId: string,
    options?: {
      invoiceId?: string
      page?: number
      limit?: number
      status?: string[]
    }
  ): Promise<{ payments: Payment[]; total: number }>

  /**
   * Deleta um pagamento (soft delete)
   */
  delete(id: string): Promise<void>

  /**
   * Verifica se um pagamento existe
   */
  exists(id: string): Promise<boolean>
}
