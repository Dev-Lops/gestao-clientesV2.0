"use client"
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/lib/prisma-enums'
import { Calendar, DollarSign, FileText, Tag, TrendingDown, TrendingUp, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

type FinanceRow = {
  id: string
  amount: number
  description: string | null
  category: string | null
  date: string
  type: 'income' | 'expense'
  clientId: string | null
  clientName?: string | null
}

interface Client {
  id: string
  name: string
}

export function FinanceEditModal({ row }: { row: FinanceRow }) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState(String(row.amount))
  const [description, setDescription] = useState(row.description || '')
  const [category, setCategory] = useState(row.category || '')
  const [type, setType] = useState<'income' | 'expense'>(row.type)
  const [date, setDate] = useState(row.date.split('T')[0])
  const [clientId, setClientId] = useState(row.clientId || '')
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      fetch('/api/clients?lite=1')
        .then(res => res.json())
        .then(data => {
          console.log('Clientes carregados:', data)
          setClients(data.data || [])
        })
        .catch(err => {
          console.error('Erro ao carregar clientes:', err)
          setClients([])
        })
    }
  }, [open])

  const onSave = async () => {
    // Validate amount
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount === 0 || amount.trim() === '' || amount === '-') {
      toast.error('Valor deve ser um número válido diferente de zero')
      return
    }

    // Validate date
    if (!date || isNaN(new Date(date).getTime())) {
      toast.error('Data inválida')
      return
    }

    try {
      setLoading(true)
      const res = await fetch(`/api/billing/finance/${row.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numAmount,
          description: description.trim() || null,
          category: category.trim() || null,
          type,
          date: new Date(date).toISOString(),
          clientId: clientId || null
        }),
      })
      if (!res.ok) throw new Error('Falha ao salvar')
      toast.success('Lançamento atualizado')
      setOpen(false)
      // Reload current page to reflect changes
      window.location.reload()
    } catch {
      toast.error('Erro ao atualizar lançamento')
    } finally {
      setLoading(false)
    }
  }

  const onDelete = async () => {
    if (!confirm('Excluir este lançamento?')) return
    try {
      setLoading(true)
      const res = await fetch(`/api/billing/finance/${row.id}?_action=delete`, { method: 'POST' })
      if (!res.ok) throw new Error('Falha ao excluir')
      toast.success('Lançamento excluído')
      setOpen(false)
      window.location.reload()
    } catch {
      toast.error('Erro ao excluir')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">Editar</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${type === 'income' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
              {type === 'income' ? <TrendingUp className="size-5" /> : <TrendingDown className="size-5" />}
            </div>
            <div>
              <DialogTitle className="text-xl">Editar lançamento financeiro</DialogTitle>
              <DialogDescription className="text-sm">
                Edite os detalhes da {type === 'income' ? 'receita' : 'despesa'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tipo e Valor */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type" className="flex items-center gap-2 text-sm font-medium">
                {type === 'income' ? <TrendingUp className="size-4 text-emerald-600" /> : <TrendingDown className="size-4 text-red-600" />}
                Tipo
              </Label>
              <Select value={type} onValueChange={(v) => setType(v as 'income' | 'expense')}>
                <SelectTrigger className={`w-full ${type === 'income' ? 'border-emerald-200 focus:border-emerald-400' : 'border-red-200 focus:border-red-400'}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="size-4 text-emerald-600" />
                      Receita
                    </span>
                  </SelectItem>
                  <SelectItem value="expense">
                    <span className="flex items-center gap-2">
                      <TrendingDown className="size-4 text-red-600" />
                      Despesa
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="flex items-center gap-2 text-sm font-medium">
                <DollarSign className="size-4 text-blue-600" />
                Valor
              </Label>
              <Input
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0,00"
                className="text-lg font-semibold"
              />
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2 text-sm font-medium">
              <FileText className="size-4 text-purple-600" />
              Descrição
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Pagamento de mensalidade do cliente X"
              className="w-full"
            />
          </div>

          {/* Categoria e Data */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="flex items-center gap-2 text-sm font-medium">
                <Tag className="size-4 text-orange-600" />
                Categoria
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {(type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="size-4 text-cyan-600" />
                Data
              </Label>
              <Input
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                type="date"
                required
                className="w-full"
              />
            </div>
          </div>

          {/* Cliente */}
          <div className="space-y-2">
            <Label htmlFor="clientId" className="flex items-center gap-2 text-sm font-medium">
              <User className="size-4 text-indigo-600" />
              Cliente <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Select value={clientId || 'NONE'} onValueChange={(v) => setClientId(v === 'NONE' ? '' : v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Buscar cliente..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Nenhum</SelectItem>
                {clients.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-3 pt-2 flex justify-between sm:justify-between">
          <Button variant="destructive" onClick={onDelete} disabled={loading}>
            Excluir
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={onSave}
              disabled={loading}
              className={type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {loading ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
