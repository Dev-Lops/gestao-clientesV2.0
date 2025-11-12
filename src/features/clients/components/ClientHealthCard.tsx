'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, CheckCircle, TrendingDown, TrendingUp } from 'lucide-react'

export interface ClientHealthMetrics {
  clientId: string
  clientName: string
  completionRate: number
  balance: number
  daysActive: number
  tasksTotal: number
  tasksCompleted: number
  tasksPending: number
  tasksOverdue?: number
}

interface ClientHealthCardProps {
  metrics: ClientHealthMetrics
  variant?: 'compact' | 'detailed'
  onClientClick?: (clientId: string) => void
}

export function ClientHealthCard({ metrics, variant = 'detailed', onClientClick }: ClientHealthCardProps) {
  // Calcular indicadores de saúde
  const healthScore = calculateHealthScore(metrics)
  const bottlenecks = identifyBottlenecks(metrics)
  const status = getHealthStatus(healthScore)

  const handleClick = () => {
    if (onClientClick) {
      onClientClick(metrics.clientId)
    }
  }

  if (variant === 'compact') {
    return (
      <Card
        className={`relative overflow-hidden border-2 transition-all duration-200 hover:shadow-lg ${onClientClick ? 'cursor-pointer hover:-translate-y-1' : ''
          } ${getStatusBorderColor(status)}`}
        onClick={handleClick}
      >
        <div className={`absolute top-0 left-0 w-full h-1 ${getStatusGradient(status)}`} />
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 dark:text-white truncate">{metrics.clientName}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{metrics.daysActive} dias ativo</p>
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(status)}`}>
              {status === 'critical' && <AlertTriangle className="h-3 w-3" />}
              {status === 'warning' && <TrendingDown className="h-3 w-3" />}
              {status === 'good' && <TrendingUp className="h-3 w-3" />}
              {status === 'excellent' && <CheckCircle className="h-3 w-3" />}
              <span>{healthScore}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
              <div className="text-lg font-bold text-blue-600">{metrics.completionRate}%</div>
              <p className="text-xs text-slate-600 dark:text-slate-400">Conclusão</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
              <div className={`text-lg font-bold ${metrics.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(metrics.balance)}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">Saldo</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
              <div className="text-lg font-bold text-amber-600">{metrics.tasksPending}</div>
              <p className="text-xs text-slate-600 dark:text-slate-400">Pendentes</p>
            </div>
          </div>

          {bottlenecks.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                <span className="font-medium truncate">{bottlenecks[0]}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`relative overflow-hidden border-2 shadow-xl ${getStatusBorderColor(status)}`}>
      <div className={`absolute top-0 left-0 w-full h-2 ${getStatusGradient(status)}`} />
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">{metrics.clientName}</CardTitle>
            <p className="text-sm text-slate-500 mt-1">Cliente há {metrics.daysActive} dias</p>
          </div>
          <div className={`px-4 py-2 rounded-full text-sm font-bold ${getStatusBadgeColor(status)}`}>
            Score: {healthScore}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Métricas principais */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-200">
            <div className="text-3xl font-bold text-blue-600">{metrics.completionRate}%</div>
            <p className="text-xs text-slate-600 mt-1">Taxa de Conclusão</p>
            <p className="text-xs text-slate-500 mt-0.5">{metrics.tasksCompleted}/{metrics.tasksTotal}</p>
          </div>
          <div className={`text-center p-4 rounded-lg border ${metrics.balance >= 0
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
            }`}>
            <div className={`text-2xl font-bold ${metrics.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.balance)}
            </div>
            <p className="text-xs text-slate-600 mt-1">Balanço</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-amber-50 border border-amber-200">
            <div className="text-3xl font-bold text-amber-600">{metrics.tasksPending}</div>
            <p className="text-xs text-slate-600 mt-1">Tarefas Pendentes</p>
          </div>
        </div>

        {/* Status geral */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Status Geral</p>
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${getStatusDotColor(status)}`} />
            <span className="text-base font-semibold text-slate-900">{getStatusLabel(status)}</span>
          </div>
        </div>

        {/* Gargalos identificados */}
        {bottlenecks.length > 0 && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-semibold text-red-900">Gargalos Identificados</span>
            </div>
            <ul className="space-y-1.5">
              {bottlenecks.map((bottleneck, idx) => (
                <li key={idx} className="text-xs text-red-700 flex items-start gap-1.5">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>{bottleneck}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Funções auxiliares
function calculateHealthScore(metrics: ClientHealthMetrics): number {
  let score = 0

  // Taxa de conclusão (0-40 pontos)
  score += metrics.completionRate * 0.4

  // Saldo financeiro (0-30 pontos)
  if (metrics.balance >= 5000) score += 30
  else if (metrics.balance >= 0) score += 20
  else if (metrics.balance >= -2000) score += 10

  // Tarefas pendentes (0-30 pontos)
  const pendingRatio = metrics.tasksTotal > 0 ? metrics.tasksPending / metrics.tasksTotal : 0
  if (pendingRatio <= 0.2) score += 30
  else if (pendingRatio <= 0.4) score += 20
  else if (pendingRatio <= 0.6) score += 10

  return Math.round(score)
}

function identifyBottlenecks(metrics: ClientHealthMetrics): string[] {
  const bottlenecks: string[] = []

  if (metrics.completionRate < 50) {
    bottlenecks.push(`Taxa de conclusão baixa (${metrics.completionRate}%)`)
  }

  if (metrics.balance < -1000) {
    bottlenecks.push(`Saldo negativo de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(metrics.balance))}`)
  }

  if (metrics.tasksPending > 10) {
    bottlenecks.push(`${metrics.tasksPending} tarefas pendentes acumuladas`)
  }

  if (metrics.tasksOverdue && metrics.tasksOverdue > 0) {
    bottlenecks.push(`${metrics.tasksOverdue} tarefas atrasadas`)
  }

  const pendingRatio = metrics.tasksTotal > 0 ? metrics.tasksPending / metrics.tasksTotal : 0
  if (pendingRatio > 0.6) {
    bottlenecks.push(`Mais de 60% das tarefas ainda pendentes`)
  }

  return bottlenecks
}

function getHealthStatus(score: number): 'critical' | 'warning' | 'good' | 'excellent' {
  if (score >= 80) return 'excellent'
  if (score >= 60) return 'good'
  if (score >= 40) return 'warning'
  return 'critical'
}

function getStatusLabel(status: string): string {
  const labels = {
    excellent: 'Excelente',
    good: 'Bom',
    warning: 'Atenção Necessária',
    critical: 'Crítico'
  }
  return labels[status as keyof typeof labels] || 'Desconhecido'
}

function getStatusBorderColor(status: string): string {
  const colors = {
    excellent: 'border-green-200/60 shadow-green-200/50',
    good: 'border-blue-200/60 shadow-blue-200/50',
    warning: 'border-amber-200/60 shadow-amber-200/50',
    critical: 'border-red-200/60 shadow-red-200/50'
  }
  return colors[status as keyof typeof colors] || 'border-slate-200/60'
}

function getStatusGradient(status: string): string {
  const gradients = {
    excellent: 'bg-linear-to-r from-green-500 to-emerald-500',
    good: 'bg-linear-to-r from-blue-500 to-cyan-500',
    warning: 'bg-linear-to-r from-amber-500 to-orange-500',
    critical: 'bg-linear-to-r from-red-500 to-rose-500'
  }
  return gradients[status as keyof typeof gradients] || 'bg-linear-to-r from-slate-500 to-slate-600'
}

function getStatusBadgeColor(status: string): string {
  const colors = {
    excellent: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    good: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  }
  return colors[status as keyof typeof colors] || 'bg-slate-100 text-slate-700'
}

function getStatusDotColor(status: string): string {
  const colors = {
    excellent: 'bg-green-500',
    good: 'bg-blue-500',
    warning: 'bg-amber-500',
    critical: 'bg-red-500'
  }
  return colors[status as keyof typeof colors] || 'bg-slate-500'
}
