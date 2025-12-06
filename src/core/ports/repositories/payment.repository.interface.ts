import { Payment } from '@/core/domain/payment/entities/payment.entity'

export interface IPaymentRepository {
  save(payment: Payment): Promise<void>
  findById(id: string): Promise<Payment | null>
}
