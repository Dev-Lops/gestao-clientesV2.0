'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { formatDateInput, parseDateInput, toLocalISOString } from '@/lib/utils'
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Building2,
  Calendar,
  DollarSign,
  Edit,
  Filter,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

interface Finance {
  id: string
  type: 'income' | 'expense'
  amount: number
  description?: string | null
  category?: string | null
  date: Date | string
  createdAt: Date | string
  clientId?: string | null
  client?: {
    id: string
    name: string
  } | null
}

interface FinanceManagerGlobalProps {
  orgId: string
}

const CATEGORIES = {
  income: ['Pagamento Cliente', 'Investimento', 'Serviços', 'Consultoria', 'Outro'],
  expense: ['Anúncios', 'Ferramentas', 'Freelancer', 'Hospedagem', 'Salários', 'Infraestrutura', 'Outro'],
}

export function FinanceManagerGlobal({ orgId }: FinanceManagerGlobalProps) {
  const [finances, setFinances] = useState<Finance[]>([])
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Finance | null>(null)
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [clientFilter, setClientFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('')

  const [formData, setFormData] = useState({
    type: 'income' as Finance['type'],
    amount: '',
    description: '',
    category: '',
    date: formatDateInput(new Date()),
    clientId: '',
  })

  // Installments for current month
  const [installments, setInstallments] = useState<Array<{
    id: string
    number: number
    amount: number
    dueDate: string
    clientId: string
    client: { id: string; name: string }
  }>>([])

  // Load finances and clients
  useEffect(() => {
    loadData()
    loadInstallments()
  }, [orgId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [financesRes, clientsRes] = await Promise.all([
        fetch('/api/finance'),
        fetch('/api/clients?lite=1'),
      ])

      if (financesRes.ok) {
        const data = await financesRes.json()
        setFinances(data || [])
      }

      if (clientsRes.ok) {
        const response = await clientsRes.json()
        setClients(response.data || [])
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
      toast.error('Erro ao carregar finanças')
    } finally {
      setLoading(false)
    }
  }

  const loadInstallments = async () => {
    try {
      const res = await fetch('/api/installments', { cache: 'no-store' })
      if (res.ok) {
        const j = await res.json()
        setInstallments(j.data || [])
      }
    } catch (err) {
      console.error('Erro ao carregar parcelas:', err)
    }
  }

  const confirmInstallment = async (id: string) => {
    try {
      const res = await fetch(`/api/installments?id=${encodeURIComponent(id)}`, { method: 'PATCH' })
      if (!res.ok) throw new Error('Falha ao confirmar parcela')
      toast.success('Parcela confirmada e recebimento registrado!')
      await Promise.all([loadInstallments(), loadData()])
    } catch {
      toast.error('Não foi possível confirmar a parcela')
    }
  }

  const resetForm = () => {
    setFormData({
      type: 'income',
      amount: '',
      description: '',
      category: '',
      date: formatDateInput(new Date()),
      clientId: '',
    })
    setEditingItem(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const amount = parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Por favor, insira um valor válido')
      return
    }

    setSubmitting(true)

    // Converte a data corretamente para evitar diferença de timezone
    const dateToSave = toLocalISOString(parseDateInput(formData.date))

    try {
      if (editingItem) {
        const res = await fetch(`/api/finance?id=${editingItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: formData.type,
            amount,
            description: formData.description,
            category: formData.category,
            date: dateToSave,
            clientId: formData.clientId || null,
          }),
        })

        if (!res.ok) throw new Error('Falha ao atualizar transação')
        const updated = await res.json()
        setFinances((prev) =>
          prev.map((item) => (item.id === editingItem.id ? updated : item))
        )
        toast.success('Transação atualizada!')
      } else {
        const res = await fetch('/api/finance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: formData.type,
            amount,
            description: formData.description,
            category: formData.category,
            date: dateToSave,
            clientId: formData.clientId || null,
          }),
        })

        if (!res.ok) throw new Error('Falha ao criar transação')
        const created = await res.json()
        setFinances((prev) => [created, ...prev])
        toast.success('Transação criada!')
      }

      setIsModalOpen(false)
      resetForm()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar transação')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (item: Finance) => {
    setEditingItem(item)
    const date = new Date(item.date)
    setFormData({
      type: item.type,
      amount: item.amount.toString(),
      description: item.description || '',
      category: item.category || '',
      date: formatDateInput(date),
      clientId: item.clientId || '',
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta transação?')) return

    try {
      const res = await fetch(`/api/finance?id=${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Falha ao deletar transação')

      setFinances((prev) => prev.filter((item) => item.id !== id))
      toast.success('Transação deletada!')
    } catch {
      toast.error('Erro ao deletar transação')
    }
  }

  const totals = useMemo(() => {
    const income = finances
      .filter((f) => f.type === 'income')
      .reduce((sum, f) => sum + f.amount, 0)

    const expense = finances
      .filter((f) => f.type === 'expense')
      .reduce((sum, f) => sum + f.amount, 0)

    return {
      income,
      expense,
      balance: income - expense,
      incomeCount: finances.filter((f) => f.type === 'income').length,
      expenseCount: finances.filter((f) => f.type === 'expense').length,
    }
  }, [finances])

  const categoryStats = useMemo(() => {
    const stats: Record<string, { amount: number; count: number }> = {}

    finances.forEach((f) => {
      const category = f.category || 'Sem categoria'
      if (!stats[category]) {
        stats[category] = { amount: 0, count: 0 }
      }
      stats[category].amount += f.type === 'income' ? f.amount : -f.amount
      stats[category].count += 1
    })

    return Object.entries(stats)
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
      .slice(0, 5)
  }, [finances])

  // Map percentage to a Tailwind width utility class without inline styles
  const PCT_WIDTH_CLASSES: Record<number, string> = {
    0: 'w-[0%]',
    10: 'w-[10%]',
    20: 'w-[20%]',
    30: 'w-[30%]',
    40: 'w-[40%]',
    50: 'w-[50%]',
    60: 'w-[60%]',
    70: 'w-[70%]',
    80: 'w-[80%]',
    90: 'w-[90%]',
    100: 'w-[100%]',
  }
  const getWidthClass = (value: number, maxAbs: number) => {
    if (maxAbs <= 0) return PCT_WIDTH_CLASSES[0]
    const pct = Math.min(100, Math.max(0, Math.round((Math.abs(value) / maxAbs) * 100)))
    const step = Math.round(pct / 10) * 10
    return PCT_WIDTH_CLASSES[step as keyof typeof PCT_WIDTH_CLASSES] || PCT_WIDTH_CLASSES[0]
  }

  const filteredFinances = useMemo(() => {
    let result = [...finances]

    if (filter !== 'all') {
      result = result.filter((f) => f.type === filter)
    }

    if (clientFilter !== 'all') {
      if (clientFilter === '') {
        result = result.filter((f) => !f.clientId)
      } else {
        result = result.filter((f) => f.clientId === clientFilter)
      }
    }

    if (dateFilter) {
      const [year, month] = dateFilter.split('-')
      result = result.filter((f) => {
        const date = new Date(f.date)
        return (
          date.getFullYear() === parseInt(year) &&
          date.getMonth() + 1 === parseInt(month)
        )
      })
    }

    return result.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }, [finances, filter, clientFilter, dateFilter])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-slate-500">Carregando finanças...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="relative min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-100">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
          <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000" />
        </div>

        <div className="relative space-y-6 p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Financeiro da Organização
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Gestão completa de receitas e despesas
              </p>
            </div>
            <Button
              onClick={() => {
                resetForm()
                setIsModalOpen(true)
              }}
              size="lg"
              className="gap-2 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/20"
            >
              <Plus className="h-5 w-5" />
              Nova Transação
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="relative overflow-hidden border-2 border-green-200/60 shadow-2xl shadow-green-200/50">
              <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-green-500 to-emerald-500" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">
                  Receita Total
                </CardTitle>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {formatCurrency(totals.income)}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {totals.incomeCount} transação{totals.incomeCount !== 1 ? 'ões' : ''}
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-2 border-red-200/60 shadow-2xl shadow-red-200/50">
              <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-red-500 to-rose-500" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">
                  Despesas
                </CardTitle>
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {formatCurrency(totals.expense)}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {totals.expenseCount} transação{totals.expenseCount !== 1 ? 'ões' : ''}
                </p>
              </CardContent>
            </Card>

            <Card
              className={`relative overflow-hidden border-2 shadow-2xl ${totals.balance >= 0
                ? 'border-blue-200/60 shadow-blue-200/50'
                : 'border-orange-200/60 shadow-orange-200/50'
                }`}
            >
              <div
                className={`absolute top-0 left-0 w-full h-2 bg-linear-to-r ${totals.balance >= 0
                  ? 'from-blue-500 to-purple-500'
                  : 'from-orange-500 to-red-500'
                  }`}
              />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">
                  Saldo
                </CardTitle>
                <div
                  className={`h-12 w-12 rounded-full flex items-center justify-center ${totals.balance >= 0 ? 'bg-blue-100' : 'bg-orange-100'
                    }`}
                >
                  <DollarSign
                    className={`h-6 w-6 ${totals.balance >= 0 ? 'text-blue-600' : 'text-orange-600'
                      }`}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-3xl font-bold ${totals.balance >= 0 ? 'text-blue-600' : 'text-orange-600'
                    }`}
                >
                  {formatCurrency(totals.balance)}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {totals.balance >= 0 ? '✓ Positivo' : '⚠ Negativo'} • {totals.incomeCount + totals.expenseCount} total
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top Categorias - Resumo Visual */}
          {categoryStats.length > 0 && (
            <Card className="shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className="h-5 w-5 text-blue-600" />
                  Top 5 Categorias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categoryStats.map((stat, index) => (
                    <div key={stat.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {stat.category}
                          </p>
                          <span className="text-xs text-slate-500">
                            ({stat.count})
                          </span>
                        </div>
                        <div className={`text-sm font-bold ${stat.amount >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                          {stat.amount >= 0 ? '+' : '-'}{formatCurrency(Math.abs(stat.amount))}
                        </div>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${stat.amount >= 0
                            ? 'bg-linear-to-r from-green-500 to-emerald-500'
                            : 'bg-linear-to-r from-red-500 to-rose-500'
                            } ${getWidthClass(stat.amount, Math.max(...categoryStats.map(s => Math.abs(s.amount))))}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Parcelas deste mês */}
          {installments.length > 0 && (
            <Card className="shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-violet-600" />
                  Parcelas deste mês
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {installments.map((i) => (
                    <div key={i.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-medium text-slate-900">{i.client.name}</div>
                        <span className="text-xs text-slate-500">Parcela {i.number}</span>
                        <span className="text-xs text-slate-500">{new Date(i.dueDate).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="font-bold text-green-600">{formatCurrency(i.amount)}</div>
                        <Button size="sm" onClick={() => confirmInstallment(i.id)}>
                          Registrar pagamento
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <Card className="shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">Filtros:</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('all')}
                    className="text-xs"
                  >
                    Todas
                  </Button>
                  <Button
                    variant={filter === 'income' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('income')}
                    className="text-xs gap-1"
                  >
                    <ArrowUpCircle className="h-3 w-3" />
                    Receitas
                  </Button>
                  <Button
                    variant={filter === 'expense' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('expense')}
                    className="text-xs gap-1"
                  >
                    <ArrowDownCircle className="h-3 w-3" />
                    Despesas
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-slate-500" />
                  <Select
                    value={clientFilter}
                    onChange={(e) => setClientFilter(e.target.value)}
                    className="w-48 h-8 text-xs"
                  >
                    <option value="all">Todos os clientes</option>
                    <option value="">Sem cliente</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  <Input
                    type="month"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-40 h-8 text-xs"
                  />
                  {dateFilter && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDateFilter('')}
                      className="h-8 px-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transactions List */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl">Histórico de Transações</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredFinances.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Nenhuma transação encontrada</p>
                  <p className="text-sm mt-1">
                    {filter !== 'all' || dateFilter || clientFilter !== 'all'
                      ? 'Tente ajustar os filtros'
                      : 'Comece adicionando uma transação'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFinances.map((finance) => (
                    <div
                      key={finance.id}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all hover:shadow-lg ${finance.type === 'income'
                        ? 'border-green-200 bg-green-50/50 hover:border-green-300'
                        : 'border-red-200 bg-red-50/50 hover:border-red-300'
                        }`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div
                          className={`h-14 w-14 rounded-full flex items-center justify-center ${finance.type === 'income'
                            ? 'bg-green-100'
                            : 'bg-red-100'
                            }`}
                        >
                          {finance.type === 'income' ? (
                            <ArrowUpCircle className="h-7 w-7 text-green-600" />
                          ) : (
                            <ArrowDownCircle className="h-7 w-7 text-red-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-slate-900 text-base">
                              {finance.description || 'Sem descrição'}
                            </h4>
                            {finance.category && (
                              <span className="text-xs px-2 py-1 rounded-full bg-slate-200 text-slate-700 font-medium">
                                {finance.category}
                              </span>
                            )}
                            {finance.client && (
                              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {finance.client.name}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {formatDate(finance.date)}
                          </p>
                        </div>
                        <div className="text-right">
                          <div
                            className={`text-2xl font-bold ${finance.type === 'income'
                              ? 'text-green-600'
                              : 'text-red-600'
                              }`}
                          >
                            {finance.type === 'income' ? '+' : '-'}
                            {formatCurrency(finance.amount)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(finance)}
                          className="h-9 w-9 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(finance.id)}
                          className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-lg shadow-2xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">
                      {editingItem ? 'Editar Transação' : 'Nova Transação'}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsModalOpen(false)
                        resetForm()
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Tipo</Label>
                      <Select
                        id="type"
                        value={formData.type}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            type: e.target.value as 'income' | 'expense',
                            category: '',
                          })
                        }
                        disabled={submitting}
                      >
                        <option value="income">Receita</option>
                        <option value="expense">Despesa</option>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amount">
                        Valor <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={formData.amount}
                        onChange={(e) =>
                          setFormData({ ...formData, amount: e.target.value })
                        }
                        placeholder="0.00"
                        disabled={submitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="clientId">Cliente (opcional)</Label>
                      <Select
                        id="clientId"
                        value={formData.clientId}
                        onChange={(e) =>
                          setFormData({ ...formData, clientId: e.target.value })
                        }
                        disabled={submitting}
                      >
                        <option value="">Sem cliente específico</option>
                        {clients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.name}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Categoria</Label>
                      <Select
                        id="category"
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value })
                        }
                        disabled={submitting}
                      >
                        <option value="">Selecione...</option>
                        {CATEGORIES[formData.type].map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        placeholder="Detalhes da transação"
                        rows={3}
                        disabled={submitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="date">Data</Label>
                      <Input
                        id="date"
                        type="date"
                        required
                        value={formData.date}
                        onChange={(e) =>
                          setFormData({ ...formData, date: e.target.value })
                        }
                        disabled={submitting}
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        {submitting && <LoadingSpinner size="sm" className="mr-2" />}
                        {editingItem ? 'Salvar' : 'Criar'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsModalOpen(false)
                          resetForm()
                        }}
                        disabled={submitting}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
