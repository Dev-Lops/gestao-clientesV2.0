import { Money } from '@/core/domain/invoice/value-objects/money.vo'
import { IPaymentRepository } from '@/core/ports/repositories/payment.repository.interface'
import { z } from 'zod'

export const RefundPaymentInputSchema = z.object({
  paymentId: z.string().uuid(),
  orgId: z.string().uuid(),
  amount: z.number().positive().optional(),
})

export type RefundPaymentInput = z.infer<typeof RefundPaymentInputSchema>

export interface RefundPaymentOutput {
  refunded: boolean
}

export class RefundPaymentUseCase {
  constructor(private readonly paymentRepository: IPaymentRepository) {}

  async execute(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const validated = RefundPaymentInputSchema.parse(input)
    const payment = await this.paymentRepository.findById(validated.paymentId)

    if (!payment) {
      throw new Error('Pagamento não encontrado')
    }

    if (payment.orgId !== validated.orgId) {
      throw new Error('Pagamento não pertence a esta organização')
    }

    const refundAmount = validated.amount
      ? new Money(validated.amount)
      : undefined
    payment.refund(refundAmount)
    await this.paymentRepository.save(payment)

    return { refunded: true }
  }
}
