import { Money } from '@/core/domain/invoice/value-objects/money.vo'
import {
  Payment,
  PaymentMethod,
} from '@/core/domain/payment/entities/payment.entity'
import { PaymentStatus } from '@/core/domain/payment/value-objects/payment-status.vo'
import { IPaymentRepository } from '@/core/ports/repositories/payment.repository.interface'
import { GetPaymentUseCase } from '@/core/use-cases/payment/get-payment.use-case'
import { ListPaymentsUseCase } from '@/core/use-cases/payment/list-payments.use-case'
import { ProcessPaymentUseCase } from '@/core/use-cases/payment/process-payment.use-case'
import { RecordPaymentUseCase } from '@/core/use-cases/payment/record-payment.use-case'
import { RefundPaymentUseCase } from '@/core/use-cases/payment/refund-payment.use-case'
import { VerifyPaymentUseCase } from '@/core/use-cases/payment/verify-payment.use-case'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock Repository
const mockRepository: Partial<IPaymentRepository> = {
  save: vi.fn(),
  findById: vi.fn(),
  findByInvoiceId: vi.fn(),
  findByOrgId: vi.fn(),
  update: vi.fn(),
  list: vi.fn(),
}

describe('Payment Use Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('RecordPaymentUseCase', () => {
    it('should record a new payment', async () => {
      const useCase = new RecordPaymentUseCase(
        mockRepository as IPaymentRepository
      )

      const input = {
        invoiceId: '123e4567-e89b-12d3-a456-426614174000',
        orgId: '223e4567-e89b-12d3-a456-426614174000',
        amount: 1000,
        method: PaymentMethod.CREDIT_CARD,
        reference: 'REF-001',
        notes: 'Test payment',
      }

      const result = await useCase.execute(input)

      expect(result.paymentId).toBeDefined()
      expect(mockRepository.save).toHaveBeenCalled()
    })

    it('should validate input data', async () => {
      const useCase = new RecordPaymentUseCase(
        mockRepository as IPaymentRepository
      )

      const invalidInput = {
        invoiceId: 'invalid-id',
        orgId: '223e4567-e89b-12d3-a456-426614174000',
        amount: -100, // negative amount
        method: 'INVALID_METHOD',
      }

      await expect(useCase.execute(invalidInput as any)).rejects.toThrow()
    })

    it('should accept optional reference and notes', async () => {
      const useCase = new RecordPaymentUseCase(
        mockRepository as IPaymentRepository
      )

      const input = {
        invoiceId: '123e4567-e89b-12d3-a456-426614174000',
        orgId: '223e4567-e89b-12d3-a456-426614174000',
        amount: 500,
        method: PaymentMethod.PIX,
      }

      const result = await useCase.execute(input)

      expect(result.paymentId).toBeDefined()
    })
  })

  describe('ProcessPaymentUseCase', () => {
    it('should process a pending payment', async () => {
      const payment = Payment.create({
        id: '333e4567-e89b-12d3-a456-426614174000',
        orgId: '223e4567-e89b-12d3-a456-426614174000',
        invoiceId: '123e4567-e89b-12d3-a456-426614174000',
        amount: new Money(1000),
        method: PaymentMethod.BANK_TRANSFER,
        status: PaymentStatus.PENDING,
      })

      vi.mocked(mockRepository.findById).mockResolvedValue(payment)
      vi.mocked(mockRepository.update).mockResolvedValue(undefined)

      const useCase = new ProcessPaymentUseCase(
        mockRepository as IPaymentRepository
      )

      const input = {
        paymentId: payment.id,
        orgId: '223e4567-e89b-12d3-a456-426614174000',
        reference: 'PROC-001',
      }

      const result = await useCase.execute(input)

      expect(result.processed).toBe(true)
    })

    it('should throw error if payment not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null)

      const useCase = new ProcessPaymentUseCase(
        mockRepository as IPaymentRepository
      )

      await expect(
        useCase.execute({
          paymentId: 'nonexistent-id',
          orgId: '223e4567-e89b-12d3-a456-426614174000',
          reference: 'REF-001',
        })
      ).rejects.toThrow()
    })
  })

  describe('VerifyPaymentUseCase', () => {
    it('should verify a processed payment', async () => {
      const payment = Payment.create({
        id: '333e4567-e89b-12d3-a456-426614174000',
        orgId: '223e4567-e89b-12d3-a456-426614174000',
        invoiceId: '123e4567-e89b-12d3-a456-426614174000',
        amount: new Money(1000),
        method: PaymentMethod.CREDIT_CARD,
        status: PaymentStatus.PENDING,
        reference: 'REF-001',
      })

      payment.process('REF-001')

      vi.mocked(mockRepository.findById).mockResolvedValue(payment)

      const useCase = new VerifyPaymentUseCase(
        mockRepository as IPaymentRepository
      )

      const result = await useCase.execute({
        paymentId: payment.id,
        orgId: '223e4567-e89b-12d3-a456-426614174000',
      })

      expect(result.verified).toBe(true)
    })
  })

  describe('RefundPaymentUseCase', () => {
    it('should refund a verified payment', async () => {
      const payment = Payment.create({
        id: '333e4567-e89b-12d3-a456-426614174000',
        orgId: '223e4567-e89b-12d3-a456-426614174000',
        invoiceId: '123e4567-e89b-12d3-a456-426614174000',
        amount: new Money(1000),
        method: PaymentMethod.DEBIT_CARD,
        status: PaymentStatus.PENDING,
        reference: 'REF-001',
      })

      payment.process('REF-001')
      payment.verify()

      vi.mocked(mockRepository.findById).mockResolvedValue(payment)

      const useCase = new RefundPaymentUseCase(
        mockRepository as IPaymentRepository
      )

      const result = await useCase.execute({
        paymentId: payment.id,
        orgId: '223e4567-e89b-12d3-a456-426614174000',
        amount: 500,
      })

      expect(result.refunded).toBe(true)
    })

    it('should allow full refund without amount', async () => {
      const payment = Payment.create({
        id: '333e4567-e89b-12d3-a456-426614174000',
        orgId: '223e4567-e89b-12d3-a456-426614174000',
        invoiceId: '123e4567-e89b-12d3-a456-426614174000',
        amount: new Money(1000),
        method: PaymentMethod.BOLETO,
        status: PaymentStatus.PENDING,
        reference: 'REF-001',
      })

      payment.process('REF-001')
      payment.verify()

      vi.mocked(mockRepository.findById).mockResolvedValue(payment)

      const useCase = new RefundPaymentUseCase(
        mockRepository as IPaymentRepository
      )

      const result = await useCase.execute({
        paymentId: payment.id,
        orgId: '223e4567-e89b-12d3-a456-426614174000',
      })

      expect(result.refunded).toBe(true)
    })
  })

  describe('GetPaymentUseCase', () => {
    it('should retrieve payment by id', async () => {
      const payment = Payment.create({
        id: '333e4567-e89b-12d3-a456-426614174000',
        orgId: '223e4567-e89b-12d3-a456-426614174000',
        invoiceId: '123e4567-e89b-12d3-a456-426614174000',
        amount: new Money(1000),
        method: PaymentMethod.CREDIT_CARD,
        status: PaymentStatus.PENDING,
      })

      vi.mocked(mockRepository.findById).mockResolvedValue(payment)

      const useCase = new GetPaymentUseCase(
        mockRepository as IPaymentRepository
      )

      const result = await useCase.execute({
        paymentId: payment.id,
        orgId: '223e4567-e89b-12d3-a456-426614174000',
      })

      expect(result.payment.id).toBe(payment.id)
      expect(result.payment.amount.amount).toBe(1000)
    })

    it('should throw error if payment not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null)

      const useCase = new GetPaymentUseCase(
        mockRepository as IPaymentRepository
      )

      await expect(
        useCase.execute({
          paymentId: 'nonexistent-id',
          orgId: '223e4567-e89b-12d3-a456-426614174000',
        })
      ).rejects.toThrow()
    })
  })

  describe('ListPaymentsUseCase', () => {
    it('should list payments with pagination', async () => {
      const payments = [
        Payment.create({
          id: '333e4567-e89b-12d3-a456-426614174000',
          orgId: '223e4567-e89b-12d3-a456-426614174000',
          invoiceId: '123e4567-e89b-12d3-a456-426614174000',
          amount: new Money(1000),
          method: PaymentMethod.CREDIT_CARD,
          status: PaymentStatus.PENDING,
        }),
      ]

      vi.mocked(mockRepository.findByOrgId).mockResolvedValue({
        payments,
        total: 1,
      })

      const useCase = new ListPaymentsUseCase(
        mockRepository as IPaymentRepository
      )

      const result = await useCase.execute({
        orgId: '223e4567-e89b-12d3-a456-426614174000',
        page: 1,
        limit: 10,
      })

      expect(result.payments).toHaveLength(1)
      expect(result.total).toBe(1)
    })

    it('should filter payments by invoice id', async () => {
      const payments = [
        Payment.create({
          id: '333e4567-e89b-12d3-a456-426614174000',
          orgId: '223e4567-e89b-12d3-a456-426614174000',
          invoiceId: '123e4567-e89b-12d3-a456-426614174000',
          amount: new Money(500),
          method: PaymentMethod.PIX,
          status: PaymentStatus.PENDING,
        }),
      ]

      vi.mocked(mockRepository.findByOrgId).mockResolvedValue({
        payments,
        total: 1,
      })

      const useCase = new ListPaymentsUseCase(
        mockRepository as IPaymentRepository
      )

      const result = await useCase.execute({
        orgId: '223e4567-e89b-12d3-a456-426614174000',
        invoiceId: '123e4567-e89b-12d3-a456-426614174000',
        page: 1,
        limit: 10,
      })

      expect(result.payments).toHaveLength(1)
    })
  })
})
