import { Prisma, PrismaClient } from '@prisma/client'

/**
 * Prisma Transaction Utilities
 * Provides helpers for complex database operations that require transactional consistency
 */

export class PrismaTransactionManager {
  constructor(private prisma: PrismaClient) {}

  /**
   * Execute a function within a Prisma transaction
   * Automatically rolls back on error
   */
  async execute<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> {
    return this.prisma.$transaction(callback, {
      maxWait: 5000, // 5 seconds
      timeout: 10000, // 10 seconds
      isolationLevel: 'ReadCommitted',
    })
  }

  /**
   * Create invoice with transaction (atomic operation)
   * - Creates invoice
   * - Creates invoice items
   * - Optionally creates income transaction
   */
  async createInvoiceWithTransaction(data: {
    invoice: {
      orgId: string
      clientId: string
      number: string
      status: 'DRAFT' | 'OPEN' | 'PAID' | 'OVERDUE' | 'CANCELLED'
      issueDate: Date
      dueDate: Date
      subtotal: number
      discount: number
      tax: number
      total: number
      notes?: string
      internalNotes?: string
      createdBy?: string
    }
    items: Array<{
      description: string
      quantity: number
      unitAmount: number
      total: number
    }>
    createTransaction?: {
      type: 'INCOME'
      subtype: 'INVOICE_PAYMENT'
      amount: number
      description: string
      date: Date
      status: 'PENDING' | 'CONFIRMED'
      createdBy?: string
    }
  }) {
    return this.execute(async (tx) => {
      // Create invoice
      const invoice = await tx.invoice.create({
        data: {
          ...data.invoice,
          items: {
            create: data.items,
          },
        },
        include: {
          items: true,
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      // Create transaction if requested
      let transaction: any = null
      if (data.createTransaction) {
        transaction = await tx.transaction.create({
          data: {
            ...data.createTransaction,
            orgId: data.invoice.orgId,
            clientId: data.invoice.clientId,
            invoiceId: invoice.id,
          },
        })
      }

      return { invoice, transaction }
    })
  }

  /**
   * Approve invoice payment (atomic operation)
   * - Updates invoice status to PAID
   * - Sets paidAt timestamp
   * - Creates income transaction
   */
  async approveInvoicePayment(data: {
    invoiceId: string
    orgId: string
    paidAt: Date
    notes?: string
    createdBy: string
  }) {
    return this.execute(async (tx) => {
      // Get invoice details
      const invoice = await tx.invoice.findFirst({
        where: {
          id: data.invoiceId,
          orgId: data.orgId,
          deletedAt: null,
        },
        include: {
          client: true,
        },
      })

      if (!invoice) {
        throw new Error('Fatura não encontrada')
      }

      if (invoice.status === 'PAID') {
        throw new Error('Fatura já foi paga')
      }

      // Update invoice
      const updatedInvoice = await tx.invoice.update({
        where: { id: data.invoiceId },
        data: {
          status: 'PAID',
          paidAt: data.paidAt,
          updatedAt: new Date(),
          updatedBy: data.createdBy,
        },
        include: {
          items: true,
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      // Create income transaction
      const transaction = await tx.transaction.create({
        data: {
          orgId: data.orgId,
          clientId: invoice.clientId,
          invoiceId: invoice.id,
          type: 'INCOME',
          subtype: 'INVOICE_PAYMENT',
          amount:
            typeof invoice.total === 'object'
              ? invoice.total.toNumber()
              : invoice.total,
          description: `Pagamento da fatura ${invoice.number}`,
          category: 'Receita de Cliente',
          date: data.paidAt,
          status: 'CONFIRMED',
          metadata: {
            invoiceNumber: invoice.number,
            clientName: invoice.client.name,
            notes: data.notes,
          },
          createdBy: data.createdBy,
        },
      })

      return { invoice: updatedInvoice, transaction }
    })
  }

  /**
   * Cancel invoice (atomic operation)
   * - Updates invoice status to CANCELLED
   * - Cancels related pending transactions
   */
  async cancelInvoice(data: {
    invoiceId: string
    orgId: string
    reason: string
    cancelledBy: string
  }) {
    return this.execute(async (tx) => {
      // Get invoice
      const invoice = await tx.invoice.findFirst({
        where: {
          id: data.invoiceId,
          orgId: data.orgId,
          deletedAt: null,
        },
      })

      if (!invoice) {
        throw new Error('Fatura não encontrada')
      }

      if (invoice.status === 'CANCELLED') {
        throw new Error('Fatura já foi cancelada')
      }

      if (invoice.status === 'PAID') {
        throw new Error('Não é possível cancelar uma fatura já paga')
      }

      // Update invoice
      const updatedInvoice = await tx.invoice.update({
        where: { id: data.invoiceId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          internalNotes: data.reason,
          updatedAt: new Date(),
          updatedBy: data.cancelledBy,
        },
      })

      // Cancel related pending transactions
      await tx.transaction.updateMany({
        where: {
          invoiceId: data.invoiceId,
          status: 'PENDING',
          deletedAt: null,
        },
        data: {
          status: 'CANCELLED',
          updatedAt: new Date(),
          updatedBy: data.cancelledBy,
        },
      })

      return updatedInvoice
    })
  }

  /**
   * Update client payment status based on invoices (atomic operation)
   * - Counts overdue invoices
   * - Updates client payment status
   */
  async updateClientPaymentStatus(clientId: string, orgId: string) {
    return this.execute(async (tx) => {
      const now = new Date()

      // Count overdue invoices
      const overdueCount = await tx.invoice.count({
        where: {
          clientId,
          orgId,
          status: 'OVERDUE',
          deletedAt: null,
        },
      })

      // Count pending invoices
      const pendingCount = await tx.invoice.count({
        where: {
          clientId,
          orgId,
          status: 'OPEN',
          dueDate: { lt: now },
          deletedAt: null,
        },
      })

      // Determine new status
      let newStatus: 'PENDING' | 'CONFIRMED' | 'LATE'
      if (overdueCount > 0 || pendingCount > 0) {
        newStatus = 'LATE'
      } else {
        const hasAnyInvoice = await tx.invoice.count({
          where: {
            clientId,
            orgId,
            deletedAt: null,
          },
        })
        newStatus = hasAnyInvoice > 0 ? 'CONFIRMED' : 'PENDING'
      }

      // Update client
      const client = await tx.client.update({
        where: { id: clientId },
        data: {
          paymentStatus: newStatus,
          updatedAt: new Date(),
        },
      })

      return client
    })
  }

  /**
   * Materialize cost tracking for a month (atomic operation)
   * - Creates transactions for all active subscriptions
   * - Marks them as materialized
   */
  async materializeMonthlyCosts(data: {
    orgId: string
    month: number
    year: number
    createdBy: string
  }) {
    return this.execute(async (tx) => {
      const startDate = new Date(data.year, data.month - 1, 1)
      const endDate = new Date(data.year, data.month, 0, 23, 59, 59, 999)

      // Get active subscriptions for the month
      const subscriptions = await tx.clientCostSubscription.findMany({
        where: {
          orgId: data.orgId,
          active: true,
          startDate: { lte: endDate },
          OR: [{ endDate: null }, { endDate: { gte: startDate } }],
          deletedAt: null,
        },
        include: {
          client: true,
          costItem: true,
        },
      })

      // Check for existing transactions this month
      const existingTransactions = await tx.transaction.findMany({
        where: {
          orgId: data.orgId,
          type: 'EXPENSE',
          subtype: 'INTERNAL_COST',
          date: { gte: startDate, lte: endDate },
          costItemId: {
            in: subscriptions.map((s) => s.costItemId),
          },
          deletedAt: null,
        },
        select: { costItemId: true, clientId: true },
      })

      const existingKeys = new Set(
        existingTransactions.map((t) => `${t.costItemId}-${t.clientId}`)
      )

      // Create transactions for subscriptions without existing transactions
      const transactionsToCreate = subscriptions
        .filter((sub) => !existingKeys.has(`${sub.costItemId}-${sub.clientId}`))
        .map((sub) => ({
          orgId: data.orgId,
          clientId: sub.clientId,
          costItemId: sub.costItemId,
          type: 'EXPENSE' as const,
          subtype: 'INTERNAL_COST' as const,
          amount: sub.costItem.amount,
          description: `${sub.costItem.name} - ${sub.client.name}`,
          category: sub.costItem.category || 'Custos Internos',
          date: startDate,
          status: 'CONFIRMED' as const,
          metadata: {
            subscriptionId: sub.id,
            month: data.month,
            year: data.year,
          },
          createdBy: data.createdBy,
        }))

      if (transactionsToCreate.length > 0) {
        await tx.transaction.createMany({
          data: transactionsToCreate,
        })
      }

      return {
        created: transactionsToCreate.length,
        skipped: existingKeys.size,
        total: subscriptions.length,
      }
    })
  }
}
