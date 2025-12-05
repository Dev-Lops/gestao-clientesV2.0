import { Payment } from '@/core/domain/payment/entities/payment.entity'
import { IPaymentRepository } from '@/core/ports/repositories/payment.repository.interface'
import { z } from 'zod'

export const GetPaymentInputSchema = z.object({
  paymentId: z.string().uuid(),
  orgId: z.string().uuid(),
})

export type GetPaymentInput = z.infer<typeof GetPaymentInputSchema>

export interface GetPaymentOutput {
  payment: Payment
}

export class GetPaymentUseCase {
  constructor(private readonly paymentRepository: IPaymentRepository) {}

  async execute(input: GetPaymentInput): Promise<GetPaymentOutput> {
    const validated = GetPaymentInputSchema.parse(input)
    const payment = await this.paymentRepository.findById(validated.paymentId)

    if (!payment) {
      throw new Error('Pagamento não encontrado')
    }

    if (payment.orgId !== validated.orgId) {
      throw new Error('Pagamento não pertence a esta organização')
    }

    return { payment }
  }
}
