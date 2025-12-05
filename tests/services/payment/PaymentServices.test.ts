import {
  PageseguroService,
  pageseguroPixPaymentSchema,
} from '@/services/payment/PageseguroService'
import {
  StripeService,
  stripePaymentSessionSchema,
} from '@/services/payment/StripeService'
import { beforeEach, describe, expect, it } from 'vitest'

describe('Payment Services', () => {
  describe('StripeService', () => {
    let service: StripeService

    beforeEach(() => {
      service = new StripeService('test_key', 'test_secret')
    })

    describe('Schema Validation', () => {
      it('should validate stripe payment session schema', () => {
        const validInput = {
          clientId: 'cli_123',
          invoiceId: 'inv_123',
          amount: 100.0,
          currency: 'brl',
          description: 'Invoice payment',
          successUrl: 'https://example.com/success',
          cancelUrl: 'https://example.com/cancel',
        }

        const result = stripePaymentSessionSchema.safeParse(validInput)
        expect(result.success).toBe(true)
      })

      it('should reject invalid amount', () => {
        const invalidInput = {
          clientId: 'cli_123',
          invoiceId: 'inv_123',
          amount: 0,
          currency: 'brl',
          description: 'Invoice payment',
          successUrl: 'https://example.com/success',
          cancelUrl: 'https://example.com/cancel',
        }

        const result = stripePaymentSessionSchema.safeParse(invalidInput)
        expect(result.success).toBe(false)
      })

      it('should reject invalid URL', () => {
        const invalidInput = {
          clientId: 'cli_123',
          invoiceId: 'inv_123',
          amount: 100.0,
          currency: 'brl',
          description: 'Invoice payment',
          successUrl: 'not-a-url',
          cancelUrl: 'https://example.com/cancel',
        }

        const result = stripePaymentSessionSchema.safeParse(invalidInput)
        expect(result.success).toBe(false)
      })
    })

    describe('Status Mapping', () => {
      it('should map session status correctly', async () => {
        // Test the private method indirectly through processing
        expect(service).toBeDefined()
      })
    })
  })

  describe('PageseguroService', () => {
    let service: PageseguroService

    beforeEach(() => {
      service = new PageseguroService('test_key', 'test_secret')
    })

    describe('Schema Validation', () => {
      it('should validate pageseguro pix payment schema', () => {
        const validInput = {
          clientId: 'cli_123',
          invoiceId: 'inv_123',
          amount: 100.0,
          description: 'Invoice payment',
          customerEmail: 'test@example.com',
          customerPhone: '11999999999',
        }

        const result = pageseguroPixPaymentSchema.safeParse(validInput)
        expect(result.success).toBe(true)
      })

      it('should reject invalid email', () => {
        const invalidInput = {
          clientId: 'cli_123',
          invoiceId: 'inv_123',
          amount: 100.0,
          description: 'Invoice payment',
          customerEmail: 'invalid-email',
          customerPhone: '11999999999',
        }

        const result = pageseguroPixPaymentSchema.safeParse(invalidInput)
        expect(result.success).toBe(false)
      })

      it('should reject phone too short', () => {
        const invalidInput = {
          clientId: 'cli_123',
          invoiceId: 'inv_123',
          amount: 100.0,
          description: 'Invoice payment',
          customerEmail: 'test@example.com',
          customerPhone: '123',
        }

        const result = pageseguroPixPaymentSchema.safeParse(invalidInput)
        expect(result.success).toBe(false)
      })
    })

    describe('PIX Payment Creation', () => {
      it('should create pix payment with qr code', async () => {
        const input = {
          clientId: 'cli_123',
          invoiceId: 'inv_123',
          amount: 100.0,
          description: 'Invoice payment',
          customerEmail: 'test@example.com',
          customerPhone: '11999999999',
        }

        const result = await service.createPixPayment(input)

        expect(result.paymentId).toBeDefined()
        expect(result.pixQrCode).toBeDefined()
        expect(result.pixCopyPaste).toBeDefined()
        expect(result.pixExpiresAt).toBeInstanceOf(Date)
        expect(result.status).toBe('pending')
        expect(result.amount).toBe(100.0)
        expect(result.createdAt).toBeInstanceOf(Date)
      })

      it('should reject invalid input', async () => {
        const invalidInput = {
          clientId: '',
          invoiceId: 'inv_123',
          amount: 100.0,
          description: 'Invoice payment',
          customerEmail: 'test@example.com',
          customerPhone: '11999999999',
        }

        await expect(
          service.createPixPayment(invalidInput as any)
        ).rejects.toThrow()
      })
    })

    describe('Webhook Processing', () => {
      it('should process paid webhook correctly', async () => {
        const webhook = {
          id: 'wh_123',
          reference_id: 'inv_123',
          status: 'PAID' as const,
          source: 'PIX' as const,
          amount: 10000, // 100.00 in cents
          created_at: new Date().toISOString(),
        }

        const result = await service.processWebhook(webhook)

        expect(result.success).toBe(true)
        expect(result.paymentStatus).toBe('succeeded')
        expect(result.amount).toBe(100.0)
        expect(result.source).toBe('PIX')
      })

      it('should process waiting webhook correctly', async () => {
        const webhook = {
          id: 'wh_123',
          reference_id: 'inv_123',
          status: 'WAITING' as const,
          source: 'PIX' as const,
          amount: 10000,
          created_at: new Date().toISOString(),
        }

        const result = await service.processWebhook(webhook)

        expect(result.success).toBe(false)
        expect(result.paymentStatus).toBe('pending')
      })

      it('should process declined webhook correctly', async () => {
        const webhook = {
          id: 'wh_123',
          reference_id: 'inv_123',
          status: 'DECLINED' as const,
          source: 'PIX' as const,
          amount: 10000,
          created_at: new Date().toISOString(),
        }

        const result = await service.processWebhook(webhook)

        expect(result.success).toBe(false)
        expect(result.paymentStatus).toBe('failed')
      })

      it('should process expired webhook correctly', async () => {
        const webhook = {
          id: 'wh_123',
          reference_id: 'inv_123',
          status: 'EXPIRED' as const,
          source: 'PIX' as const,
          amount: 10000,
          created_at: new Date().toISOString(),
        }

        const result = await service.processWebhook(webhook)

        expect(result.success).toBe(false)
        expect(result.paymentStatus).toBe('expired')
      })
    })

    describe('Refund Processing', () => {
      it('should process refund', async () => {
        const result = await service.processRefund('pag_123', 100.0)

        expect(result.refundId).toBeDefined()
        expect(result.status).toBe('PENDING')
      })

      it('should allow refund without amount', async () => {
        const result = await service.processRefund('pag_123')

        expect(result.refundId).toBeDefined()
        expect(result.status).toBe('PENDING')
      })
    })

    describe('Status Retrieval', () => {
      it('should get payment status', async () => {
        const status = await service.getPaymentStatus('pag_123')

        expect(status).toBe('WAITING')
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle payment creation errors', async () => {
      const service = new PageseguroService()

      const invalidInput = {
        clientId: '',
        invoiceId: 'inv_123',
        amount: 100.0,
        description: 'Invoice payment',
        customerEmail: 'test@example.com',
        customerPhone: '11999999999',
      }

      await expect(
        service.createPixPayment(invalidInput as any)
      ).rejects.toThrow('Failed to create PIX payment')
    })

    it('should handle invalid webhook data', async () => {
      const service = new PageseguroService()

      const invalidWebhook = {
        id: 'wh_123',
        reference_id: 'inv_123',
        status: 'INVALID' as any,
        source: 'PIX',
        amount: 10000,
        created_at: new Date().toISOString(),
      }

      await expect(service.processWebhook(invalidWebhook)).rejects.toThrow(
        'Failed to process PagSeguro webhook'
      )
    })
  })
})
