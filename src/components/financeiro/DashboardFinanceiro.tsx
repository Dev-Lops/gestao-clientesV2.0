'use client'

import { InvoiceStatusGrid } from '@/components/financeiro/InvoiceStatusGrid'
import { MetricCard } from '@/components/financeiro/MetricCard'
import { OverdueInvoicesList } from '@/components/financeiro/OverdueInvoicesList'
import { TopClientsCard } from '@/components/financeiro/TopClientsCard'
import { FinancialFilter } from '@/components/financeiro/FinancialFilter'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DataLoader, PartialDataLoader } from '@/components/DataLoader'
import { CardGridSkeleton, TableSkeleton, ChartSkeleton } from '@/components/ui/skeleton-loaders'
import { useFetchData, clearDataCache } from '@/hooks/useFetchData'
import { formatCurrency } from '@/lib/utils'
import { AlertCircle, DollarSign, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { useState, useCallback } from 'react'
import { FinancialAlerts } from './FinancialAlerts'
import { FinancialHealth } from './FinancialHealth'

const MONTHS_NAMES = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
]

export function DashboardFinanceiro() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  console.debug('[DashboardFinanceiro] render state ->', { year, month })

  const dashboardUrl = `/api/reports/dashboard?year=${year}&month=${month}`
  const summaryUrl = `/api/reports/summary?year=${year}`

  const {
    data: dashboardData,
    loading: loadingDashboard,
    error: errorDashboard,
    refetch: refetchDashboard,
    isRefetching: isRefetchingDashboard,
  } = useFetchData(dashboardUrl, { cacheTime: 5 * 60 * 1000 })

  const {
    data: globalSummary,
    error: errorSummary,
    refetch: refetchSummary,
    isRefetching: isRefetchingSummary,
  } = useFetchData(summaryUrl, { cacheTime: 10 * 60 * 1000 })

  const handlePeriodChange = useCallback(
    (newYear: number, newMonth: number) => {
      console.debug('[DashboardFinanceiro] handlePeriodChange ->', { newYear, newMonth })
      setYear(newYear)
      setMonth(newMonth)
      clearDataCache('dashboard')
      clearDataCache('summary')
    },
    [setYear, setMonth]
  )

  const handleRefresh = useCallback(async () => {
    clearDataCache('dashboard')
    clearDataCache('summary')
    await Promise.all([refetchDashboard(), refetchSummary()])
  }, [refetchDashboard, refetchSummary])

  // Estados de erro
  const hasError = errorDashboard || errorSummary
  if (hasError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {errorDashboard?.message || errorSummary?.message || 'Erro ao carregar dashboard'}
        </AlertDescription>
      </Alert>
    )
  }

  const { financial, invoices, overdue, topClients, recentActivity, projections } = dashboardData || {}

  return (
    <div className="space-y-8">
      <DataLoader
        loading={loadingDashboard}
        error={errorDashboard}
        data={dashboardData}
        skeleton={<div className="h-24 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />}
      >
        <FinancialAlerts />
      </DataLoader>

      <FinancialFilter
        year={year}
        month={month}
        onPeriodChange={handlePeriodChange}
        onRefresh={handleRefresh}
        loading={isRefetchingDashboard || isRefetchingSummary}
        data={dashboardData || undefined}
      />

      <DataLoader
        loading={loadingDashboard}
        error={errorDashboard}
        data={dashboardData}
        skeleton={<CardGridSkeleton columns={4} count={4} />}
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Receitas"
            value={financial?.totalIncome || 0}
            subtitle={`Pendente: ${formatCurrency(financial?.pendingIncome || 0)}`}
            type="income"
            icon={<TrendingUp className="h-5 w-5" />}
            delay={0}
          />
          <MetricCard
            title="Despesas"
            value={financial?.totalExpense || 0}
            subtitle={`Pendente: ${formatCurrency(financial?.pendingExpense || 0)}`}
            type="expense"
            icon={<TrendingDown className="h-5 w-5" />}
            delay={0.1}
          />
          <MetricCard
            title="Lucro Líquido"
            value={financial?.netProfit || 0}
            subtitle={`Margem: ${(financial?.profitMargin || 0).toFixed(1)}%`}
            type="profit"
            icon={<DollarSign className="h-5 w-5" />}
            delay={0.2}
          />
          <MetricCard
            title="A Receber"
            value={invoices?.totalReceivable || 0}
            subtitle={`${invoices?.open?.count || 0} faturas em aberto`}
            type="receivable"
            icon={<Wallet className="h-5 w-5" />}
            delay={0.3}
          />
        </div>
      </DataLoader>

      {projections && financial && (
        <div className="grid gap-6 md:grid-cols-2">
          <MetricCard
            title="Lucro Previsto"
            value={projections.projectedNetProfit}
            subtitle={`Abertas − (Não-fixas confirmadas + Fixas pendentes). Faltam fixas: ${formatCurrency(projections.pendingFixed)}`}
            type="profit"
            icon={<DollarSign className="h-5 w-5" />}
          />
          {typeof projections.cashOnHandMonthly === 'number' && (
            <MetricCard
              title="Em Caixa"
              value={projections.cashOnHandMonthly}
              subtitle="Receitas − Despesas (mês selecionado). Base mensal para conferência."
              type="receivable"
              icon={<Wallet className="h-5 w-5" />}
            />
          )}
          <Card size="md" className="border-2 border-border/50 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold">Resumo Despesas do Mês</CardTitle>
              <CardDescription className="text-sm">Total e principais categorias</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">Total de despesas</span>
                <span className="text-base font-semibold">{formatCurrency(financial.totalExpense)}</span>
              </div>
              {(() => {
                const items = (financial.byCategory || []).filter((x) => x.type === 'EXPENSE')
                if (!items.length) {
                  return <div className="text-sm text-muted-foreground">Sem despesas neste período.</div>
                }
                const top = items.slice(0, 5)
                return (
                  <div className="space-y-2">
                    {top.map((c) => (
                      <div key={`${c.category}-${c.amount}`} className="flex items-center justify-between">
                        <span className="text-sm">{c.category}</span>
                        <Badge variant="outline">{formatCurrency(c.amount)}</Badge>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        </div>
      )}

      {globalSummary && (
        <Card size="md" className="border-2 border-border/50 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold">Resumo Geral da Empresa</CardTitle>
            <CardDescription className="text-sm">Visão histórica e desempenho no ano selecionado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Receita Total (Histórico)"
                value={globalSummary.overall.totalIncome}
                subtitle={`${globalSummary.overall.incomeCount} entradas`}
                type="income"
                icon={<TrendingUp className="h-5 w-5" />}
              />
              <MetricCard
                title="Despesa Total (Histórico)"
                value={globalSummary.overall.totalExpense}
                subtitle={`${globalSummary.overall.expenseCount} saídas`}
                type="expense"
                icon={<TrendingDown className="h-5 w-5" />}
              />
              <MetricCard
                title="Lucro Acumulado"
                value={globalSummary.overall.netProfit}
                subtitle={`Margem ${globalSummary.overall.profitMargin.toFixed(1)}%`}
                type="profit"
                icon={<DollarSign className="h-5 w-5" />}
              />
              <MetricCard
                title="Margem Histórica"
                value={globalSummary.overall.profitMargin}
                subtitle={`Primeira: ${globalSummary.overall.firstDate || '-'} | Última: ${globalSummary.overall.lastDate || '-'}`}
                type="profit"
                icon={<DollarSign className="h-5 w-5" />}
              />
            </div>

            <div className="rounded-xl border p-4 bg-gradient-to-br from-background via-background to-muted/20">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">Desempenho Mensal ({globalSummary.year.year})</span>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  {(() => {
                    const m = globalSummary.monthly
                    if (!m || m.length === 0) return null
                    const best = m.reduce((a, b) => (b.net > a.net ? b : a))
                    const worst = m.reduce((a, b) => (b.net < a.net ? b : a))
                    const avgIncome = m.reduce((s, x) => s + x.income, 0) / m.length
                    return (
                      <>
                        <Badge variant="outline">Melhor: {MONTHS_NAMES[best.month - 1]}</Badge>
                        <Badge variant="outline">Pior: {MONTHS_NAMES[worst.month - 1]}</Badge>
                        <Badge variant="outline">Média Receita: {formatCurrency(avgIncome)}</Badge>
                      </>
                    )
                  })()}
                </div>
              </div>
              {(() => {
                const m = globalSummary.monthly
                if (!m || m.length === 0) return <div className="text-sm text-muted-foreground">Sem dados para o ano.</div>
                const values = m.map((x) => x.net)
                const w = 520
                const h = 60
                const min = Math.min(...values, 0)
                const max = Math.max(...values, 0)
                const range = max - min || 1
                const stepX = w / (values.length - 1 || 1)
                const points = values
                  .map((v, i) => {
                    const x = i * stepX
                    const y = h - ((v - min) / range) * h
                    return `${x},${y}`
                  })
                  .join(' ')
                return (
                  <div className="space-y-2">
                    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-16">
                      <polyline
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-primary"
                        points={points}
                      />
                    </svg>
                  </div>
                )
              })()}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <TopClientsCard
                title="Top Receita"
                items={topClients?.byRevenue || []}
                type="revenue"
              />
              <TopClientsCard
                title="Top Inadimplência"
                items={topClients?.byOverdue || []}
                type="overdue"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <DataLoader
          loading={loadingDashboard}
          error={errorDashboard}
          data={dashboardData}
          skeleton={<CardGridSkeleton columns={2} count={2} />}
        >
          <InvoiceStatusGrid invoices={dashboardData?.invoices} />
        </DataLoader>

        <DataLoader
          loading={loadingDashboard}
          error={errorDashboard}
          data={dashboardData}
          skeleton={<TableSkeleton rows={4} />}
        >
          <OverdueInvoicesList overdue={overdue || []} />
        </DataLoader>
      </div>

      <PartialDataLoader
        isRefetching={isRefetchingDashboard || isRefetchingSummary}
        showSkeletonWhileLoading={false}
        skeleton={<ChartSkeleton />}
      >
        <FinancialHealth data={dashboardData?.financial || null} />
      </PartialDataLoader>

      <DataLoader
        loading={loadingDashboard}
        error={errorDashboard}
        data={dashboardData}
        skeleton={<TableSkeleton rows={5} />}
      >
        <Card size="md" className="border-2 border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Atividades Recentes</CardTitle>
            <CardDescription className="text-sm">Pagamentos, faturas e lançamentos confirmados</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/40 transition-colors"
                  >
                    <div>
                      <div className="text-sm font-semibold">{item.description || item.type}</div>
                      <div className="text-xs text-muted-foreground">{item.status}</div>
                    </div>
                    <div className="text-sm font-bold">{formatCurrency(item.amount)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Sem atividades recentes.</div>
            )}
          </CardContent>
        </Card>
      </DataLoader>
    </div>
  )
}
