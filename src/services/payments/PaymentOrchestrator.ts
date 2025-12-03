import { prisma } from '@/lib/prisma'

export class PaymentOrchestrator {
  /**
   * Registra pagamento consolidando Invoice, Payment, Finance e Client.paymentStatus.
   * Sempre vincula `Finance.invoiceId` para evitar duplicações.
   */
  static async recordInvoicePayment(params: {
    orgId: string
    clientId: string
    invoiceId: string
    amount: number
    method: string
    category?: string
    description?: string
    paidAt?: Date
  }) {
    const {
      orgId,
      clientId,
      invoiceId,
      amount,
      method,
      category = 'Mensalidade',
      description = `Pagamento fatura`,
      paidAt = new Date(),
    } = params

    // Guard de duplicidade rápida: evita dois pagamentos iguais em < 2min
    const existingRecentPayment = await prisma.payment.findFirst({
      where: {
        invoiceId,
        amount,
        status: 'PAID',
        paidAt: { gte: new Date(Date.now() - 2 * 60 * 1000) },
      },
    })
    if (existingRecentPayment) {
      return prisma.invoice.findUnique({ where: { id: invoiceId } })
    }

    const [updatedInvoice] = await prisma.$transaction([
      prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: 'PAID' },
      }),
      prisma.payment.create({
        data: {
          orgId,
          clientId,
          invoiceId,
          amount,
          method,
          status: 'PAID',
          paidAt,
          provider: 'manual',
        },
      }),
      prisma.finance.create({
        data: {
          orgId,
          clientId,
          type: 'income',
          amount,
          description,
          category,
          date: paidAt,
          invoiceId,
        },
      }),
    ])

    // Auto-recovery de paymentStatus do cliente
    const remainingProblematic = await prisma.invoice.count({
      where: {
        clientId,
        orgId,
        status: { in: ['OPEN', 'OVERDUE'] },
      },
    })
    await prisma.client.update({
      where: { id: clientId },
      data: {
        paymentStatus: remainingProblematic > 0 ? 'PENDING' : 'CONFIRMED',
      },
    })

    return updatedInvoice
  }
}
