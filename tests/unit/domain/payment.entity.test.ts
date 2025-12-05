import { Money } from '@/core/domain/invoice/value-objects/money.vo'
import {
  Payment,
  PaymentMethod,
} from '@/core/domain/payment/entities/payment.entity'
import { PaymentStatus } from '@/core/domain/payment/value-objects/payment-status.vo'
import { beforeEach, describe, expect, it } from 'vitest'

describe('Payment Entity', () => {
  let payment: Payment

  beforeEach(() => {
    payment = Payment.create({
      id: crypto.randomUUID(),
      orgId: crypto.randomUUID(),
      invoiceId: crypto.randomUUID(),
      amount: new Money(1000),
      status: PaymentStatus.PENDING,
      method: PaymentMethod.PIX,
    })
  })

  describe('Creation', () => {
    it('should create a new payment', () => {
      expect(payment.id).toBeDefined()
      expect(payment.status).toBe(PaymentStatus.PENDING)
      expect(payment.amount.amount).toBe(1000)
    })

    it('should create with optional fields', () => {
      const paymentWithNote = Payment.create({
        id: crypto.randomUUID(),
        orgId: crypto.randomUUID(),
        invoiceId: crypto.randomUUID(),
        amount: new Money(500),
        status: PaymentStatus.PENDING,
        method: PaymentMethod.CREDIT_CARD,
        reference: 'REF-123',
        notes: 'Test note',
      })

      expect(paymentWithNote.reference).toBe('REF-123')
      expect(paymentWithNote.notes).toBe('Test note')
    })

    it('should fail with invalid amount', () => {
      expect(() => {
        Payment.create({
          id: crypto.randomUUID(),
          orgId: crypto.randomUUID(),
          invoiceId: crypto.randomUUID(),
          amount: new Money(-100),
          status: PaymentStatus.PENDING,
          method: PaymentMethod.PIX,
        })
      }).toThrow()
    })
  })

  describe('Process Payment', () => {
    it('should process payment', () => {
      payment.process('REF-001')

      expect(payment.status).toBe(PaymentStatus.PROCESSED)
      expect(payment.reference).toBe('REF-001')
      expect(payment.processedAt).toBeDefined()
    })

    it('should throw error when processing verified payment', () => {
      payment.process('REF-001')
      payment.verify()

      expect(() => payment.process('REF-002')).toThrow()
    })
  })

  describe('Verify Payment', () => {
    it('should verify processed payment', () => {
      payment.process('REF-001')
      payment.verify()

      expect(payment.status).toBe(PaymentStatus.VERIFIED)
      expect(payment.verifiedAt).toBeDefined()
      expect(payment.isVerified).toBe(true)
    })

    it('should throw error when verifying pending payment', () => {
      expect(() => payment.verify()).toThrow('Pagamento deve estar processado')
    })

    it('should throw error when verifying twice', () => {
      payment.process('REF-001')
      payment.verify()

      expect(() => payment.verify()).toThrow('Pagamento já foi verificado')
    })
  })

  describe('Fail Payment', () => {
    it('should fail payment', () => {
      payment.fail('Insufficient funds')

      expect(payment.status).toBe(PaymentStatus.FAILED)
      expect(payment.failureReason).toBe('Insufficient funds')
      expect(payment.isFailed).toBe(true)
    })

    it('should throw error when failing verified payment', () => {
      payment.process('REF-001')
      payment.verify()

      expect(() => payment.fail('Late refusal')).toThrow()
    })
  })

  describe('Refund Payment', () => {
    it('should refund full payment', () => {
      payment.process('REF-001')
      payment.verify()
      payment.refund()

      expect(payment.status).toBe(PaymentStatus.REFUNDED)
      expect(payment.refundedAt).toBeDefined()
      expect(payment.refundedAmount?.amount).toBe(1000)
      expect(payment.isRefunded).toBe(true)
    })

    it('should refund partial payment', () => {
      payment.process('REF-001')
      payment.verify()
      payment.refund(new Money(500))

      expect(payment.status).toBe(PaymentStatus.REFUNDED)
      expect(payment.refundedAmount?.amount).toBe(500)
    })

    it('should throw error when refunding unverified payment', () => {
      expect(() => payment.refund()).toThrow('Apenas pagamentos verificados')
    })

    it('should throw error when refunding twice', () => {
      payment.process('REF-001')
      payment.verify()
      payment.refund()

      expect(() => payment.refund()).toThrow('Pagamento já foi reembolsado')
    })

    it('should throw error when refund exceeds payment', () => {
      payment.process('REF-001')
      payment.verify()

      expect(() => payment.refund(new Money(2000))).toThrow(
        'Valor do reembolso não pode exceder'
      )
    })
  })

  describe('Add Note', () => {
    it('should add note to payment', () => {
      payment.addNote('Payment successfully processed')

      expect(payment.notes).toBe('Payment successfully processed')
    })

    it('should throw error with empty note', () => {
      expect(() => payment.addNote('')).toThrow('Nota não pode ser vazia')
    })
  })

  describe('Payment Methods', () => {
    it('should support all payment methods', () => {
      const methods = [
        PaymentMethod.CREDIT_CARD,
        PaymentMethod.DEBIT_CARD,
        PaymentMethod.BANK_TRANSFER,
        PaymentMethod.PIX,
        PaymentMethod.BOLETO,
        PaymentMethod.CHECK,
        PaymentMethod.CASH,
        PaymentMethod.OTHER,
      ]

      methods.forEach((method) => {
        const p = Payment.create({
          id: crypto.randomUUID(),
          orgId: crypto.randomUUID(),
          invoiceId: crypto.randomUUID(),
          amount: new Money(100),
          status: PaymentStatus.PENDING,
          method,
        })

        expect(p.method).toBe(method)
      })
    })
  })

  describe('Getters', () => {
    it('should return all properties', () => {
      expect(payment.id).toBeDefined()
      expect(payment.orgId).toBeDefined()
      expect(payment.invoiceId).toBeDefined()
      expect(payment.amount).toBeDefined()
      expect(payment.status).toBe(PaymentStatus.PENDING)
      expect(payment.method).toBe(PaymentMethod.PIX)
      expect(payment.createdAt).toBeDefined()
      expect(payment.updatedAt).toBeDefined()
    })

    it('should return null for empty optional fields', () => {
      expect(payment.reference).toBeNull()
      expect(payment.processedAt).toBeNull()
      expect(payment.failureReason).toBeNull()
    })
  })

  describe('Serialization', () => {
    it('should serialize to JSON', () => {
      const json = payment.toJSON()

      expect(json.id).toBe(payment.id)
      expect(json.status).toBe(payment.status)
      expect(json.amount).toEqual(payment.amount)
    })
  })

  describe('State Validation', () => {
    it('should validate canBeRefunded', () => {
      expect(payment.canBeRefunded()).toBe(false)

      payment.process('REF-001')
      expect(payment.canBeRefunded()).toBe(false)

      payment.verify()
      expect(payment.canBeRefunded()).toBe(true)

      payment.refund()
      expect(payment.canBeRefunded()).toBe(false)
    })
  })
})
