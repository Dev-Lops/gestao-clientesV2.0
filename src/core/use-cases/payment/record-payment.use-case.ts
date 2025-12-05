import { Money } from '@/core/domain/invoice/value-objects/money.vo'
import {
  Payment,
  PaymentMethod,
} from '@/core/domain/payment/entities/payment.entity'
import { PaymentStatus } from '@/core/domain/payment/value-objects/payment-status.vo'
import { IPaymentRepository } from '@/core/ports/repositories/payment.repository.interface'
import { z } from 'zod'

export const RecordPaymentInputSchema = z.object({
  invoiceId: z.string().uuid(),
  orgId: z.string().uuid(),
  amount: z.number().positive(),
  method: z.enum(Object.values(PaymentMethod) as [string, ...string[]]),
  reference: z.string().optional(),
  notes: z.string().optional(),
})

export type RecordPaymentInput = z.infer<typeof RecordPaymentInputSchema>

export interface RecordPaymentOutput {
  paymentId: string
}

/**
 * Use Case: Registrar Pagamento
 * Responsável por registrar um novo pagamento de fatura
 */
export class RecordPaymentUseCase {
  constructor(private readonly paymentRepository: IPaymentRepository) {}

  async execute(input: RecordPaymentInput): Promise<RecordPaymentOutput> {
    const validated = RecordPaymentInputSchema.parse(input)

    const payment = Payment.create({
      id: crypto.randomUUID(),
      orgId: validated.orgId,
      invoiceId: validated.invoiceId,
      amount: new Money(validated.amount),
      method: validated.method as PaymentMethod,
      status: PaymentStatus.PENDING,
      reference: validated.reference,
      notes: validated.notes,
    })

    await this.paymentRepository.save(payment)

    return {
      paymentId: payment.id,
    }
  }
}
