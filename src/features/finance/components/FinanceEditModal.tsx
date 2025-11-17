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
import { useState } from 'react'
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

export function FinanceEditModal({ row }: { row: FinanceRow }) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState(row.amount)
  const [description, setDescription] = useState(row.description || '')
  const [loading, setLoading] = useState(false)

  const onSave = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/billing/finance/${row.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, description }),
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar lançamento</DialogTitle>
          <DialogDescription>
            {row.type === 'income' ? 'Receita' : 'Despesa'} • {row.clientName || '-'} • {new Date(row.date).toLocaleDateString('pt-BR')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Valor</Label>
            <Input
              id="amount"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              type="number"
              step="0.01"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="destructive" onClick={onDelete} disabled={loading}>
            Excluir
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={onSave} disabled={loading}>Salvar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
