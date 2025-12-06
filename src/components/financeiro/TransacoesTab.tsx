'use client'

import AdvancedFilters from '@/components/financeiro/AdvancedFilters'
import { QuickStats } from '@/components/financeiro/QuickStats'
import { TransactionDetailModal } from '@/components/financeiro/TransactionDetailModal'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { exportTransactions } from '@/lib/export-utils'
import { formatCurrency } from '@/lib/utils'
import { TransactionStatus, TransactionSubtype, TransactionType } from '@prisma/client'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  Calendar,
  DollarSign,
  Download,
  Plus,
  RefreshCw,
  TrendingDown,
  TrendingUp
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { CreateTransactionModal } from './CreateTransactionModal'

interface Transaction {
  id: string
  type: TransactionType
  subtype: TransactionSubtype
  amount: number
  description: string
  category: string | null
  date: string
  status: TransactionStatus
  client?: {
    id: string
    name: string
    email?: string | null
  } | null
  createdAt: string
}

export function TransacoesTab() {
  const searchParams = useSearchParams()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | undefined>()

  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Initialize filters from URL (status, type, dateFrom, dateTo)
  useEffect(() => {
    const s = searchParams?.get('status') || ''
    const t = searchParams?.get('type') || ''
    const df = searchParams?.get('dateFrom') || ''
    const dt = searchParams?.get('dateTo') || ''
    if (s) setStatusFilter(s)
    if (t) setTypeFilter(t)
    if (df) setDateFrom(df)
    if (dt) setDateTo(dt)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(typeFilter && { type: typeFilter }),
        ...(statusFilter && { status: statusFilter }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      })

      const response = await fetch(`/api/transactions?${params}`)

      if (!response.ok) {
        throw new Error('Erro ao carregar transações')
      }

      const result = await response.json()
      // ApiResponseHandler retorna { data: { transactions, meta } } ou { data: [] }
      const data = result.data || result
      setTransactions(Array.isArray(data) ? data : (data.transactions || []))
      const meta = result.meta || data.meta || {}
      setTotalPages(meta.totalPages || result.totalPages || 1)
      setTotalCount(meta.total || result.total || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [page, typeFilter, statusFilter, dateFrom, dateTo])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])



  const handleTransactionCreated = () => {
    setPage(1)
    fetchTransactions()
    toast.success('Transação criada com sucesso!')
  }

  const handleViewTransaction = (id: string) => {
    setSelectedTransactionId(id)
    setDetailModalOpen(true)
  }

  const getStatusBadge = (status: TransactionStatus) => {
    const variants: Record<TransactionStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      CONFIRMED: { variant: 'default', label: 'Confirmado' },
      PENDING: { variant: 'secondary', label: 'Pendente' },
      CANCELLED: { variant: 'destructive', label: 'Cancelado' },
    }

    const config = variants[status] || variants.PENDING
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getTypeBadge = (type: TransactionType) => {
    if (type === 'INCOME') {
      return <Badge className="bg-green-100 text-green-800">Receita</Badge>
    }
    return <Badge className="bg-red-100 text-red-800">Despesa</Badge>
  }

  const filteredTransactions = transactions.filter(t =>
    !searchTerm ||
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.client?.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <QuickStats />

      {/* Cabeçalho Premium */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/30 dark:via-emerald-950/30 dark:to-teal-950/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">Transações</h2>
              <p className="text-muted-foreground mt-1">Histórico completo de movimentações financeiras</p>
            </div>
            <Button onClick={() => setModalOpen(true)} className="shadow-lg">
              <Plus className="mr-2 h-4 w-4" />
              Nova Transação
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal */}
      <CreateTransactionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={handleTransactionCreated}
      />

      {/* Filtros Avançados */}
      <AdvancedFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { value: 'PENDING', label: 'Pendente' },
          { value: 'CONFIRMED', label: 'Confirmado' },
          { value: 'CANCELLED', label: 'Cancelado' },
        ]}
        onClear={() => {
          setSearchTerm('')
          setTypeFilter('')
          setStatusFilter('')
          setDateFrom('')
          setDateTo('')
          setPage(1)
        }}
      >
        <motion.div className="space-y-2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
          <Label htmlFor="typeFilter" className="font-semibold">Tipo</Label>
          <select
            id="typeFilter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 border rounded-md border-green-200 focus:border-green-500 focus:ring-green-500 dark:border-green-800 dark:bg-slate-900"
            aria-label="Filtrar por tipo"
          >
            <option value="">Todos</option>
            <option value="INCOME">Receita</option>
            <option value="EXPENSE">Despesa</option>
          </select>
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button variant="outline" className="w-full gap-2 border-green-200 hover:border-green-500 dark:border-green-800" onClick={() => exportTransactions(filteredTransactions)}>
            <Download className="h-4 w-4" />
            Exportar ({filteredTransactions.length})
          </Button>
        </motion.div>
      </AdvancedFilters>


      {/* Lista de Transações */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Transações Registradas</CardTitle>
          <CardDescription className="text-base">
            Mostrando {transactions.length} de {totalCount} transações {totalPages > 1 && `(Página ${page} de ${totalPages})`}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          {loading ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <div className="inline-block">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
                  <RefreshCw className="h-8 w-8 text-green-600" />
                </motion.div>
              </div>
              <p className="text-muted-foreground mt-2">Carregando transações...</p>
            </motion.div>
          ) : filteredTransactions.length === 0 ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12 text-muted-foreground">
              <DollarSign className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">Nenhuma transação encontrada</p>
              <p className="text-sm mt-1">Crie uma nova transação para começar</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {filteredTransactions.map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center justify-between p-5 border rounded-xl bg-gradient-to-r from-white to-slate-50 dark:from-slate-950 dark:to-slate-900 hover:shadow-lg transition-all cursor-pointer group ${transaction.type === 'INCOME'
                      ? 'hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-950/30 dark:hover:to-emerald-950/30 hover:border-green-200 dark:hover:border-green-800'
                      : 'hover:from-red-50 hover:to-orange-50 dark:hover:from-red-950/30 dark:hover:to-orange-950/30 hover:border-red-200 dark:hover:border-red-800'
                      }`}
                    onClick={() => handleViewTransaction(transaction.id)}
                    whileHover={{ y: -2 }}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <motion.div
                        className={`p-3 rounded-full group-hover:scale-110 ${transaction.type === 'INCOME'
                          ? 'bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900/40 dark:to-emerald-800/40'
                          : 'bg-gradient-to-br from-red-100 to-orange-200 dark:from-red-900/40 dark:to-orange-800/40'
                          }`}
                        whileHover={{ scale: 1.1 }}
                      >
                        {transaction.type === 'INCOME' ? (
                          <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                        )}
                      </motion.div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-base">{transaction.description}</p>
                          {getTypeBadge(transaction.type)}
                          {getStatusBadge(transaction.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                          {transaction.client?.name && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">
                              <DollarSign className="h-3 w-3" />
                              {transaction.client.name}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(transaction.date).toLocaleDateString('pt-BR')}
                          </span>
                          {transaction.category && (
                            <Badge variant="outline" className="text-xs bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700">
                              {transaction.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-lg font-bold bg-gradient-to-r ${transaction.type === 'INCOME' ? 'from-green-600 to-emerald-600' : 'from-red-600 to-orange-600'
                          } bg-clip-text text-transparent`}
                      >
                        {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {transaction.subtype.replace('_', ' ')}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between mt-4 pt-4 border-t">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="border-green-200 hover:border-green-500 dark:border-green-800"
                >
                  Anterior
                </Button>
              </motion.div>
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                Página {page} de {totalPages}
              </span>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="border-green-200 hover:border-green-500 dark:border-green-800"
                >
                  Próxima
                </Button>
              </motion.div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      <TransactionDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        transactionId={selectedTransactionId}
        onUpdated={fetchTransactions}
      />
    </div>
  )
}
