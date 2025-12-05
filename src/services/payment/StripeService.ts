import Stripe from 'stripe'
import { z } from 'zod'

/**
 * Schema de validação para criação de sessão de pagamento Stripe
 */
export const stripePaymentSessionSchema = z.object({
  clientId: z.string().min(1),
  invoiceId: z.string().min(1),
  amount: z.number().min(0.01),
  currency: z
    .string()
    .default('brl')
    .transform((val) => val.toUpperCase()),
  description: z.string().min(1),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  metadata: z.record(z.string()).optional(),
})

export type StripePaymentSessionInput = z.infer<
  typeof stripePaymentSessionSchema
>

/**
 * Schema para webhook de pagamento Stripe
 */
export const stripeWebhookSchema = z.object({
  id: z.string(),
  type: z.enum([
    'checkout.session.completed',
    'checkout.session.async_payment_succeeded',
    'checkout.session.async_payment_failed',
    'charge.refunded',
  ]),
  data: z.object({
    object: z.object({
      id: z.string(),
      payment_status: z.string(),
      customer_email: z.string().optional(),
      metadata: z.record(z.string()).optional(),
    }),
  }),
})

export type StripeWebhookEvent = z.infer<typeof stripeWebhookSchema>

/**
 * Response de sessão de pagamento criada
 */
export interface StripePaymentSession {
  sessionId: string
  clientSecret?: string
  url?: string
  status: 'pending' | 'processing' | 'succeeded' | 'failed'
  createdAt: Date
  expiresAt: Date
}

/**
 * Response de webhook processado
 */
export interface StripeWebhookResult {
  success: boolean
  invoiceId?: string
  clientId?: string
  paymentStatus: 'succeeded' | 'failed' | 'pending'
  amount?: number
  message: string
}

/**
 * Service para integração com Stripe
 *
 * Responsabilidades:
 * - Criar sessões de checkout
 * - Processar webhooks
 * - Validar assinaturas
 * - Gerenciar refunds
 * - Rastrear status de pagamentos
 */
export class StripeService {
  private stripe: Stripe
  private webhookSecret: string

  constructor(
    apiKey: string = process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: string = process.env.STRIPE_WEBHOOK_SECRET || ''
  ) {
    this.stripe = new Stripe(apiKey, {
      apiVersion: '2023-10-16',
      typescript: true,
    })
    this.webhookSecret = webhookSecret
  }

  /**
   * Criar sessão de checkout para pagamento
   */
  async createCheckoutSession(
    input: StripePaymentSessionInput
  ): Promise<StripePaymentSession> {
    try {
      const validatedInput = stripePaymentSessionSchema.parse(input)

      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card', 'boleto'],
        line_items: [
          {
            price_data: {
              currency: validatedInput.currency.toLowerCase(),
              product_data: {
                name: validatedInput.description,
                metadata: {
                  invoiceId: validatedInput.invoiceId,
                  clientId: validatedInput.clientId,
                },
              },
              unit_amount: Math.round(validatedInput.amount * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: validatedInput.successUrl,
        cancel_url: validatedInput.cancelUrl,
        metadata: {
          invoiceId: validatedInput.invoiceId,
          clientId: validatedInput.clientId,
          ...(validatedInput.metadata || {}),
        },
        billing_address_collection: 'required',
        customer_email: undefined, // Will be collected in checkout
      })

      return {
        sessionId: session.id,
        clientSecret: session.client_secret || undefined,
        url: session.url || undefined,
        status: this.mapSessionStatus(session.payment_status),
        createdAt: new Date(session.created * 1000),
        expiresAt: new Date((session.created + 86400) * 1000), // 24 hours
      }
    } catch (error) {
      throw new Error(`Failed to create Stripe checkout session: ${error}`)
    }
  }

  /**
   * Obter status da sessão de checkout
   */
  async getSessionStatus(sessionId: string): Promise<string> {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId)
      return session.payment_status
    } catch (error) {
      throw new Error(`Failed to retrieve Stripe session: ${error}`)
    }
  }

  /**
   * Processar webhook de Stripe
   */
  async processWebhook(
    body: string,
    signature: string
  ): Promise<StripeWebhookResult> {
    try {
      const event = this.stripe.webhooks.constructEvent(
        body,
        signature,
        this.webhookSecret
      ) as Stripe.Event

      const validatedEvent = stripeWebhookSchema.parse({
        id: event.id,
        type: event.type,
        data: event.data,
      })

      switch (validatedEvent.type) {
        case 'checkout.session.completed':
          return {
            success: true,
            paymentStatus: 'succeeded',
            invoiceId: validatedEvent.data.object.metadata?.invoiceId,
            clientId: validatedEvent.data.object.metadata?.clientId,
            message: 'Payment completed successfully',
          }

        case 'checkout.session.async_payment_succeeded':
          return {
            success: true,
            paymentStatus: 'succeeded',
            invoiceId: validatedEvent.data.object.metadata?.invoiceId,
            clientId: validatedEvent.data.object.metadata?.clientId,
            message: 'Async payment succeeded',
          }

        case 'checkout.session.async_payment_failed':
          return {
            success: false,
            paymentStatus: 'failed',
            invoiceId: validatedEvent.data.object.metadata?.invoiceId,
            clientId: validatedEvent.data.object.metadata?.clientId,
            message: 'Async payment failed',
          }

        case 'charge.refunded':
          return {
            success: true,
            paymentStatus: 'pending',
            message: 'Charge refunded',
          }

        default:
          return {
            success: false,
            paymentStatus: 'pending',
            message: 'Unknown webhook event',
          }
      }
    } catch (error) {
      throw new Error(`Failed to process Stripe webhook: ${error}`)
    }
  }

  /**
   * Processar refund
   */
  async processRefund(
    chargeId: string,
    amount?: number
  ): Promise<{ refundId: string; status: string }> {
    try {
      const refund = await this.stripe.refunds.create({
        charge: chargeId,
        amount: amount ? Math.round(amount * 100) : undefined,
      })

      return {
        refundId: refund.id,
        status: refund.status,
      }
    } catch (error) {
      throw new Error(`Failed to process refund: ${error}`)
    }
  }

  /**
   * Mapear status Stripe para status local
   */
  private mapSessionStatus(
    stripeStatus: string | null
  ): 'pending' | 'processing' | 'succeeded' | 'failed' {
    switch (stripeStatus) {
      case 'paid':
        return 'succeeded'
      case 'unpaid':
        return 'pending'
      default:
        return 'processing'
    }
  }
}

// Singleton instance
let stripeService: StripeService | null = null

/**
 * Obter instância singleton de StripeService
 */
export function getStripeService(): StripeService {
  if (!stripeService) {
    stripeService = new StripeService()
  }
  return stripeService
}
