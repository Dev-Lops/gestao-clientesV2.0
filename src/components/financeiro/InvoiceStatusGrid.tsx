'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText
} from 'lucide-react'

interface InvoiceStatusGridProps {
  invoices?: {
    open?: { count: number; total: number }
    paid?: { count: number; total: number }
    overdue?: { count: number; total: number }
    cancelled?: { count: number; total: number }
  } | null
}

const statusConfig = [
  {
    key: 'open',
    label: 'Em Aberto',
    icon: Clock,
    gradient: 'from-amber-500 to-orange-500',
    bg: 'from-amber-50/80 to-orange-50/80 dark:from-amber-950/30 dark:to-orange-950/30',
    iconBg: 'bg-amber-100 dark:bg-amber-900/40',
    textColor: 'text-amber-700 dark:text-amber-400',
    valueColor: 'text-amber-900 dark:text-amber-100',
    border: 'border-amber-300/50 dark:border-amber-700/50',
  },
  {
    key: 'paid',
    label: 'Pagas',
    icon: CheckCircle,
    gradient: 'from-emerald-500 to-green-500',
    bg: 'from-emerald-50/80 to-green-50/80 dark:from-emerald-950/30 dark:to-green-950/30',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    textColor: 'text-emerald-700 dark:text-emerald-400',
    valueColor: 'text-emerald-900 dark:text-emerald-100',
    border: 'border-emerald-300/50 dark:border-emerald-700/50',
  },
  {
    key: 'overdue',
    label: 'Vencidas',
    icon: AlertTriangle,
    gradient: 'from-rose-500 to-red-500',
    bg: 'from-rose-50/80 to-red-50/80 dark:from-rose-950/30 dark:to-red-950/30',
    iconBg: 'bg-rose-100 dark:bg-rose-900/40',
    textColor: 'text-rose-700 dark:text-rose-400',
    valueColor: 'text-rose-900 dark:text-rose-100',
    border: 'border-rose-300/50 dark:border-rose-700/50',
  },
  {
    key: 'cancelled',
    label: 'Canceladas',
    icon: AlertCircle,
    gradient: 'from-slate-500 to-gray-500',
    bg: 'from-slate-50/80 to-gray-50/80 dark:from-slate-950/30 dark:to-gray-950/30',
    iconBg: 'bg-slate-100 dark:bg-slate-900/40',
    textColor: 'text-slate-700 dark:text-slate-400',
    valueColor: 'text-slate-900 dark:text-slate-100',
    border: 'border-slate-300/50 dark:border-slate-700/50',
  },
]

export function InvoiceStatusGrid({ invoices }: InvoiceStatusGridProps) {
  if (!invoices) {
    return null
  }
  return (
    <Card size="md" className="border-2 border-border/50 shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-1" />
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Status das Faturas
            </CardTitle>
            <CardDescription className="text-sm">
              Visão geral completa do status de todas as faturas
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statusConfig.map((status, index) => {
            const Icon = status.icon
            const data = invoices[status.key as keyof typeof invoices]
            const count = data?.count ?? 0
            const total = data?.total ?? 0

            return (
              <motion.div
                key={status.key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card
                  size="sm"
                  className={`relative overflow-hidden border-2 ${status.border} bg-gradient-to-br ${status.bg} hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group`}
                >
                  {/* Top gradient accent */}
                  <div
                    className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${status.gradient}`}
                  />

                  <CardContent>
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`p-3 rounded-xl ${status.iconBg} shadow-sm group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Icon className={`h-6 w-6 ${status.textColor}`} />
                      </div>
                      <Badge
                        variant="secondary"
                        className={`${status.textColor} bg-white/50 dark:bg-black/20 text-xs font-bold`}
                      >
                        {count}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <p
                        className={`text-xs font-semibold uppercase tracking-wider ${status.textColor}`}
                      >
                        {status.label}
                      </p>
                      <p className={`text-2xl font-black ${status.valueColor}`}>
                        {formatCurrency(total)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {count} {count === 1 ? 'fatura' : 'faturas'}
                      </p>
                    </div>

                    {/* Shine effect (visual only, non-interactive) */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
