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
import { ClientTypeahead } from '@/features/clients/components/ClientTypeahead'
import { Calendar, DollarSign, FileText, Plus, Tag, TrendingDown, TrendingUp, User } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

const INCOME_CATEGORIES = [
  'Mensalidade',
  'Serviço Avulso',
  'Consultoria',
  'Venda de Produto',
  'Comissão',
  'Outros Recebimentos'
]

const EXPENSE_CATEGORIES = [
  'Fornecedor',
  'Salário',
  'Aluguel',
  'Publicidade',
  'Software/Ferramentas',
  'Impostos',
  'Manutenção',
  'Outras Despesas'
]

export function FinanceCreateModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [financeType, setFinanceType] = useState<'income' | 'expense'>('income')

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    try {
      setLoading(true)
      const res = await fetch('/api/billing/finance', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Falha ao criar lançamento')
      toast.success('Lançamento adicionado')
      setOpen(false)
      // refresh page
      window.location.reload()
    } catch (err) {
      toast.error('Não foi possível adicionar', { description: err instanceof Error ? err.message : undefined })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default" className="gap-2">
          <Plus className="size-4" />
          Novo lançamento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${financeType === 'income' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
              {financeType === 'income' ? <TrendingUp className="size-5" /> : <TrendingDown className="size-5" />}
            </div>
            <div>
              <DialogTitle className="text-xl">Novo lançamento financeiro</DialogTitle>
              <DialogDescription className="text-sm">
                Registre uma nova {financeType === 'income' ? 'receita' : 'despesa'} para controle financeiro
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form className="space-y-6" onSubmit={onSubmit}>
          {/* Tipo e Valor */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type" className="flex items-center gap-2 text-sm font-medium">
                {financeType === 'income' ? <TrendingUp className="size-4 text-emerald-600" /> : <TrendingDown className="size-4 text-red-600" />}
                Tipo
              </Label>
              <Select value={financeType} onValueChange={(v) => setFinanceType(v as 'income' | 'expense')}>
                <SelectTrigger className={`w-full ${financeType === 'income' ? 'border-emerald-200 focus:border-emerald-400' : 'border-red-200 focus:border-red-400'}`}>
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
              <input type="hidden" name="type" value={financeType} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="flex items-center gap-2 text-sm font-medium">
                <DollarSign className="size-4 text-blue-600" />
                Valor
              </Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
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
              name="description"
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
              <Select name="category" required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {(financeType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
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
                name="date"
                type="date"
                className="w-full"
              />
            </div>
          </div>

          {/* Cliente */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <User className="size-4 text-indigo-600" />
              Cliente <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <ClientTypeahead name="clientId" placeholder="Buscar cliente..." />
          </div>

          <DialogFooter className="gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className={financeType === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {loading ? 'Salvando...' : 'Salvar lançamento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
