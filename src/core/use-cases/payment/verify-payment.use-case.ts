import { z } from 'zod'

import { IPaymentRepository } from '@/core/ports/repositories/payment.repository.interface'

export const VerifyPaymentInputSchema = z.object({
  paymentId: z.string().uuid(),
})

export type VerifyPaymentInput = z.infer<typeof VerifyPaymentInputSchema>

export class VerifyPaymentUseCase {
  constructor(private readonly repository: IPaymentRepository) {}

  async execute(input: VerifyPaymentInput): Promise<void> {
    const validated = VerifyPaymentInputSchema.parse(input)

    const payment = await this.repository.findById(validated.paymentId)
    if (!payment) {
      throw new Error('Pagamento não encontrado')
    }

    payment.verify()
    await this.repository.save(payment)
  }
}
