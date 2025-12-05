import { Invoice } from '@/core/domain/invoice/entities/invoice.entity'
import { Money } from '@/core/domain/invoice/value-objects/money.vo'
import { IInvoiceRepository } from '@/ports/repositories/invoice.repository.interface'
import { z } from 'zod'

/**
 * Input Schema para criar fatura
 */
export const CreateInvoiceInputSchema = z.object({
  orgId: z.string().uuid(),
  clientId: z.string().uuid(),
  number: z.string().min(1),
  issueDate: z.date(),
  dueDate: z.date(),
  subtotal: z.number().positive(),
  discount: z.number().min(0).optional(),
  tax: z.number().min(0).optional(),
  currency: z.string().length(3).optional().default('BRL'),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  createdBy: z.string().uuid().optional(),
})

export type CreateInvoiceInput = z.infer<typeof CreateInvoiceInputSchema>

/**
 * Output do use case
 */
export interface CreateInvoiceOutput {
  invoiceId: string
}

/**
 * Use Case: Criar Fatura
 * Responsável por criar uma nova fatura
 */
export class CreateInvoiceUseCase {
  constructor(private readonly invoiceRepository: IInvoiceRepository) {}

  async execute(input: CreateInvoiceInput): Promise<CreateInvoiceOutput> {
    // 1. Validar input
    const validated = CreateInvoiceInputSchema.parse(input)

    // 2. Verificar se número já existe
    const existingInvoice = await this.invoiceRepository.findByNumber(
      validated.number,
      validated.orgId
    )

    if (existingInvoice) {
      throw new Error(`Fatura com número ${validated.number} já existe`)
    }

    // 3. Criar value objects
    const subtotal = new Money(validated.subtotal, validated.currency)
    const discount = validated.discount
      ? new Money(validated.discount, validated.currency)
      : undefined
    const tax = validated.tax
      ? new Money(validated.tax, validated.currency)
      : undefined

    // 4. Criar entidade
    const invoice = Invoice.create({
      orgId: validated.orgId,
      clientId: validated.clientId,
      number: validated.number,
      issueDate: validated.issueDate,
      dueDate: validated.dueDate,
      subtotal,
      discount,
      tax,
      notes: validated.notes,
      internalNotes: validated.internalNotes,
      createdBy: validated.createdBy,
    })

    // 5. Persistir
    await this.invoiceRepository.save(invoice)

    // 6. Retornar resultado
    return {
      invoiceId: invoice.id,
    }
  }
}
