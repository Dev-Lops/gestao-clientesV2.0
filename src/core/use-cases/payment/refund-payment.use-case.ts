import { z } from 'zod'

import { Money } from '@/core/domain/payment/value-objects/money.vo'
import { IPaymentRepository } from '@/core/ports/repositories/payment.repository.interface'

export const RefundPaymentInputSchema = z.object({
  paymentId: z.string().uuid(),
  amount: z.number().positive().optional(),
})

export type RefundPaymentInput = z.infer<typeof RefundPaymentInputSchema>

export class RefundPaymentUseCase {
  constructor(private readonly repository: IPaymentRepository) {}

  async execute(input: RefundPaymentInput): Promise<void> {
    const validated = RefundPaymentInputSchema.parse(input)

    const payment = await this.repository.findById(validated.paymentId)
    if (!payment) {
      throw new Error('Pagamento não encontrado')
    }

    const refundAmount = validated.amount
      ? new Money(validated.amount)
      : undefined

    payment.refund(refundAmount)
    await this.repository.save(payment)
  }
}
