'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Info
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface FinancialAlert {
  id: string
  type: 'warning' | 'success' | 'info' | 'danger'
  title: string
  message: string
  action?: {
    label: string
    href: string
  }
}

export function FinancialAlerts() {
  const [alerts, setAlerts] = useState<FinancialAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      const year = new Date().getFullYear()
      const month = new Date().getMonth() + 1
      const response = await fetch(`/api/reports/dashboard?year=${year}&month=${month}`)

      if (!response.ok) throw new Error('Erro ao carregar alertas')

      const result = await response.json()
      const data = result.data || result
      const newAlerts: FinancialAlert[] = []

      // Alerta: Faturas vencidas
      if (data?.invoices?.overdue?.count > 0) {
        newAlerts.push({
          id: 'overdue',
          type: 'danger',
          title: `${data.invoices.overdue.count} ${data.invoices.overdue.count === 1 ? 'fatura vencida' : 'faturas vencidas'}`,
          message: `Total de ${formatCurrency(data.invoices.overdue.total)} aguardando pagamento`,
          action: {
            label: 'Ver faturas',
            href: '/financeiro?tab=faturas&status=overdue'
          }
        })
      }

      // Alerta: Alta receita pendente
      if (data?.financial?.pendingIncome > (data?.financial?.totalIncome ?? 0) * 0.5) {
        newAlerts.push({
          id: 'pending-income',
          type: 'warning',
          title: 'Alta taxa de receita pendente',
          message: `${formatCurrency(data.financial.pendingIncome)} em receitas ainda não confirmadas`,
          action: {
            label: 'Ver transações',
            href: '/financeiro?tab=transacoes&status=PENDING&type=INCOME'
          }
        })
      }

      // Alerta: Resultado negativo
      if (data?.financial?.netProfit < 0) {
        newAlerts.push({
          id: 'negative-profit',
          type: 'danger',
          title: 'Resultado negativo no período',
          message: `Despesas excederam receitas em ${formatCurrency(Math.abs(data.financial.netProfit))}`,
        })
      }

      // Sucesso: Nenhuma fatura vencida
      if (data?.invoices?.overdue?.count === 0 && data?.invoices?.open?.count > 0) {
        newAlerts.push({
          id: 'all-good',
          type: 'success',
          title: 'Pagamentos em dia!',
          message: 'Nenhuma fatura vencida no momento',
        })
      }

      // Info: Total a receber
      if (data?.invoices?.totalReceivable > 0) {
        newAlerts.push({
          id: 'receivable',
          type: 'info',
          title: 'A receber',
          message: `${formatCurrency(data.invoices.totalReceivable)} em ${data.invoices.open.count} ${data.invoices.open.count === 1 ? 'fatura' : 'faturas'}`,
          action: {
            label: 'Ver faturas',
            href: '/financeiro?tab=faturas&status=OPEN'
          }
        })
      }

      setAlerts(newAlerts)
    } catch (err) {
      console.error('Erro ao carregar alertas:', err)
    } finally {
      setLoading(false)
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'danger': return <AlertTriangle className="h-5 w-5" />
      case 'warning': return <Bell className="h-5 w-5 animate-pulse" />
      case 'success': return <CheckCircle className="h-5 w-5" />
      case 'info': return <Info className="h-5 w-5" />
      default: return <Bell className="h-5 w-5" />
    }
  }

  const getAlertColors = (type: string) => {
    switch (type) {
      case 'danger':
        return {
          border: 'border-rose-500/50 dark:border-rose-700/50',
          bg: 'bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-950/20 dark:to-red-950/20',
          iconBg: 'bg-rose-100 dark:bg-rose-900/40',
          iconColor: 'text-rose-600 dark:text-rose-400',
          accent: 'from-rose-500 to-red-500'
        }
      case 'warning':
        return {
          border: 'border-amber-500/50 dark:border-amber-700/50',
          bg: 'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20',
          iconBg: 'bg-amber-100 dark:bg-amber-900/40',
          iconColor: 'text-amber-600 dark:text-amber-400',
          accent: 'from-amber-500 to-yellow-500'
        }
      case 'success':
        return {
          border: 'border-emerald-500/50 dark:border-emerald-700/50',
          bg: 'bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20',
          iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
          iconColor: 'text-emerald-600 dark:text-emerald-400',
          accent: 'from-emerald-500 to-green-500'
        }
      case 'info':
        return {
          border: 'border-blue-500/50 dark:border-blue-700/50',
          bg: 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20',
          iconBg: 'bg-blue-100 dark:bg-blue-900/40',
          iconColor: 'text-blue-600 dark:text-blue-400',
          accent: 'from-blue-500 to-indigo-500'
        }
      default:
        return {
          border: 'border-gray-500/50',
          bg: 'bg-gray-50',
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600',
          accent: 'from-gray-500 to-gray-500'
        }
    }
  }

  if (loading) {
    return (
      <Card className="border-2 border-border/50 shadow-lg bg-gradient-to-br from-background via-background to-muted/10">
        <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-1 animate-pulse" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5 animate-pulse" />
            Alertas Financeiros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground animate-pulse">Carregando alertas...</p>
        </CardContent>
      </Card>
    )
  }

  if (alerts.length === 0) {
    return null
  }

  return (
    <Card className="border-2 border-border/50 shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-1" />
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Bell className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
                Alertas Financeiros
                <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600">
                  {alerts.length}
                </Badge>
              </CardTitle>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAlerts}
            className="shadow-sm hover:shadow-md transition-all"
          >
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <AnimatePresence>
          {alerts.map((alert, index) => {
            const colors = getAlertColors(alert.type)

            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className={`border-2 ${colors.border} ${colors.bg} overflow-hidden hover:shadow-md transition-all duration-300`}>
                  <div className={`h-1 bg-gradient-to-r ${colors.accent}`} />
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 ${colors.iconBg} rounded-xl shadow-sm flex-shrink-0`}>
                        <div className={colors.iconColor}>
                          {getAlertIcon(alert.type)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm mb-1">{alert.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                        {alert.action && (
                          <Link href={alert.action.href}>
                            <Button
                              variant="link"
                              size="sm"
                              className={`h-auto p-0 ${colors.iconColor} hover:underline`}
                            >
                              {alert.action.label} →
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
