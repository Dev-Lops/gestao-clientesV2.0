'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Activity, TrendingDown, TrendingUp } from 'lucide-react'

interface RecentActivityCardProps {
  activities: Array<{
    id: string
    type: string
    description: string | null
    amount: number
    dueDate: Date
    status: string
  }>
}

const statusColors: Record<string, string> = {
  CONFIRMED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  PAID: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  OPEN: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
}

const statusLabels: Record<string, string> = {
  CONFIRMED: 'Confirmado',
  PENDING: 'Pendente',
  CANCELLED: 'Cancelado',
  PAID: 'Pago',
  OPEN: 'Aberto',
  OVERDUE: 'Vencido',
}

export function RecentActivityCard({ activities }: RecentActivityCardProps) {
  if (activities.length === 0) {
    return (
      <Card size="md" className="border-2 border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Atividade Recente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="h-16 w-16 mx-auto mb-3 opacity-20" />
            <p className="font-medium">Nenhuma atividade recente</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card size="md" className="border-2 border-border/50 shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 h-1" />
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              Atividade Recente
            </CardTitle>
            <CardDescription className="text-sm">
              Últimas {activities.length} movimentações financeiras
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
          {activities.slice(0, 10).map((activity, index) => {
            const isIncome = activity.type === 'INCOME'

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
              >
                <Card size="sm" className="border hover:shadow-md transition-all duration-200">
                  <CardContent>
                    <div className="flex items-center gap-3">
                      {/* Icon */}
                      <div
                        className={`p-2.5 rounded-xl shadow-sm flex-shrink-0 ${isIncome
                          ? 'bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30'
                          : 'bg-gradient-to-br from-rose-100 to-red-100 dark:from-rose-900/30 dark:to-red-900/30'
                          }`}
                      >
                        {isIncome ? (
                          <TrendingUp
                            className={`h-4 w-4 ${isIncome
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                              }`}
                          />
                        ) : (
                          <TrendingDown
                            className={`h-4 w-4 ${isIncome
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                              }`}
                          />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate mb-1">
                          {activity.description || 'Sem descrição'}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground">
                            {new Date(activity.dueDate).toLocaleDateString(
                              'pt-BR',
                              {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              }
                            )}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-xs font-medium ${statusColors[activity.status] ||
                              'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                              }`}
                          >
                            {statusLabels[activity.status] || activity.status}
                          </Badge>
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="text-right flex-shrink-0">
                        <p
                          className={`text-base font-bold ${isIncome
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                            }`}
                        >
                          {isIncome ? '+' : '-'}
                          {formatCurrency(activity.amount)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {activities.length > 10 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-center text-muted-foreground">
              Exibindo 10 de {activities.length} atividades
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Custom scrollbar CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: hsl(var(--muted-foreground) / 0.3);
      border-radius: 3px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: hsl(var(--muted-foreground) / 0.5);
    }
  `
  document.head.appendChild(style)
}
