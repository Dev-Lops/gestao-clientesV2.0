import { Money } from '@/core/domain/invoice/value-objects/money.vo'
import {
  PaymentStatus,
  PaymentStatusLabels,
} from '@/core/domain/payment/value-objects/payment-status.vo'
import { describe, expect, it } from 'vitest'

describe('PaymentStatus Value Object', () => {
  describe('Enum Values', () => {
    it('should have all payment statuses', () => {
      expect(PaymentStatus.PENDING).toBe('PENDING')
      expect(PaymentStatus.PROCESSED).toBe('PROCESSED')
      expect(PaymentStatus.VERIFIED).toBe('VERIFIED')
      expect(PaymentStatus.FAILED).toBe('FAILED')
      expect(PaymentStatus.REFUNDED).toBe('REFUNDED')
    })
  })

  describe('Labels', () => {
    it('should have Portuguese labels for all statuses', () => {
      expect(PaymentStatusLabels[PaymentStatus.PENDING]).toBe('Pendente')
      expect(PaymentStatusLabels[PaymentStatus.PROCESSED]).toBe('Processado')
      expect(PaymentStatusLabels[PaymentStatus.VERIFIED]).toBe('Verificado')
      expect(PaymentStatusLabels[PaymentStatus.FAILED]).toBe('Falha')
      expect(PaymentStatusLabels[PaymentStatus.REFUNDED]).toBe('Reembolsado')
    })

    it('should have label for every status', () => {
      Object.values(PaymentStatus).forEach((status) => {
        expect(PaymentStatusLabels[status as PaymentStatus]).toBeDefined()
      })
    })
  })
})

describe('Money Value Object', () => {
  describe('Creation', () => {
    it('should create money with default currency BRL', () => {
      const money = new Money(100)
      expect(money.amount).toBe(100)
      expect(money.currency).toBe('BRL')
    })

    it('should create money with custom currency', () => {
      const money = new Money(50, 'USD')
      expect(money.amount).toBe(50)
      expect(money.currency).toBe('USD')
    })

    it('should round amount to 2 decimals', () => {
      const money = new Money(99.999)
      expect(money.amount).toBe(100)
    })

    it('should throw error for negative amount', () => {
      expect(() => new Money(-50)).toThrow()
    })

    it('should throw error for invalid currency', () => {
      expect(() => new Money(100, 'INVALID')).toThrow()
    })
  })

  describe('Operations', () => {
    it('should add money values', () => {
      const m1 = new Money(100)
      const m2 = new Money(50)
      const result = m1.add(m2)

      expect(result.amount).toBe(150)
      expect(result.currency).toBe('BRL')
    })

    it('should subtract money values', () => {
      const m1 = new Money(100)
      const m2 = new Money(30)
      const result = m1.subtract(m2)

      expect(result.amount).toBe(70)
    })

    it('should throw error on negative subtraction result', () => {
      const m1 = new Money(50)
      const m2 = new Money(100)

      expect(() => m1.subtract(m2)).toThrow()
    })

    it('should multiply money', () => {
      const money = new Money(100)
      const result = money.multiply(3)

      expect(result.amount).toBe(300)
    })

    it('should calculate percentage', () => {
      const money = new Money(100)
      const result = money.percentage(10)

      expect(result.amount).toBe(10)
    })

    it('should throw error on currency mismatch', () => {
      const m1 = new Money(100, 'BRL')
      const m2 = new Money(50, 'USD')

      expect(() => m1.add(m2)).toThrow()
    })
  })

  describe('Comparisons', () => {
    it('should compare money values', () => {
      const m1 = new Money(100)
      const m2 = new Money(100)
      const m3 = new Money(50)

      expect(m1.equals(m2)).toBe(true)
      expect(m1.equals(m3)).toBe(false)
    })

    it('should check if greater than', () => {
      const m1 = new Money(100)
      const m2 = new Money(50)

      expect(m1.isGreaterThan(m2)).toBe(true)
      expect(m2.isGreaterThan(m1)).toBe(false)
    })

    it('should check if less than', () => {
      const m1 = new Money(50)
      const m2 = new Money(100)

      expect(m1.isLessThan(m2)).toBe(true)
      expect(m2.isLessThan(m1)).toBe(false)
    })

    it('should check if zero', () => {
      const m1 = new Money(0)
      const m2 = new Money(100)

      expect(m1.isZero()).toBe(true)
      expect(m2.isZero()).toBe(false)
    })
  })

  describe('Formatting', () => {
    it('should format to string', () => {
      const money = new Money(1000, 'BRL')
      expect(money.format()).toBeDefined()
      expect(typeof money.format()).toBe('string')
    })

    it('should convert to number', () => {
      const money = new Money(1000, 'BRL')
      expect(money.toNumber()).toBe(1000)
    })

    it('should serialize to JSON', () => {
      const money = new Money(1000, 'BRL')
      const json = money.toJSON()

      expect(json.amount).toBe(1000)
      expect(json.currency).toBe('BRL')
    })

    it('should deserialize from JSON', () => {
      const money = Money.fromJSON({ amount: 500, currency: 'BRL' })

      expect(money.amount).toBe(500)
      expect(money.currency).toBe('BRL')
    })
  })
})
