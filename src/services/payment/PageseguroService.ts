import { z } from 'zod'

/**
 * Schema para criação de pagamento PIX via PagSeguro
 */
export const pageseguroPixPaymentSchema = z.object({
  clientId: z.string().min(1),
  invoiceId: z.string().min(1),
  amount: z.number().min(0.01),
  description: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(10),
  metadata: z.record(z.string()).optional(),
})

export type PageseguroPixPaymentInput = z.infer<
  typeof pageseguroPixPaymentSchema
>

/**
 * Schema para webhook de PagSeguro
 */
export const pageseguroWebhookSchema = z.object({
  id: z.string(),
  reference_id: z.string(),
  status: z.enum([
    'PAID',
    'WAITING',
    'DECLINED',
    'EXPIRED',
    'AUTHORIZED',
    'REFUNDED',
  ]),
  source: z.enum(['PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'BOLETO']),
  amount: z.number(),
  pix_copy_paste: z.string().optional(),
  created_at: z.string(),
})

export type PageseguroWebhookEvent = z.infer<typeof pageseguroWebhookSchema>

/**
 * Response de pagamento PIX criado
 */
export interface PageseguroPixPayment {
  paymentId: string
  pixQrCode?: string
  pixCopyPaste?: string
  pixExpiresAt?: Date
  status: 'pending' | 'authorized' | 'paid' | 'declined' | 'expired'
  amount: number
  createdAt: Date
}

/**
 * Response de webhook processado
 */
export interface PageseguroWebhookResult {
  success: boolean
  invoiceId?: string
  clientId?: string
  paymentStatus: 'succeeded' | 'failed' | 'pending' | 'expired'
  amount?: number
  source: string
  message: string
}

/**
 * Service para integração com PagSeguro PIX
 *
 * Responsabilidades:
 * - Gerar QR codes PIX
 * - Criar pedidos de pagamento
 * - Processar webhooks de confirmação
 * - Rastrear status de pagamentos
 * - Gerar comprovantes
 */
export class PageseguroService {
  private baseUrl = 'https://api.pageseguro.com.br'
  private apiKey: string
  private webhookSecret: string

  constructor(
    apiKey: string = process.env.PAGESEGURO_API_KEY || '',
    webhookSecret: string = process.env.PAGESEGURO_WEBHOOK_SECRET || ''
  ) {
    this.apiKey = apiKey
    this.webhookSecret = webhookSecret
  }

  /**
   * Criar pagamento PIX
   */
  async createPixPayment(
    input: PageseguroPixPaymentInput
  ): Promise<PageseguroPixPayment> {
    try {
      const validatedInput = pageseguroPixPaymentSchema.parse(input)

      // Simulação - Em produção, chamar API de PagSeguro
      const paymentId = `pag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const pixQrCode = this.generatePixQrCode(
        validatedInput.amount,
        validatedInput.description,
        paymentId
      )

      // Em produção:
      // const response = await fetch(`${this.baseUrl}/charges`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${this.apiKey}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     reference_id: validatedInput.invoiceId,
      //     description: validatedInput.description,
      //     amount_in_cents: Math.round(validatedInput.amount * 100),
      //     payment_method: {
      //       type: 'PIX',
      //     },
      //     customer: {
      //       email: validatedInput.customerEmail,
      //       phone: validatedInput.customerPhone,
      //     },
      //     metadata: {
      //       invoiceId: validatedInput.invoiceId,
      //       clientId: validatedInput.clientId,
      //     },
      //   }),
      // })

      return {
        paymentId,
        pixQrCode,
        pixCopyPaste: pixQrCode, // Em produção seria o copiar e colar
        pixExpiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutos
        status: 'pending',
        amount: validatedInput.amount,
        createdAt: new Date(),
      }
    } catch (error) {
      throw new Error(`Failed to create PIX payment: ${error}`)
    }
  }

  /**
   * Obter status de pagamento
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getPaymentStatus(paymentId: string): Promise<string> {
    try {
      // Em produção:
      // const response = await fetch(`${this.baseUrl}/charges/${paymentId}`, {
      //   headers: {
      //     'Authorization': `Bearer ${this.apiKey}`,
      //   },
      // })
      // const data = await response.json()
      // return data.status

      // Simulação
      return 'WAITING'
    } catch (error) {
      throw new Error(`Failed to get payment status: ${error}`)
    }
  }

  /**
   * Processar webhook de PagSeguro
   */
  async processWebhook(
    payload: PageseguroWebhookEvent
  ): Promise<PageseguroWebhookResult> {
    try {
      const validatedEvent = pageseguroWebhookSchema.parse(payload)

      const statusMap = {
        PAID: 'succeeded',
        WAITING: 'pending',
        DECLINED: 'failed',
        EXPIRED: 'expired',
        AUTHORIZED: 'pending',
        REFUNDED: 'failed',
      } as const

      return {
        success: validatedEvent.status === 'PAID',
        paymentStatus: statusMap[validatedEvent.status],
        invoiceId: validatedEvent.reference_id,
        amount: validatedEvent.amount / 100, // Convert from cents
        source: validatedEvent.source,
        message: `Payment ${validatedEvent.status}`,
      }
    } catch (error) {
      throw new Error(`Failed to process PagSeguro webhook: ${error}`)
    }
  }

  /**
   * Processar refund
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async processRefund(
    paymentId: string,
    amount?: number
  ): Promise<{ refundId: string; status: string }> {
    try {
      // Em produção:
      // const response = await fetch(`${this.baseUrl}/charges/${paymentId}/refunds`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${this.apiKey}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     amount_in_cents: amount ? Math.round(amount * 100) : undefined,
      //   }),
      // })

      const refundId = `ref_${Date.now()}`
      return {
        refundId,
        status: 'PENDING',
      }
    } catch (error) {
      throw new Error(`Failed to process refund: ${error}`)
    }
  }

  /**
   * Gerar QR Code PIX (simulado)
   */
  private generatePixQrCode(
    amount: number,
    description: string,
    paymentId: string
  ): string {
    // Em produção, seria gerado pelo PagSeguro
    // Retorna um QR code encode que pode ser escaneado pelo app do banco
    const qrData = {
      paymentId,
      amount,
      description,
      timestamp: new Date().toISOString(),
    }
    return Buffer.from(JSON.stringify(qrData)).toString('base64')
  }
}

// Singleton instance
let pageseguroService: PageseguroService | null = null

/**
 * Obter instância singleton de PageseguroService
 */
export function getPageseguroService(): PageseguroService {
  if (!pageseguroService) {
    pageseguroService = new PageseguroService()
  }
  return pageseguroService
}
