'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { formatCurrency } from '@/lib/utils'
import { AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react'

interface FinancialHealthProps {
  data?: {
    totalIncome: number
    totalExpense: number
    netProfit: number
    profitMargin: number
    pendingIncome: number
    pendingExpense: number
  } | null
}

export function FinancialHealth({ data }: FinancialHealthProps) {
  if (!data) {
    return null
  }

  const { totalIncome, totalExpense, netProfit, profitMargin, pendingIncome, pendingExpense } = data

  // Calcular saúde financeira (0-100)
  const healthScore = Math.min(100, Math.max(0,
    50 + // Base score
    (profitMargin > 0 ? 30 : -20) + // Margem positiva
    (netProfit > 0 ? 20 : -10) + // Lucro positivo
    (pendingIncome < totalIncome * 0.3 ? 10 : -5) - // Pendências baixas
    (pendingExpense > totalExpense * 0.5 ? 10 : 0) // Despesas pendentes altas
  ))

  const getHealthStatus = (score: number) => {
    if (score >= 80) return { label: 'Excelente', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle }
    if (score >= 60) return { label: 'Bom', color: 'text-blue-600', bg: 'bg-blue-100', icon: TrendingUp }
    if (score >= 40) return { label: 'Regular', color: 'text-yellow-600', bg: 'bg-yellow-100', icon: Clock }
    return { label: 'Atenção', color: 'text-red-600', bg: 'bg-red-100', icon: AlertTriangle }
  }

  const status = getHealthStatus(healthScore)
  const StatusIcon = status.icon

  // Calcular taxa de conversão de pendente para confirmado
  const incomeConversionRate = totalIncome > 0 ? ((totalIncome - pendingIncome) / totalIncome * 100) : 0
  const expensePaymentRate = totalExpense > 0 ? ((totalExpense - pendingExpense) / totalExpense * 100) : 0

  return (
    <Card size="md" className="border-0 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Saúde Financeira
              <Badge className={`${status.bg} ${status.color}`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {status.label}
              </Badge>
            </CardTitle>
            <CardDescription>Análise da situação financeira atual</CardDescription>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold ${status.color}`}>{healthScore.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">Pontuação</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Barra de Saúde */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Score Geral</span>
            <span className={`font-medium ${status.color}`}>{healthScore.toFixed(0)}/100</span>
          </div>
          <Progress value={healthScore} className={`h-2 ${healthScore >= 80 ? '[&>div]:bg-green-600' :
            healthScore >= 60 ? '[&>div]:bg-blue-600' :
              healthScore >= 40 ? '[&>div]:bg-yellow-600' :
                '[&>div]:bg-red-600'
            }`} />
        </div>

        {/* Métricas Detalhadas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Taxa de Recebimento</span>
              <span className="font-medium text-green-600">{incomeConversionRate.toFixed(1)}%</span>
            </div>
            <Progress value={incomeConversionRate} className="h-2 [&>div]:bg-green-600" />
            <p className="text-xs text-muted-foreground">
              Confirmado: {formatCurrency(totalIncome - pendingIncome)}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Taxa de Pagamento</span>
              <span className="font-medium text-blue-600">{expensePaymentRate.toFixed(1)}%</span>
            </div>
            <Progress value={expensePaymentRate} className="h-2 [&>div]:bg-blue-600" />
            <p className="text-xs text-muted-foreground">
              Pago: {formatCurrency(totalExpense - pendingExpense)}
            </p>
          </div>
        </div>

        {/* Indicadores */}
        <div className="grid grid-cols-2 gap-3">
          <div className={`p-2 rounded-lg ${netProfit >= 0 ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'}`}>
            <p className="text-xs text-muted-foreground mb-1">Resultado</p>
            <p className={`text-lg font-bold ${netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {formatCurrency(netProfit)}
            </p>
            <p className="text-xs text-muted-foreground">
              Margem: {profitMargin.toFixed(1)}%
            </p>
          </div>

          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
            <p className="text-xs text-muted-foreground mb-1">Eficiência</p>
            <p className="text-lg font-bold text-blue-700">
              {totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100).toFixed(1) : 0}%
            </p>
            <p className="text-xs text-muted-foreground">
              Relação Receita/Despesa
            </p>
          </div>
        </div>

        {/* Alertas */}
        {pendingIncome > totalIncome * 0.5 && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                Alta taxa de receita pendente
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                {formatCurrency(pendingIncome)} em receitas ainda não confirmadas
              </p>
            </div>
          </div>
        )}

        {netProfit < 0 && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900 dark:text-red-100">
                Resultado negativo no período
              </p>
              <p className="text-xs text-red-700 dark:text-red-300">
                Despesas excederam as receitas em {formatCurrency(Math.abs(netProfit))}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
