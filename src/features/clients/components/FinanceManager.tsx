'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { parseDateInput } from '@/lib/utils'
import { CreditCard, DollarSign, Edit, Plus, Trash2, TrendingDown, TrendingUp, X } from 'lucide-react'
import { useMemo, useState } from 'react'

interface Finance {
  id: string
  type: 'income' | 'expense'
  amount: number
  description?: string
  category?: string
  date: Date
  createdAt: Date
}

interface FinanceManagerProps {
  clientId: string
  initialFinances?: Finance[]
}

export function FinanceManager({ clientId, initialFinances = [] }: FinanceManagerProps) {
  const [finances, setFinances] = useState<Finance[]>(initialFinances)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Finance | null>(null)

  const [formData, setFormData] = useState({
    type: 'income' as Finance['type'],
    amount: '',
    description: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
  })

  const resetForm = () => {
    setFormData({
      type: 'income',
      amount: '',
      description: '',
      category: '',
      date: new Date().toISOString().split('T')[0],
    })
    setEditingItem(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const amount = parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) {
      alert('Por favor, insira um valor válido')
      return
    }

    const dateToSave = parseDateInput(formData.date)

    if (editingItem) {
      setFinances(prev =>
        prev.map(item =>
          item.id === editingItem.id
            ? {
              ...item,
              type: formData.type,
              amount,
              description: formData.description,
              category: formData.category,
              date: dateToSave,
            }
            : item
        )
      )
    } else {
      const newItem: Finance = {
        id: Date.now().toString(),
        type: formData.type,
        amount,
        description: formData.description,
        category: formData.category,
        date: dateToSave,
        createdAt: new Date(),
      }
      setFinances(prev => [newItem, ...prev])
    } setIsModalOpen(false)
    resetForm()
  }

  const handleEdit = (item: Finance) => {
    setEditingItem(item)
    setFormData({
      type: item.type,
      amount: item.amount.toString(),
      description: item.description || '',
      category: item.category || '',
      date: item.date.toISOString().split('T')[0],
    })
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja deletar esta transação?')) {
      setFinances(prev => prev.filter(item => item.id !== id))
    }
  }

  const totals = useMemo(() => {
    const income = finances
      .filter(f => f.type === 'income')
      .reduce((sum, f) => sum + f.amount, 0)

    const expense = finances
      .filter(f => f.type === 'expense')
      .reduce((sum, f) => sum + f.amount, 0)

    return {
      income,
      expense,
      balance: income - expense,
    }
  }, [finances])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date)
  }

  const sortedFinances = useMemo(() => {
    return [...finances].sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [finances])

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Financeiro</h2>
            <p className="text-sm text-slate-500 mt-1">Gestão financeira do cliente</p>
          </div>
          <Button className="gap-2" onClick={() => { resetForm(); setIsModalOpen(true) }}>
            <Plus className="h-4 w-4" />
            Nova Transação
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totals.income)}</div>
              <p className="text-xs text-slate-500 mt-1">Total de receitas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Despesas</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(totals.expense)}</div>
              <p className="text-xs text-slate-500 mt-1">Total de despesas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totals.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatCurrency(totals.balance)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Balanço atual</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Transações</CardTitle>
          </CardHeader>
          <CardContent>
            {sortedFinances.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Nenhuma transação registrada</p>
                <p className="text-sm mt-1">Adicione receitas e despesas do cliente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedFinances.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`p-2 rounded-full ${item.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {item.type === 'income' ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-semibold ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                            {item.type === 'income' ? '+' : '-'} {formatCurrency(item.amount)}
                          </span>
                          {item.category && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-slate-200 text-slate-700">
                              {item.category}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-slate-600 mt-1">{item.description}</p>
                        )}
                        <p className="text-xs text-slate-500 mt-1">{formatDate(item.date)}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-700"
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
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto m-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">
                    {editingItem ? 'Editar Transação' : 'Nova Transação'}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Registre receitas ou despesas do cliente.
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as Finance['type'] })}
                  >
                    <option value="income">Receita</option>
                    <option value="expense">Despesa</option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Valor (R$)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria (opcional)</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Ex: Mensalidade, Material, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    placeholder="Detalhes sobre a transação..."
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingItem ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
