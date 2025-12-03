// Rotina de reconciliação automática de finanças
// Executa periodicamente para identificar e corrigir inconsistências entre invoices, payments e finances

import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'

export async function runFinanceReconciliation(
  opts: { notify?: boolean; orgId?: string } = {}
) {
  // 1. Corrigir faturas PAID sem pagamentos vinculados
  const invoicesPaidWithoutPayments = await prisma.invoice.findMany({
    where: { status: 'PAID', payments: { none: {} } },
    select: { id: true, clientId: true, total: true },
  })
  for (const inv of invoicesPaidWithoutPayments) {
    logger.warn(`Fatura PAID sem pagamento: Invoice ${inv.id}`)
    if (opts.notify && opts.orgId) {
      await prisma.notification.create({
        data: {
          orgId: opts.orgId,
          type: 'finance_reconciliation',
          title: 'Fatura PAID sem pagamento',
          message: `Invoice ${inv.id} está PAID mas sem pagamentos vinculados.`,
          priority: 'high',
        },
      })
    }
  }

  // 2. Corrigir receitas sem vínculo com fatura
  const orphanFinances = await prisma.finance.findMany({
    where: { type: 'income', invoiceId: null },
    select: { id: true, amount: true, clientId: true },
  })
  for (const fin of orphanFinances) {
    logger.warn(`Receita sem vínculo de fatura: Finance ${fin.id}`)
    if (opts.notify && opts.orgId) {
      await prisma.notification.create({
        data: {
          orgId: opts.orgId,
          type: 'finance_reconciliation',
          title: 'Receita sem vínculo de fatura',
          message: `Finance ${fin.id} não possui invoiceId vinculado.`,
          priority: 'medium',
        },
      })
    }
  }

  // 3. Faturas com múltiplas finances (possível duplicidade)
  const invoicesWithMultipleFinances = await prisma.invoice.findMany({
    where: { finances: { some: {} } },
    select: { id: true, finances: { select: { id: true } } },
  })
  for (const inv of invoicesWithMultipleFinances) {
    if (inv.finances.length > 1) {
      logger.warn(`Fatura com múltiplas finances: Invoice ${inv.id}`)
      if (opts.notify && opts.orgId) {
        await prisma.notification.create({
          data: {
            orgId: opts.orgId,
            type: 'finance_reconciliation',
            title: 'Fatura com múltiplas receitas',
            message: `Invoice ${inv.id} possui ${inv.finances.length} finances vinculadas.`,
            priority: 'low',
          },
        })
      }
    }
  }

  // 4. Alertas gerais
  if (invoicesPaidWithoutPayments.length > 0 || orphanFinances.length > 0) {
    // Aqui pode-se disparar e-mail, Slack, etc.
    logger.error('Inconsistências financeiras detectadas!')
  }
}
