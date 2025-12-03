import { prisma } from '@/lib/prisma'
import { PaymentOrchestrator } from '@/services/payments/PaymentOrchestrator'
import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface NubankPixWebhook {
  event: 'pix.received' | 'pix.returned'
  data: {
    id: string // ID da transação
    amount: number // Valor em centavos
    description?: string
    endToEndId: string // ID E2E do Pix
    payer: {
      name: string
      taxId: string // CPF/CNPJ
    }
    createdAt: string
  }
}

/**
 * Verifica a assinatura do webhook do Nubank
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payload)
  const expectedSignature = hmac.digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

/**
 * Processa pagamento Pix recebido
 */
async function processPixReceived(webhook: NubankPixWebhook) {
  const amountInReais = webhook.data.amount / 100
  const payerTaxId = webhook.data.payer.taxId.replace(/\D/g, '')

  // Buscar cliente pelo CPF/CNPJ
  const client = await prisma.client.findFirst({
    where: {
      OR: [{ cpf: payerTaxId }, { cnpj: payerTaxId }],
    },
  })

  if (!client) {
    console.warn(
      `[Nubank Webhook] Cliente não encontrado para taxId: ${payerTaxId}`
    )
    // Registrar como receita genérica
    await prisma.finance.create({
      data: {
        orgId: process.env.DEFAULT_ORG_ID!, // Você pode configurar uma org padrão
        type: 'income',
        amount: amountInReais,
        description: `Pix recebido de ${webhook.data.payer.name} - ${webhook.data.description || 'Sem descrição'}`,
        category: 'Pix - Pagamento não identificado',
        date: new Date(webhook.data.createdAt),
        metadata: {
          source: 'nubank_pix',
          endToEndId: webhook.data.endToEndId,
          transactionId: webhook.data.id,
        },
      },
    })
    return
  }

  // Buscar fatura em aberto com valor próximo
  const tolerance = 0.01 // Tolerância de R$ 0,01
  const openInvoice = await prisma.invoice.findFirst({
    where: {
      clientId: client.id,
      status: { in: ['OPEN', 'OVERDUE'] },
      total: {
        gte: amountInReais - tolerance,
        lte: amountInReais + tolerance,
      },
    },
    orderBy: { dueDate: 'asc' },
  })

  if (openInvoice) {
    // Registrar pagamento via PaymentOrchestrator
    await PaymentOrchestrator.recordInvoicePayment({
      orgId: client.orgId,
      clientId: client.id,
      invoiceId: openInvoice.id,
      amount: amountInReais,
      method: 'pix',
      paidAt: new Date(webhook.data.createdAt),
      description: `Pix - ${webhook.data.payer.name}`,
    })

    // Atualizar metadata do finance criado
    const financeRecord = await prisma.finance.findFirst({
      where: {
        orgId: client.orgId,
        clientId: client.id,
        invoiceId: openInvoice.id,
      },
      orderBy: { createdAt: 'desc' },
    })

    if (financeRecord) {
      await prisma.finance.update({
        where: { id: financeRecord.id },
        data: {
          metadata: {
            source: 'nubank_pix',
            endToEndId: webhook.data.endToEndId,
            transactionId: webhook.data.id,
          },
        },
      })
    }

    console.log(
      `[Nubank Webhook] Fatura ${openInvoice.number} marcada como paga via Pix`
    )
  } else {
    // Registrar apenas finance (Payment requer invoiceId obrigatório)
    await prisma.finance.create({
      data: {
        orgId: client.orgId,
        clientId: client.id,
        type: 'income',
        amount: amountInReais,
        description: `Pix recebido - ${webhook.data.payer.name}`,
        category: 'Pix',
        date: new Date(webhook.data.createdAt),
        metadata: {
          source: 'nubank_pix',
          endToEndId: webhook.data.endToEndId,
          transactionId: webhook.data.id,
        },
      },
    })

    console.log(
      `[Nubank Webhook] Pagamento Pix avulso registrado para cliente ${client.name}`
    )
  }
}

/**
 * POST /api/webhooks/nubank/pix
 * Recebe notificações de Pix do Nubank
 */
export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-nubank-signature')
    const webhookSecret = process.env.NUBANK_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error('[Nubank Webhook] NUBANK_WEBHOOK_SECRET não configurado')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    const body = await request.text()

    // Verificar assinatura
    if (signature && !verifyWebhookSignature(body, signature, webhookSecret)) {
      console.error('[Nubank Webhook] Assinatura inválida')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const webhook: NubankPixWebhook = JSON.parse(body)

    console.log(`[Nubank Webhook] Evento recebido: ${webhook.event}`)

    // Processar apenas eventos de Pix recebido
    if (webhook.event === 'pix.received') {
      await processPixReceived(webhook)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Nubank Webhook] Erro ao processar webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
