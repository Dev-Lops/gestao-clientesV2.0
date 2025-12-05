import { IInvoiceRepository } from '@/ports/repositories/invoice.repository.interface'
import { z } from 'zod'

/**
 * Input Schema para cancelar fatura
 */
export const CancelInvoiceInputSchema = z.object({
  invoiceId: z.string().uuid(),
  orgId: z.string().uuid(),
})

export type CancelInvoiceInput = z.infer<typeof CancelInvoiceInputSchema>

/**
 * Output do use case
 */
export interface CancelInvoiceOutput {
  invoiceId: string
}

/**
 * Use Case: Cancelar Fatura
 * Responsável por cancelar uma fatura
 */
export class CancelInvoiceUseCase {
  constructor(private readonly invoiceRepository: IInvoiceRepository) {}

  async execute(input: CancelInvoiceInput): Promise<CancelInvoiceOutput> {
    // 1. Validar input
    const validated = CancelInvoiceInputSchema.parse(input)

    // 2. Buscar fatura
    const invoice = await this.invoiceRepository.findById(validated.invoiceId)

    if (!invoice) {
      throw new Error('Fatura não encontrada')
    }

    // 3. Validar se pertence à org
    if (invoice.orgId !== validated.orgId) {
      throw new Error('Fatura não pertence a esta organização')
    }

    // 4. Validar se pode ser cancelada
    if (!invoice.canBeCancelled()) {
      throw new Error('Fatura não pode ser cancelada')
    }

    // 5. Cancelar fatura
    invoice.cancel()

    // 6. Persistir alterações
    await this.invoiceRepository.save(invoice)

    // 7. Retornar resultado
    return {
      invoiceId: invoice.id,
    }
  }
}
