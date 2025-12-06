import { Payment } from '@/core/domain/payment/entities/payment.entity'
import { IPaymentRepository } from '@/core/ports/repositories/payment.repository.interface'
import { z } from 'zod'

export const ListPaymentsInputSchema = z.object({
  invoiceId: z.string().uuid().optional(),
  orgId: z.string().uuid(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().optional().default(10),
})

export type ListPaymentsInput = z.infer<typeof ListPaymentsInputSchema>

export interface ListPaymentsOutput {
  payments: Payment[]
  total: number
}

export class ListPaymentsUseCase {
  constructor(private readonly paymentRepository: IPaymentRepository) {}

  async execute(input: ListPaymentsInput): Promise<ListPaymentsOutput> {
    const validated = ListPaymentsInputSchema.parse(input)

    const result = await this.paymentRepository.findByOrgId(validated.orgId, {
      invoiceId: validated.invoiceId,
      page: validated.page,
      limit: validated.limit,
    })

    return result
  }
}
