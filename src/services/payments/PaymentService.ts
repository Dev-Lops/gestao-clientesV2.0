/**
 * Payment Service - Centraliza toda lógica de negócio relacionada a pagamentos
 *
 * Este serviço gerencia:
 * - Pagamentos mensais recorrentes
 * - Parcelas de contratos parcelados
 * - Validações e regras de negócio
 * - Status e vencimentos
 */

import { prisma } from '@/lib/prisma'
import { BillingService } from '@/services/billing/BillingService'
import { Client, Installment, PaymentStatus } from '@prisma/client'

export type PaymentMode = 'monthly' | 'installment'

// Tipo para cliente com installments incluídos
type ClientWithInstallments = Client & {
  installments: Installment[]
}

export type MonthlyPaymentStatus = {
  mode: PaymentMode
  amount: number
  isPaid: boolean
  isLate: boolean
  dueDate: Date
  paidAt: Date | null
  details: {
    // For monthly: current month finance total
    // For installment: installments info
    monthlyIncome?: number
    installments?: {
      total: number
      paid: number
      pending: number
      nextPendingId?: string
    }
  }
}

export type InstallmentInfo = {
  id: string
  number: number
  totalInstallments: number
  amount: number
  dueDate: Date
  status: PaymentStatus
  paidAt: Date | null
}

export class PaymentService {
  /**
   * Obtém o status de pagamento do mês atual para um cliente
   */
  static async getMonthlyPaymentStatus(
    clientId: string,
    orgId: string
  ): Promise<MonthlyPaymentStatus> {
    const client = await prisma.client.findFirst({
      where: { id: clientId, orgId },
      include: {
        installments: {
          orderBy: { number: 'asc' },
        },
      },
    })

    if (!client) {
      throw new Error('Cliente não encontrado')
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59
    )

    // Modo parcelas
    if (client.isInstallment) {
      return this.getInstallmentPaymentStatus(
        client,
        startOfMonth,
        endOfMonth,
        now
      )
    }

    // Modo mensal recorrente
    return this.getRecurringPaymentStatus(client, startOfMonth, endOfMonth, now)
  }

  /**
   * Status para pagamento parcelado
   */
  private static async getInstallmentPaymentStatus(
    client: ClientWithInstallments,
    startOfMonth: Date,
    endOfMonth: Date,
    now: Date
  ): Promise<MonthlyPaymentStatus> {
    const monthInstallments = client.installments.filter(
      (i: Installment) => i.dueDate >= startOfMonth && i.dueDate <= endOfMonth
    )

    if (monthInstallments.length === 0) {
      return {
        mode: 'installment',
        amount: 0,
        isPaid: false,
        isLate: false,
        dueDate: startOfMonth,
        paidAt: null,
        details: {
          installments: {
            total: 0,
            paid: 0,
            pending: 0,
          },
        },
      }
    }

    const paidCount = monthInstallments.filter(
      (i: Installment) => i.status === 'CONFIRMED'
    ).length
    const isPaid = paidCount === monthInstallments.length
    const totalAmount = monthInstallments.reduce(
      (sum: number, i: Installment) => sum + i.amount,
      0
    )
    const latestDueDate = new Date(
      Math.max(
        ...monthInstallments.map((i: Installment) =>
          new Date(i.dueDate).getTime()
        )
      )
    )
    const isLate = !isPaid && now > latestDueDate
    const nextPending = monthInstallments.find(
      (i: Installment) => i.status !== 'CONFIRMED'
    )

    return {
      mode: 'installment',
      amount: totalAmount,
      isPaid,
      isLate,
      dueDate: latestDueDate,
      paidAt: isPaid
        ? new Date(
            Math.max(
              ...monthInstallments
                .filter((i: Installment) => i.paidAt !== null)
                .map((i: Installment) => new Date(i.paidAt as Date).getTime())
            )
          )
        : null,
      details: {
        installments: {
          total: monthInstallments.length,
          paid: paidCount,
          pending: monthInstallments.length - paidCount,
          nextPendingId: nextPending?.id,
        },
      },
    }
  }

  /**
   * Status para pagamento mensal recorrente
   */
  private static async getRecurringPaymentStatus(
    client: Client,
    startOfMonth: Date,
    endOfMonth: Date,
    now: Date
  ): Promise<MonthlyPaymentStatus> {
    if (!client.contractValue) {
      throw new Error('Cliente não possui valor de contrato definido')
    }

    // Calcular vencimento
    const paymentDay = Math.min(Math.max(client.paymentDay || 5, 1), 28)
    const dueDate = new Date(now.getFullYear(), now.getMonth(), paymentDay)

    // Verificar pagamentos do mês
    const monthFinances = await prisma.finance.findMany({
      where: {
        clientId: client.id,
        type: 'income',
        date: { gte: startOfMonth, lte: endOfMonth },
      },
    })

    const totalIncome = monthFinances.reduce((sum, f) => sum + f.amount, 0)
    const expectedAmount = client.contractValue
    // Tolerância de 5% para considerar pago
    const isPaid = totalIncome >= expectedAmount * 0.95
    const isLate = !isPaid && now > dueDate

    return {
      mode: 'monthly',
      amount: expectedAmount,
      isPaid,
      isLate,
      dueDate,
      paidAt:
        isPaid && monthFinances.length > 0
          ? new Date(
              Math.max(...monthFinances.map((f) => new Date(f.date).getTime()))
            )
          : null,
      details: {
        monthlyIncome: totalIncome,
      },
    }
  }

  /**
   * Registra pagamento mensal recorrente
   */
  static async confirmMonthlyPayment(
    clientId: string,
    orgId: string,
    paidAmount?: number
  ): Promise<void> {
    const client = await prisma.client.findFirst({
      where: { id: clientId, orgId },
    })
    if (!client) throw new Error('Cliente não encontrado')
    if (client.isInstallment)
      throw new Error(
        'Cliente está em modo parcelado. Use confirmInstallmentPayment.'
      )
    if (!client.contractValue)
      throw new Error('Cliente não possui valor de contrato definido')

    // Gera (ou reaproveita) fatura mensal
    const invoice = await BillingService.generateMonthlyInvoice(clientId, orgId)
    if (invoice.status === 'PAID') {
      throw new Error('Fatura mensal já está paga')
    }

    // Marca fatura como paga e cria payment + finance (BillingService.markInvoicePaid já faz isso)
    await BillingService.markInvoicePaid(
      invoice.id,
      orgId,
      'manual',
      paidAmount || client.contractValue
    )
  }

  /**
   * Confirma pagamento de uma parcela específica
   */
  static async confirmInstallmentPayment(
    installmentId: string,
    orgId: string
  ): Promise<void> {
    const installment = await prisma.installment.findUnique({
      where: { id: installmentId },
      include: { client: true },
    })
    if (!installment || installment.client.orgId !== orgId)
      throw new Error('Parcela não encontrada')
    if (installment.status === 'CONFIRMED')
      throw new Error('Parcela já foi confirmada')

    // Atualiza status da parcela
    const updated = await prisma.installment.update({
      where: { id: installmentId },
      data: { status: 'CONFIRMED', paidAt: new Date() },
    })

    // Verifica se já existe fatura vinculada (usa externalId ou notes)
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        orgId,
        clientId: updated.clientId,
        externalId: installment.id,
      },
    })

    if (!existingInvoice) {
      // Cria fatura específica da parcela (já como PAID)
      const number = `INV-PAR-${updated.number}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
      await prisma.invoice.create({
        data: {
          orgId,
          clientId: updated.clientId,
          number,
          status: 'PAID',
          issueDate: new Date(),
          dueDate: updated.dueDate,
          subtotal: updated.amount,
          discount: 0,
          tax: 0,
          total: updated.amount,
          currency: 'BRL',
          externalId: installment.id,
          notes: `Parcela ${updated.number}/${installment.client.installmentCount || 0}`,
          items: {
            create: [
              {
                description: `Parcela ${updated.number}`,
                quantity: 1,
                unitAmount: updated.amount,
                total: updated.amount,
              },
            ],
          },
          payments: {
            create: [
              {
                orgId,
                clientId: updated.clientId,
                amount: updated.amount,
                method: 'manual',
                status: 'PAID',
                paidAt: new Date(),
              },
            ],
          },
        },
      })
      // Finance entry já feito abaixo
    }

    // Cria entrada financeira (evita duplicar se já houver mesma descrição e valor)
    const existingFinance = await prisma.finance.findFirst({
      where: {
        orgId,
        clientId: updated.clientId,
        type: 'income',
        amount: updated.amount,
        description: { contains: `Parcela ${updated.number}` },
      },
    })
    if (!existingFinance) {
      await prisma.finance.create({
        data: {
          orgId,
          clientId: updated.clientId,
          type: 'income',
          amount: updated.amount,
          description: `Parcela ${updated.number} - ${installment.client.name}`,
          category: 'Parcelas',
          date: new Date(),
        },
      })
    }
  }

  /**
   * Lista todas as parcelas de um cliente
   */
  static async getClientInstallments(
    clientId: string,
    orgId: string
  ): Promise<InstallmentInfo[]> {
    const client = await prisma.client.findFirst({
      where: { id: clientId, orgId },
      include: {
        installments: {
          orderBy: { number: 'asc' },
        },
      },
    })

    if (!client) {
      throw new Error('Cliente não encontrado')
    }

    const total = client.installmentCount || client.installments.length

    return client.installments.map((i) => ({
      id: i.id,
      number: i.number,
      totalInstallments: total,
      amount: i.amount,
      dueDate: i.dueDate,
      status: i.status,
      paidAt: i.paidAt,
    }))
  }

  /**
   * Atualiza status de parcelas vencidas
   */
  static async updateLateInstallments(orgId: string): Promise<number> {
    const now = new Date()

    const result = await prisma.installment.updateMany({
      where: {
        client: { orgId },
        status: 'PENDING',
        dueDate: { lt: now },
      },
      data: { status: 'LATE' },
    })

    return result.count
  }
}
