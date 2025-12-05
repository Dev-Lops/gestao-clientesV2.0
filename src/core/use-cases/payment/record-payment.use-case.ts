import { randomUUID } from 'crypto'
import { z } from 'zod'

import {
  Payment,
  PaymentMethod,
  PaymentStatus,
} from '@/core/domain/payment/entities/payment.entity'
import { Money } from '@/core/domain/payment/value-objects/money.vo'
import { IPaymentRepository } from '@/core/ports/repositories/payment.repository.interface'

const dueDateSchema = z
  .union([z.date(), z.string()])
  .transform((value) => (value instanceof Date ? value : new Date(value)))

export const RecordPaymentInputSchema = z.object({
  id: z.string().uuid().optional(),
  orgId: z.string().uuid(),
  clientId: z.string().uuid(),
  amount: z.number().positive(),
  dueDate: dueDateSchema,
  description: z.string().nullable().optional(),
  method: z.nativeEnum(PaymentMethod).optional(),
  reference: z.string().nullable().optional(),
  status: z.nativeEnum(PaymentStatus).optional(),
})

export type RecordPaymentInput = z.infer<typeof RecordPaymentInputSchema>

export interface RecordPaymentOutput {
  paymentId: string
  status: PaymentStatus
}

export class RecordPaymentUseCase {
  constructor(private readonly repository: IPaymentRepository) {}

  async execute(input: RecordPaymentInput): Promise<RecordPaymentOutput> {
    const validated = RecordPaymentInputSchema.parse(input)

    const payment = Payment.create({
      id: validated.id ?? randomUUID(),
      orgId: validated.orgId,
      clientId: validated.clientId,
      amount: new Money(validated.amount),
      dueDate: validated.dueDate,
      description: validated.description ?? null,
      method: validated.method,
      reference: validated.reference ?? null,
      status: validated.status,
    })

    await this.repository.save(payment)

    return { paymentId: payment.id, status: payment.status }
  }
}
