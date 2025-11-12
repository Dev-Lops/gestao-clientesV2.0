'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { toLocalISOString } from '@/lib/utils'
import { Calendar, CheckCircle2, Clock, DollarSign, XCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

type MonthlyPaymentCardProps = {
  clientId: string
  clientName: string
  contractValue?: number | null
  paymentDay?: number | null
  isInstallment?: boolean | null
  canEdit?: boolean
}

type Installment = {
  id: string
  number: number
  amount: number
  dueDate: string
  status: 'PENDING' | 'CONFIRMED' | 'LATE'
  paidAt?: string | null
}

type Finance = {
  id: string
  clientId: string | null
  type: 'income' | 'expense'
  amount: number
  description?: string | null
  category?: string | null
  date: string
}

type MonthlyState =
  | {
    mode: 'installment'
    amount: number
    status: 'PENDING' | 'CONFIRMED' | 'LATE'
    dueDate: Date
    paidAt: Date | null
    installment: Installment | null // next pending installment in current month (quick action)
    isPaid: boolean
    monthInstallmentsCount: number
    hasInstallmentsThisMonth: boolean
  }
  | {
    mode: 'monthly'
    amount: number
    status: 'PENDING' | 'CONFIRMED' | 'LATE'
    dueDate: Date
    paidAt: Date | null
    installment: null
    isPaid: boolean
  }

function getMonthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function MonthlyPaymentCard({ clientId, clientName, contractValue, paymentDay, isInstallment, canEdit }: MonthlyPaymentCardProps) {
  const [loading, setLoading] = useState(true)
  const [installments, setInstallments] = useState<Installment[]>([])
  const [finances, setFinances] = useState<Finance[]>([])
  const [submitting, setSubmitting] = useState(false)

  // compute current time within memoized calculations to avoid unstable deps

  useEffect(() => {
    let aborted = false
    async function load() {
      try {
        setLoading(true)
        const requests: Promise<unknown>[] = []
        // fetch installments for this client
        requests.push(fetch(`/api/clients/${clientId}/installments`).then(r => r.ok ? r.json() : []))
        // fetch finances for org and filter client on client side
        requests.push(fetch(`/api/finance`).then(r => r.ok ? r.json() : []))
        const [inst, fins] = await Promise.all(requests)
        if (!aborted) {
          setInstallments(Array.isArray(inst) ? inst : [])
          setFinances(Array.isArray(fins) ? fins.filter((f: Finance) => f.clientId === clientId) : [])
        }
      } catch (e) {
        console.error(e)
        if (!aborted) toast.error('Erro ao carregar informações de pagamento')
      } finally {
        if (!aborted) setLoading(false)
      }
    }
    load()
    return () => { aborted = true }
  }, [clientId])

  const monthly = useMemo<MonthlyState>(() => {
    const now = new Date()
    const thisMonthKey = getMonthKey(now)
    // If client is in installment mode and has installments, consider ALL installments due this month
    const currentMonthInstallments = installments.filter((i) => {
      const d = new Date(i.dueDate)
      return getMonthKey(d) === thisMonthKey
    })

    if (isInstallment && installments.length > 0 && currentMonthInstallments.length > 0) {
      const amountSum = currentMonthInstallments.reduce((sum, i) => sum + i.amount, 0)
      const allConfirmed = currentMonthInstallments.every(i => i.status === 'CONFIRMED')
      const anyLate = currentMonthInstallments.some(i => i.status === 'LATE')
      const dueDate = new Date(Math.max(...currentMonthInstallments.map(i => new Date(i.dueDate).getTime())))
      const paidAt = allConfirmed
        ? new Date(Math.max(...currentMonthInstallments.map(i => i.paidAt ? new Date(i.paidAt).getTime() : 0)))
        : null
      const nextPending = currentMonthInstallments.find(i => i.status !== 'CONFIRMED') || null

      return {
        mode: 'installment' as const,
        amount: amountSum,
        status: allConfirmed ? 'CONFIRMED' : (anyLate ? 'LATE' : 'PENDING'),
        dueDate,
        paidAt,
        installment: nextPending, // used for quick action to mark next pending
        isPaid: allConfirmed,
        monthInstallmentsCount: currentMonthInstallments.length,
        hasInstallmentsThisMonth: true,
      }
    }

    // If client is in installment mode but has no installments this month, block monthly confirmation
    if (isInstallment && installments.length > 0 && currentMonthInstallments.length === 0) {
      const dueDate = new Date(now.getFullYear(), now.getMonth(), Math.min(Math.max(paymentDay || 1, 1), 28))
      return {
        mode: 'installment' as const,
        amount: 0,
        status: 'PENDING',
        dueDate,
        paidAt: null,
        installment: null,
        isPaid: false,
        monthInstallmentsCount: 0,
        hasInstallmentsThisMonth: false,
      }
    }

    // Monthly contract: compute expected due date and check finance entries
    const dueDate = (() => {
      const d = new Date(now.getFullYear(), now.getMonth(), Math.min(Math.max(paymentDay || 1, 1), 28))
      return d
    })()
    const monthFinances = finances.filter((f) => {
      const d = new Date(f.date)
      return getMonthKey(d) === thisMonthKey && f.type === 'income'
    })
    const totalIncome = monthFinances.reduce((sum, f) => sum + (f.type === 'income' ? f.amount : 0), 0)
    const isPaid = !!contractValue && totalIncome >= (contractValue * 0.9) // tolerância 10%

    return {
      mode: 'monthly' as const,
      amount: contractValue || 0,
      status: isPaid ? 'CONFIRMED' : (now > dueDate ? 'LATE' : 'PENDING'),
      dueDate,
      paidAt: null as Date | null,
      installment: null,
      isPaid,
    }
  }, [installments, finances, contractValue, paymentDay, isInstallment])

  const handleMarkPaidMonthly = async () => {
    if (!contractValue) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          type: 'income',
          amount: contractValue,
          description: `Mensalidade ${clientName} - ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
          category: 'Mensalidade',
          date: toLocalISOString(new Date()),
        }),
      })
      if (!res.ok) throw new Error('Falha ao registrar pagamento')
      toast.success('Pagamento registrado')
      // refresh finances
      const fins = await fetch(`/api/finance`).then(r => r.ok ? r.json() : [])
      setFinances(Array.isArray(fins) ? fins.filter((f: Finance) => f.clientId === clientId) : [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao registrar pagamento')
    } finally {
      setSubmitting(false)
    }
  }

  const handleMarkPaidInstallment = async () => {
    const inst = monthly.installment as Installment | null
    if (!inst) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/clients/${clientId}/installments?installmentId=${inst.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CONFIRMED', paidAt: toLocalISOString(new Date()) }),
      })
      if (!res.ok) throw new Error('Falha ao marcar parcela como paga')
      toast.success('Parcela marcada como paga')
      // refresh installments
      const insts = await fetch(`/api/clients/${clientId}/installments`).then(r => r.ok ? r.json() : [])
      setInstallments(Array.isArray(insts) ? insts : [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao marcar como pago')
    } finally {
      setSubmitting(false)
    }
  }

  const statusStyle = (status: 'PENDING' | 'CONFIRMED' | 'LATE') => {
    if (status === 'CONFIRMED') return 'text-green-700 bg-green-50 border-green-200'
    if (status === 'LATE') return 'text-red-700 bg-red-50 border-red-200'
    return 'text-amber-700 bg-amber-50 border-amber-200'
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" /> Pagamento do Mês
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className={`flex items-center justify-between p-3 rounded-lg border ${statusStyle(monthly.status)}`}>
          <div className="flex items-center gap-3">
            {monthly.status === 'CONFIRMED' ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : monthly.status === 'LATE' ? (
              <XCircle className="h-5 w-5 text-red-600" />
            ) : (
              <Clock className="h-5 w-5 text-amber-600" />
            )}
            <div>
              <div className="text-sm font-semibold">
                {monthly.mode === 'installment'
                  ? (monthly as Extract<MonthlyState, { mode: 'installment' }>).monthInstallmentsCount > 1
                    ? `Parcelas do mês (${(monthly as Extract<MonthlyState, { mode: 'installment' }>).monthInstallmentsCount})`
                    : 'Parcela do mês'
                  : 'Mensalidade'}
              </div>
              {(monthly.mode === 'installment'
                ? (monthly as Extract<MonthlyState, { mode: 'installment' }>).hasInstallmentsThisMonth
                : true) && (
                  <div className="text-xs text-slate-600 flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    Vencimento: {monthly.dueDate.toLocaleDateString('pt-BR')}
                  </div>
                )}
              {monthly.mode === 'installment' && !(monthly as Extract<MonthlyState, { mode: 'installment' }>).hasInstallmentsThisMonth && (
                <div className="text-xs text-slate-600">Sem parcela neste mês</div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthly.amount || 0)}
            </div>
            <div className="text-xs text-slate-500 capitalize">
              {monthly.status === 'CONFIRMED' ? 'Pago' : monthly.status === 'LATE' ? 'Atrasado' : 'Pendente'}
            </div>
          </div>
        </div>

        {canEdit && monthly.status !== 'CONFIRMED' && (
          <div className="flex justify-end">
            <Button
              onClick={monthly.mode === 'installment' ? handleMarkPaidInstallment : handleMarkPaidMonthly}
              disabled={submitting || (monthly.mode === 'installment' && !(monthly as Extract<MonthlyState, { mode: 'installment' }>).hasInstallmentsThisMonth)}
            >
              {submitting ? (
                <LoadingSpinner />
              ) : monthly.mode === 'installment' ? (
                'Marcar próxima parcela do mês como paga'
              ) : (
                'Marcar como Pago'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
