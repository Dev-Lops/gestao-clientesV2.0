import { Invoice } from '@/domain/invoice/entities/invoice.entity'
import { InvoiceStatus } from '@/domain/invoice/value-objects/invoice-status.vo'

/**
 * Interface do Repository de Invoices
 * Define o contrato para persistência de faturas
 */

export interface IInvoiceRepository {
  /**
   * Salva uma fatura (create ou update)
   */
  save(invoice: Invoice): Promise<void>

  /**
   * Busca uma fatura por ID
   */
  findById(id: string): Promise<Invoice | null>

  /**
   * Busca uma fatura por número
   */
  findByNumber(number: string, orgId: string): Promise<Invoice | null>

  /**
   * Lista faturas de uma organização
   */
  findByOrgId(
    orgId: string,
    options?: {
      page?: number
      limit?: number
      status?: InvoiceStatus[]
      clientId?: string
      startDate?: Date
      endDate?: Date
    }
  ): Promise<{ invoices: Invoice[]; total: number }>

  /**
   * Lista faturas de um cliente
   */
  findByClientId(
    clientId: string,
    options?: {
      page?: number
      limit?: number
      status?: InvoiceStatus[]
    }
  ): Promise<{ invoices: Invoice[]; total: number }>

  /**
   * Busca faturas vencidas
   */
  findOverdue(orgId: string): Promise<Invoice[]>

  /**
   * Deleta uma fatura (soft delete)
   */
  delete(id: string): Promise<void>

  /**
   * Verifica se uma fatura existe
   */
  exists(id: string): Promise<boolean>

  /**
   * Verifica se número já existe
   */
  existsByNumber(number: string, orgId: string): Promise<boolean>
}
