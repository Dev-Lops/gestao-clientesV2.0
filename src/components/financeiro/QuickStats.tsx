'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils'
import { DollarSign, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'

interface QuickStatsData {
  totalIncome: number
  totalExpense: number
  netProfit: number
  totalReceivable: number
  pendingExpense?: number
  projectedNetProfit?: number
  cashOnHand?: number
  cashOnHandMonthly?: number
}

export function QuickStats() {
  const [data, setData] = useState<QuickStatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const year = new Date().getFullYear()
      const month = new Date().getMonth() + 1
      const response = await fetch(`/api/reports/dashboard?year=${year}&month=${month}`)

      if (!response.ok) throw new Error('Erro ao carregar estatísticas')

      const result = await response.json()
      // ApiResponseHandler retorna { data: { financial, invoices, projections } }
      const dashboardData = result.data || result
      setData({
        totalIncome: dashboardData.financial?.totalIncome || 0,
        totalExpense: dashboardData.financial?.totalExpense || 0,
        netProfit: dashboardData.financial?.netProfit || 0,
        totalReceivable: dashboardData.invoices?.totalReceivable || 0,
        pendingExpense: dashboardData.financial?.pendingExpense ?? 0,
        projectedNetProfit: dashboardData.projections?.projectedNetProfit ?? undefined,
        cashOnHand: dashboardData.projections?.cashOnHand ?? undefined,
        cashOnHandMonthly: dashboardData.projections?.cashOnHandMonthly ?? undefined,
      })
    } catch (err) {
      console.error('Erro ao carregar quick stats:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} size="sm" className="border-0 shadow-sm">
            <CardContent>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-6 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
      <Card size="sm" className="border-0 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-green-700 dark:text-green-400">Receitas</p>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
          <p className="text-lg font-bold text-green-700">{formatCurrency(data.totalIncome)}</p>
        </CardContent>
      </Card>

      <Card size="sm" className="border-0 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20">
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-red-700 dark:text-red-400">Despesas</p>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </div>
          <p className="text-lg font-bold text-red-700">{formatCurrency(data.totalExpense)}</p>
          {typeof data.pendingExpense === 'number' && data.pendingExpense > 0 && (
            <p className="text-[11px] text-red-700/70 mt-0.5">Pendente: {formatCurrency(data.pendingExpense)}</p>
          )}
        </CardContent>
      </Card>

      <Card size="sm" className={`border-0 shadow-md hover:shadow-lg transition-shadow ${data.netProfit >= 0
        ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20'
        : 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20'
        }`}>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <p className={`text-xs font-medium ${data.netProfit >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-orange-700 dark:text-orange-400'
              }`}>
              Lucro
            </p>
            <DollarSign className={`h-4 w-4 ${data.netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'
              }`} />
          </div>
          <p className={`text-lg font-bold ${data.netProfit >= 0 ? 'text-blue-700' : 'text-orange-700'
            }`}>
            {formatCurrency(data.netProfit)}
          </p>
          {typeof data.projectedNetProfit === 'number' && (
            <p className="text-[11px] text-muted-foreground mt-0.5">Previsto: {formatCurrency(data.projectedNetProfit)}</p>
          )}
        </CardContent>
      </Card>

      <Card size="sm" className="border-0 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-purple-700 dark:text-purple-400">A Receber</p>
            <Wallet className="h-4 w-4 text-purple-600" />
          </div>
          <p className="text-lg font-bold text-purple-700">{formatCurrency(data.totalReceivable)}</p>
        </CardContent>
      </Card>
      {typeof data.cashOnHandMonthly === 'number' && (
        <Card size="sm" className="border-0 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-slate-50 to-zinc-50 dark:from-slate-950/20 dark:to-zinc-950/20">
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-400">Em Caixa</p>
              <Wallet className="h-4 w-4 text-slate-600" />
            </div>
            <p className="text-lg font-bold text-slate-700">{formatCurrency(data.cashOnHandMonthly)}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
