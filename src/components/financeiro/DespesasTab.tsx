'use client'

import { CreateRecurringExpenseModal } from '@/components/financeiro/CreateRecurringExpenseModal'
import { RecurringExpenseDetailModal } from '@/components/financeiro/RecurringExpenseDetailModal'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ExpenseCycle } from '@prisma/client'
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Plus,
  RefreshCw,
  Repeat,
  ToggleLeft,
  ToggleRight,
  Trash2
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface RecurringExpense {
  id: string
  name: string
  description: string | null
  amount: number
  cycle: ExpenseCycle
  isActive: boolean
  nextDueDate: string
  createdAt: string
  paidThisMonth?: boolean
}

type RecurringExpenseApi = {
  id: string
  name: string
  description?: string | null
  amount: number
  cycle: ExpenseCycle
  active?: boolean
  isActive?: boolean
  dayOfMonth?: number | null
  createdAt?: string | Date | null
}

type TxItem = {
  metadata?: { recurringExpenseId?: string | null } | null
}

export function DespesasTab() {
  const [expenses, setExpenses] = useState<RecurringExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [materializing, setMaterializing] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | undefined>()

  const [cycleFilter, setCycleFilter] = useState<string>('')
  const [activeFilter, setActiveFilter] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchExpenses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycleFilter, activeFilter, page])

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        ...(cycleFilter && { cycle: cycleFilter }),
        ...(activeFilter === 'active' ? { active: 'true' } : {}),
        ...(activeFilter === 'inactive' ? { active: 'false' } : {}),
        ...(searchTerm ? { search: searchTerm } : {}),
        page: page.toString(),
        limit: '20',
      })

      const response = await fetch(`/api/recurring-expenses?${params}`)

      if (!response.ok) throw new Error('Erro ao carregar despesas')

      const result = await response.json()
      const items = Array.isArray(result) ? result : (result?.data ?? [])

      // Buscar transações de despesas fixas confirmadas no mês corrente para travar o botão
      const now = new Date()
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      const txParams = new URLSearchParams({
        type: 'EXPENSE',
        subtype: 'FIXED_EXPENSE',
        status: 'CONFIRMED',
        dateFrom: firstDay.toISOString(),
        dateTo: lastDay.toISOString(),
        limit: '500',
      })
      const paidSet = new Set<string>()
      try {
        const txRes = await fetch(`/api/transactions?${txParams.toString()}`)
        if (txRes.ok) {
          const txJson = await txRes.json()
          const txList = (txJson?.data ?? []) as TxItem[]
          for (const t of txList) {
            const rid = t?.metadata?.recurringExpenseId || undefined
            if (rid) paidSet.add(rid)
          }
        }
      } catch {
        // Silencia falhas aqui; não deve bloquear listagem
      }

      const mapped: RecurringExpense[] = (items as RecurringExpenseApi[]).map((e) => {
        const next = computeNextDueDate(e)
        const paidThisMonth = paidSet.has(e.id)
        return {
          id: e.id,
          name: e.name,
          description: e.description ?? null,
          amount: e.amount,
          cycle: e.cycle,
          isActive: e.active ?? e.isActive ?? false,
          nextDueDate: next.toISOString(),
          createdAt: ((): string => {
            if (!e.createdAt) return new Date().toISOString()
            if (typeof e.createdAt === 'string') return new Date(e.createdAt).toISOString()
            return e.createdAt.toISOString()
          })(),
          paidThisMonth,
        }
      })

      setExpenses(mapped)
      setTotalPages(Array.isArray(result) ? 1 : result.totalPages || 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  function computeNextDueDate(e: RecurringExpenseApi): Date {
    try {
      const cycle: ExpenseCycle = e.cycle
      const now = new Date()
      if (cycle === 'ANNUAL') {
        // Próximo vencimento anual: hoje (simples) ou fim do ano
        return new Date(now.getFullYear(), 11, 31)
      }
      const day: number = e.dayOfMonth ? Number(e.dayOfMonth) : 1
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      const targetDay = Math.max(1, Math.min(day, lastDay))
      return new Date(now.getFullYear(), now.getMonth(), targetDay)
    } catch {
      return new Date()
    }
  }

  const handleMaterialize = async () => {
    if (!confirm('Deseja materializar todas as despesas mensais ativas?')) return

    try {
      setMaterializing(true)
      setError(null)

      const response = await fetch('/api/recurring-expenses/materialize', { method: 'POST' })
      if (!response.ok) throw new Error('Erro ao materializar despesas')

      const result = await response.json()
      const created = Number(result?.success ?? result?.details?.success?.length ?? 0)
      const skipped = Number(result?.skipped ?? result?.details?.skipped?.length ?? 0)
      const errors = Number(result?.errors ?? result?.details?.errors?.length ?? 0)
      alert(`✅ Despesas materializadas!\n\nCriadas: ${created}\nIgnoradas: ${skipped}\nErros: ${errors}`)
      fetchExpenses()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao materializar')
    } finally {
      setMaterializing(false)
    }
  }

  const handleToggleActive = async (expenseId: string, currentStatus: boolean, e?: React.MouseEvent) => {
    e?.stopPropagation()
    try {
      const response = await fetch(`/api/recurring-expenses/${expenseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentStatus }),
      })

      if (!response.ok) throw new Error('Erro ao atualizar despesa')
      fetchExpenses()
    } catch (err) {
      alert(`❌ ${err instanceof Error ? err.message : 'Erro'}`)
    }
  }

  const handleDelete = async (expenseId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!confirm('Deseja realmente excluir esta despesa recorrente?')) return

    try {
      const response = await fetch(`/api/recurring-expenses/${expenseId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Erro ao excluir despesa')
      alert('✅ Despesa excluída!')
      fetchExpenses()
    } catch (err) {
      alert(`❌ ${err instanceof Error ? err.message : 'Erro'}`)
    }
  }

  const handleMaterializeOne = async (expenseId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    try {
      const res = await fetch(`/api/recurring-expenses/${expenseId}/materialize`, { method: 'POST' })
      if (!res.ok) throw new Error('Erro ao materializar despesa')
      const data = await res.json()
      const created = data?.result?.status === 'created'
      alert(created ? '✅ Despesa materializada!' : '⏭️ Já materializada este mês')
      // Recarrega para refletir o travamento do botão
      fetchExpenses()
    } catch (err) {
      alert(`❌ ${err instanceof Error ? err.message : 'Erro'}`)
    }
  }

  const handleExpenseCreated = () => {
    setModalOpen(false)
    fetchExpenses()
  }

  const handleViewExpense = (id: string) => {
    setSelectedExpenseId(id)
    setDetailModalOpen(true)
  }

  const getCycleBadge = (cycle: ExpenseCycle) => {
    const configs: Record<ExpenseCycle, { label: string, className: string }> = {
      MONTHLY: { label: 'Mensal', className: 'bg-blue-100 text-blue-800' },
      ANNUAL: { label: 'Anual', className: 'bg-purple-100 text-purple-800' },
    }

    const config = configs[cycle] || configs.MONTHLY

    return (
      <Badge className={config.className}>
        <Calendar className="mr-1 h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = !searchTerm || exp.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesActive = !activeFilter || (activeFilter === 'active' ? exp.isActive : !exp.isActive)
    return matchesSearch && matchesActive
  })

  return (
    <div className="space-y-6">
      {/* Cabeçalho Premium */}
      <Card size="md" className="border-0 shadow-lg bg-gradient-to-r from-red-50 via-rose-50 to-pink-50 dark:from-red-950/30 dark:via-rose-950/30 dark:to-pink-950/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 bg-clip-text text-transparent">Despesas Fixas</h2>
              <p className="text-muted-foreground mt-1">Gestão de despesas recorrentes</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleMaterialize} disabled={materializing} className="shadow-md">
                {materializing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Repeat className="mr-2 h-4 w-4" />}
                Materializar
              </Button>
              <Button onClick={() => setModalOpen(true)} className="shadow-lg">
                <Plus className="mr-2 h-4 w-4" />
                Nova Despesa
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card size="md" className="border-0 shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Buscar</Label>
                <Input id="search" placeholder="Nome da despesa..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cycle">Ciclo</Label>
                <select id="cycle" value={cycleFilter} onChange={(e) => setCycleFilter(e.target.value)} className="w-full h-11 px-3 py-2 border rounded-md" aria-label="Filtrar por ciclo">
                  <option value="">Todos</option>
                  <option value="MONTHLY">Mensal</option>
                  <option value="ANNUAL">Anual</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="active">Status</Label>
                <select id="active" value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)} className="w-full h-11 px-3 py-2 border rounded-md" aria-label="Filtrar por status ativo">
                  <option value="">Todos</option>
                  <option value="active">Ativos</option>
                  <option value="inactive">Inativos</option>
                </select>
              </div>
            </div>
            <Button variant="outline" onClick={() => { setSearchTerm(''); setCycleFilter(''); setActiveFilter('') }} className="w-full sm:w-auto">Limpar Filtros</Button>
          </div>
        </CardContent>
      </Card>

      <Card size="md" className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Despesas Recorrentes</CardTitle>
          <CardDescription className="text-base">Mostrando {filteredExpenses.length} de {expenses.length} despesas</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex justify-between items-center gap-3 mb-6 p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg">
            <div className="text-sm font-medium text-muted-foreground">
              Página {page} de {totalPages}
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <select
                value={page}
                onChange={(e) => setPage(Number(e.target.value))}
                className="px-3 py-1.5 border rounded-md text-sm font-medium"
                aria-label="Ir para página"
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <option key={p} value={p}>Página {p}</option>
                ))}
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Próxima
              </Button>
            </div>
          </div>
          {error && <Alert variant="destructive" className="mb-4"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
          {loading ? <div className="text-center py-12 text-muted-foreground">Carregando...</div> : filteredExpenses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Repeat className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">Nenhuma despesa encontrada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-5 border rounded-xl hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 dark:hover:from-red-950/20 dark:hover:to-rose-950/20 hover:shadow-md transition-all cursor-pointer group" onClick={() => handleViewExpense(expense.id)}>
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`p-2 rounded-full ${expense.isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                      {expense.isActive ? <ToggleRight className="h-5 w-5 text-green-600" /> : <ToggleLeft className="h-5 w-5 text-gray-400" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{expense.name}</p>
                        {getCycleBadge(expense.cycle)}
                        {!expense.isActive && <Badge variant="outline" className="bg-gray-100">Inativo</Badge>}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        {expense.description && <span>{expense.description}</span>}
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Próximo: {formatDate(expense.nextDueDate)}</span>
                        {expense.paidThisMonth && <Badge variant="outline" className="border-green-200 text-green-700">Pago este mês</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-600">{formatCurrency(expense.amount)}</div>
                      <div className="text-xs text-muted-foreground">{expense.cycle === 'MONTHLY' ? '/mês' : '/ano'}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(ev) => handleToggleActive(expense.id, expense.isActive, ev)}
                        className={expense.isActive ? 'text-orange-600' : 'text-green-600'}
                      >
                        {expense.isActive ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(ev) => handleDelete(expense.id, ev)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={(ev) => handleMaterializeOne(expense.id, ev)}
                        disabled={!expense.isActive || expense.paidThisMonth}
                        title={expense.paidThisMonth ? 'Já pago/materializado este mês' : 'Pagar este mês'}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateRecurringExpenseModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={handleExpenseCreated}
      />

      <RecurringExpenseDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        expenseId={selectedExpenseId}
      />
    </div>
  )
}
