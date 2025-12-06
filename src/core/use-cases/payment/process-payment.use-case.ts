import { z } from 'zod'

import { IPaymentRepository } from '@/core/ports/repositories/payment.repository.interface'

export const ProcessPaymentInputSchema = z.object({
  paymentId: z.string().uuid(),
  reference: z.string().min(1),
})

export type ProcessPaymentInput = z.infer<typeof ProcessPaymentInputSchema>

export class ProcessPaymentUseCase {
  constructor(private readonly repository: IPaymentRepository) {}

  async execute(input: ProcessPaymentInput): Promise<void> {
    const validated = ProcessPaymentInputSchema.parse(input)

    const payment = await this.repository.findById(validated.paymentId)
    if (!payment) {
      throw new Error('Pagamento não encontrado')
    }

    payment.process(validated.reference)
    await this.repository.save(payment)
  }
}
