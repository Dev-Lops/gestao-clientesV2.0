import { IInvoiceRepository } from '@/ports/repositories/invoice.repository.interface'
import { z } from 'zod'

/**
 * Input Schema para marcar fatura como paga
 */
export const PayInvoiceInputSchema = z.object({
  invoiceId: z.string().uuid(),
  orgId: z.string().uuid(),
  paidAt: z.date().optional(),
})

export type PayInvoiceInput = z.infer<typeof PayInvoiceInputSchema>

/**
 * Output do use case
 */
export interface PayInvoiceOutput {
  invoiceId: string
  paidAt: Date
}

/**
 * Use Case: Marcar Fatura como Paga
 * Responsável por registrar o pagamento de uma fatura
 */
export class PayInvoiceUseCase {
  constructor(private readonly invoiceRepository: IInvoiceRepository) {}

  async execute(input: PayInvoiceInput): Promise<PayInvoiceOutput> {
    // 1. Validar input
    const validated = PayInvoiceInputSchema.parse(input)

    // 2. Buscar fatura
    const invoice = await this.invoiceRepository.findById(validated.invoiceId)

    if (!invoice) {
      throw new Error('Fatura não encontrada')
    }

    // 3. Validar se pertence à org
    if (invoice.orgId !== validated.orgId) {
      throw new Error('Fatura não pertence a esta organização')
    }

    // 4. Marcar como paga
    const paidAt = validated.paidAt ?? new Date()
    invoice.markAsPaid(paidAt)

    // 5. Persistir alterações
    await this.invoiceRepository.save(invoice)

    // 6. Retornar resultado
    return {
      invoiceId: invoice.id,
      paidAt: invoice.paidAt!,
    }
  }
}
