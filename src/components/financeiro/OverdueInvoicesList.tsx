'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Mail,
  Phone
} from 'lucide-react'

interface OverdueInvoicesListProps {
  overdue?: Array<{
    id: string
    number: string
    clientId: string
    client: {
      id: string
      name: string
      email: string | null
      phone: string | null
    }
    total: number
    dueDate: Date
    daysLate: number
  }>
}

export function OverdueInvoicesList({ overdue }: OverdueInvoicesListProps) {
  if (!overdue || overdue.length === 0) {
    return (
      <Card size="md" className="border-2 border-emerald-200/50 dark:border-emerald-800/50 bg-gradient-to-br from-emerald-50/80 to-green-50/80 dark:from-emerald-950/30 dark:to-green-950/30 shadow-lg">
        <CardContent className="py-16">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 mb-4 shadow-lg"
            >
              <CheckCircle className="h-10 w-10 text-white" />
            </motion.div>
            <h3 className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mb-2">
              Tudo em Dia! 🎉
            </h3>
            <p className="text-muted-foreground">
              Nenhuma fatura vencida. Todos os pagamentos estão em dia!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalOverdue = overdue.reduce((sum, inv) => sum + inv.total, 0)
  const criticalOverdue = overdue.filter((inv) => inv.daysLate > 30)

  return (
    <Card size="md" className="border-2 border-rose-200/50 dark:border-rose-800/50 shadow-xl">
      <div className="bg-gradient-to-r from-rose-500 via-red-500 to-pink-500 h-1" />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-rose-500 to-red-600 rounded-xl shadow-lg animate-pulse">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                Faturas Vencidas
                <Badge variant="destructive" className="text-sm">
                  {overdue.length}
                </Badge>
              </CardTitle>
              <CardDescription className="text-sm">
                Total vencido: {formatCurrency(totalOverdue)}
              </CardDescription>
            </div>
          </div>
          {criticalOverdue.length > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {criticalOverdue.length} críticas (30+ dias)
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
          {overdue.map((inv, index) => {
            const isCritical = inv.daysLate > 30
            const isUrgent = inv.daysLate > 15

            return (
              <motion.div
                key={inv.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card
                  size="sm"
                  className={`border-2 transition-all duration-300 hover:shadow-lg hover:-translate-x-1 ${isCritical
                    ? 'border-red-400 dark:border-red-700 bg-gradient-to-r from-red-50/80 to-rose-50/80 dark:from-red-950/30 dark:to-rose-950/30'
                    : isUrgent
                      ? 'border-orange-300 dark:border-orange-700 bg-gradient-to-r from-orange-50/80 to-amber-50/80 dark:from-orange-950/30 dark:to-amber-950/30'
                      : 'border-yellow-300 dark:border-yellow-700 bg-gradient-to-r from-yellow-50/80 to-amber-50/80 dark:from-yellow-950/30 dark:to-amber-950/30'
                    }`}
                >
                  <CardContent>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant="outline"
                            className="font-mono font-bold text-xs"
                          >
                            #{inv.number}
                          </Badge>
                          <Badge
                            variant={
                              isCritical
                                ? 'destructive'
                                : isUrgent
                                  ? 'default'
                                  : 'secondary'
                            }
                            className="text-xs font-bold gap-1"
                          >
                            <AlertTriangle className="h-3 w-3" />
                            {inv.daysLate}{' '}
                            {inv.daysLate === 1 ? 'dia' : 'dias'}
                          </Badge>
                        </div>

                        <p className="font-semibold text-sm mb-1 truncate">
                          {inv.client.name}
                        </p>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                          <div className="flex items-center gap-1">
                            <span className="text-rose-600 dark:text-rose-400 font-medium">
                              Venceu:{' '}
                              {new Date(inv.dueDate).toLocaleDateString(
                                'pt-BR'
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {inv.client.phone && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1"
                              asChild
                            >
                              <a href={`tel:${inv.client.phone}`} className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                Ligar
                              </a>
                            </Button>
                          )}
                          {inv.client.email && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1"
                              asChild
                            >
                              <a href={`mailto:${inv.client.email}`} className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                Email
                              </a>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs gap-1 ml-auto"
                            asChild
                          >
                            <a href={`/clients/${inv.clientId}`} className="flex items-center gap-1">
                              Ver cliente
                              <ArrowRight className="h-3 w-3" />
                            </a>
                          </Button>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p
                          className={`text-2xl font-black ${isCritical
                            ? 'text-red-700 dark:text-red-400'
                            : isUrgent
                              ? 'text-orange-700 dark:text-orange-400'
                              : 'text-amber-700 dark:text-amber-400'
                            }`}
                        >
                          {formatCurrency(inv.total)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {overdue.length > 5 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-center text-muted-foreground">
              Exibindo {overdue.length}{' '}
              {overdue.length === 1 ? 'fatura vencida' : 'faturas vencidas'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
