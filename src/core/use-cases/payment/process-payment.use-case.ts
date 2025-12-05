import { IPaymentRepository } from '@/core/ports/repositories/payment.repository.interface'
import { z } from 'zod'

export const ProcessPaymentInputSchema = z.object({
  paymentId: z.string().uuid(),
  orgId: z.string().uuid(),
  reference: z.string().min(1),
})

export type ProcessPaymentInput = z.infer<typeof ProcessPaymentInputSchema>

export interface ProcessPaymentOutput {
  processed: boolean
}

export class ProcessPaymentUseCase {
  constructor(private readonly paymentRepository: IPaymentRepository) {}

  async execute(input: ProcessPaymentInput): Promise<ProcessPaymentOutput> {
    const validated = ProcessPaymentInputSchema.parse(input)
    const payment = await this.paymentRepository.findById(validated.paymentId)

    if (!payment) {
      throw new Error('Pagamento não encontrado')
    }

    if (payment.orgId !== validated.orgId) {
      throw new Error('Pagamento não pertence a esta organização')
    }

    payment.process(validated.reference)
    await this.paymentRepository.save(payment)

    return { processed: true }
  }
}
