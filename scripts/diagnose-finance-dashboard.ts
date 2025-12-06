#!/usr/bin/env ts-node
/**
 * Script para diagnosticar dados do dashboard financeiro
 * Verifica inconsistências nos cards de Receitas, Despesas, Lucro Previsto e Em Caixa
 */

import { prisma } from '@/lib/prisma'
import { ReportingService } from '@/domain/reports/ReportingService'
import { TransactionStatus, TransactionType } from '@prisma/client'

async function main() {
  try {
    // Força conexão do Prisma
    await prisma.$connect()

    // Pega a primeira organização (ajuste conforme necessário)
    const org = await prisma.organization.findFirst()
    if (!org) {
      console.error('❌ Nenhuma organização encontrada')
      process.exit(1)
    }

    console.log(`\n📊 Diagnóstico Financeiro - ${org.name}\n`)

    // Mês atual
    const now = new Date()
    const monthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0
    )
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    )

    console.log(
      `📅 Período: ${monthStart.toLocaleDateString('pt-BR')} a ${monthEnd.toLocaleDateString('pt-BR')}\n`
    )

    // 1. Transações confirmadas do período
    const confirmedIncomes = await prisma.transaction.aggregate({
      where: {
        orgId: org.id,
        type: TransactionType.INCOME,
        status: TransactionStatus.CONFIRMED,
        date: { gte: monthStart, lte: monthEnd },
        deletedAt: null,
      },
      _sum: { amount: true },
      _count: true,
    })

    const confirmedExpenses = await prisma.transaction.aggregate({
      where: {
        orgId: org.id,
        type: TransactionType.EXPENSE,
        status: TransactionStatus.CONFIRMED,
        date: { gte: monthStart, lte: monthEnd },
        deletedAt: null,
      },
      _sum: { amount: true },
      _count: true,
    })

    console.log('💰 TRANSAÇÕES CONFIRMADAS DO PERÍODO:')
    console.log(
      `   Receitas: R$ ${(confirmedIncomes._sum.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${confirmedIncomes._count} registros)`
    )
    console.log(
      `   Despesas: R$ ${(confirmedExpenses._sum.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${confirmedExpenses._count} registros)\n`
    )

    // 2. Invoices do período
    const openInvoices = await prisma.invoice.aggregate({
      where: {
        orgId: org.id,
        status: 'OPEN',
        deletedAt: null,
        dueDate: { gte: monthStart, lte: monthEnd },
      },
      _sum: { total: true },
      _count: true,
    })

    const overdueInvoices = await prisma.invoice.aggregate({
      where: {
        orgId: org.id,
        status: 'OVERDUE',
        deletedAt: null,
        dueDate: { gte: monthStart, lte: monthEnd },
      },
      _sum: { total: true },
      _count: true,
    })

    const paidInvoices = await prisma.invoice.aggregate({
      where: {
        orgId: org.id,
        status: 'PAID',
        deletedAt: null,
        paidAt: { gte: monthStart, lte: monthEnd },
      },
      _sum: { total: true },
      _count: true,
    })

    console.log('📋 INVOICES DO PERÍODO:')
    console.log(
      `   Em Aberto: R$ ${(openInvoices._sum.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${openInvoices._count} registros)`
    )
    console.log(
      `   Atrasadas: R$ ${(overdueInvoices._sum.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${overdueInvoices._count} registros)`
    )
    console.log(
      `   Pagas: R$ ${(paidInvoices._sum.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${paidInvoices._count} registros)\n`
    )

    // 3. Dados da API
    const dashboard = await ReportingService.getDashboard(
      org.id,
      monthStart,
      monthEnd
    )

    console.log('🎯 DADOS DO DASHBOARD (API):')
    console.log(
      `   Receitas: R$ ${(dashboard.financial.totalIncome || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    )
    console.log(
      `   Despesas: R$ ${(dashboard.financial.totalExpense || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    )
    console.log(
      `   Lucro Líquido: R$ ${(dashboard.financial.netProfit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    )
    console.log(
      `   Pendente (Receita): R$ ${(dashboard.financial.pendingIncome || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    )
    console.log(
      `   Pendente (Despesa): R$ ${(dashboard.financial.pendingExpense || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`
    )

    console.log('📊 PROJEÇÕES:')
    console.log(
      `   Lucro Previsto: R$ ${(dashboard.projections?.projectedNetProfit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    )
    console.log(
      `   Em Caixa (Monthly): R$ ${(dashboard.projections?.cashOnHandMonthly || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    )
    console.log(
      `   Caixa (Histórico): R$ ${(dashboard.projections?.cashOnHand || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    )
    console.log(
      `   A Receber: R$ ${(dashboard.invoices.totalReceivable || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`
    )

    // 4. Verificações
    console.log('🔍 VALIDAÇÕES:')

    const transactionSum =
      (confirmedIncomes._sum.amount || 0) - (confirmedExpenses._sum.amount || 0)
    const invoiceSum =
      (openInvoices._sum.total || 0) + (overdueInvoices._sum.total || 0)
    const expectedLucroPrevisto =
      invoiceSum - (confirmedExpenses._sum.amount || 0)

    const cashMatch =
      Math.abs(
        transactionSum - (dashboard.projections?.cashOnHandMonthly || 0)
      ) < 0.01
    const lucroPrevisoMatch =
      Math.abs(
        expectedLucroPrevisto - (dashboard.projections?.projectedNetProfit || 0)
      ) < 0.01

    console.log(
      `   ✓ Cálculo "Em Caixa": ${cashMatch ? '✅ CORRETO' : '❌ DIVERGÊNCIA'} (esperado: R$ ${transactionSum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`
    )
    console.log(
      `   ✓ Cálculo "Lucro Previsto": ${lucroPrevisoMatch ? '✅ CORRETO' : '❌ DIVERGÊNCIA'} (esperado: R$ ${expectedLucroPrevisto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`
    )

    console.log('\n✅ Diagnóstico concluído!\n')
  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
