import { IPaymentRepository } from '@/core/ports/repositories/payment.repository.interface'
import { z } from 'zod'

export const VerifyPaymentInputSchema = z.object({
  paymentId: z.string().uuid(),
  orgId: z.string().uuid(),
})

export type VerifyPaymentInput = z.infer<typeof VerifyPaymentInputSchema>

export interface VerifyPaymentOutput {
  verified: boolean
}

export class VerifyPaymentUseCase {
  constructor(private readonly paymentRepository: IPaymentRepository) {}

  async execute(input: VerifyPaymentInput): Promise<VerifyPaymentOutput> {
    const validated = VerifyPaymentInputSchema.parse(input)
    const payment = await this.paymentRepository.findById(validated.paymentId)

    if (!payment) {
      throw new Error('Pagamento não encontrado')
    }

    if (payment.orgId !== validated.orgId) {
      throw new Error('Pagamento não pertence a esta organização')
    }

    payment.verify()
    await this.paymentRepository.save(payment)

    return { verified: true }
  }
}
