import { can, type AppRole } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function FinanceDashboardPage() {
  const { orgId, role } = await getSessionProfile()
  if (!orgId || !role || !can(role as unknown as AppRole, 'read', 'finance')) {
    return (
      <div className="p-6">Acesso negado ou não autenticado.</div>
    )
  }

  const now = new Date()
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || process.env.SITE_URL || 'http://localhost:3000'
  const [fixedExpenses, summary, projection] = await Promise.all([
    prisma.fixedExpense.findMany({ where: { orgId, active: true }, orderBy: { name: 'asc' } }),
    fetch(`${baseUrl}/api/finance/summary?month=${month}`, { cache: 'no-store' }).then((r) => r.json()),
    fetch(`${baseUrl}/api/finance/projection?month=${month}`, { cache: 'no-store' }).then((r) => r.json()),
  ])

  return (
    <div className="p-6 space-y-8">
      {/* Header sofisticado */}
      <header className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-900 via-blue-900 to-indigo-900 p-6 sm:p-8 text-white shadow-2xl border border-white/10">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Financeiro</h1>
            <p className="text-blue-200 text-sm mt-1">Gestão completa de receitas e cobranças</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/billing/overdue" className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm text-sm">Ver inadimplência</Link>
            <Link href={`/api/billing/invoices/export`} className="px-3 py-2 rounded-lg bg-white text-slate-900 hover:bg-white/90 text-sm">Exportar CSV</Link>
          </div>
        </div>
        {/* Tabs locais (visual) */}
        <div className="mt-4 flex flex-wrap gap-2">
          {['Resumo', 'Lançamentos', 'Projeção', 'Despesas Fixas'].map((t) => (
            <span key={t} className="px-3 py-2 rounded-lg text-sm bg-white/10 text-white border border-white/20">{t}</span>
          ))}
        </div>
      </header>

      <section>
        <h2 className="text-xl font-medium">Resumo mensal</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          <Stat label="Receita bruta" value={summary.grossRevenue} />
          <Stat label="Despesas variáveis" value={summary.variableExpenses} />
          <Stat label="Despesas fixas" value={summary.fixedMonthly} />
          <Stat label="Lucro líquido" value={summary.netProfit} highlight />
          <Stat label="Faturas pagas" value={summary.paidInvoicesCount} integer />
          <Stat label="Faturas em atraso" value={summary.overdueInvoicesCount} integer />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-medium">Projeção próximo mês</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          <Stat label="Receita estimada" value={projection?.estimatedRevenue ?? 0} />
          <Stat label="Despesas fixas" value={projection?.fixedMonthly ?? 0} />
          <Stat label="Resultado estimado" value={projection?.netEstimate ?? 0} highlight />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-medium">Despesas fixas</h2>
        <FixedExpenseCreateForm />
        <FixedExpenseList items={fixedExpenses} />
      </section>
    </div>
  )
}

function Stat({ label, value, highlight, integer }: { label: string; value: number; highlight?: boolean; integer?: boolean }) {
  const safe = typeof value === 'number' && !Number.isNaN(value) ? value : 0
  const formatted = integer ? Math.round(safe).toString() : safe.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  return (
    <div className={`rounded border p-4 ${highlight ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-lg font-semibold">{formatted}</div>
    </div>
  )
}

async function serverUpdateFixedExpense(
  id: string,
  payload: Partial<{ name: string; amount: number; cycle: 'MONTHLY' | 'ANNUAL'; category: string; active: boolean }>
) {
  'use server'
  const { orgId, role } = await getSessionProfile()
  if (!orgId || !role || !can(role as unknown as AppRole, 'update', 'finance')) return
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/finance/fixed-expenses`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id, ...payload }),
  })
}

async function serverCreateFixedExpense(formData: FormData) {
  'use server'
  const { orgId, role } = await getSessionProfile()
  if (!orgId || !role || !can(role as unknown as AppRole, 'create', 'finance')) return
  const payload = {
    name: String(formData.get('name') || ''),
    amount: Number(formData.get('amount') || 0),
    cycle: String(formData.get('cycle') || 'MONTHLY') as 'MONTHLY' | 'ANNUAL',
    category: String(formData.get('category') || ''),
  }
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/finance/fixed-expenses`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

function FixedExpenseCreateForm() {
  return (
    <form action={serverCreateFixedExpense} className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-2">
      <input name="name" placeholder="Nome da despesa" className="border rounded p-2" required />
      <input name="amount" type="number" step="0.01" placeholder="Valor" className="border rounded p-2" required />
      <select
        title="Ciclo" name="cycle" className="border rounded p-2">
        <option value="MONTHLY">Mensal</option>
        <option value="ANNUAL">Anual</option>
      </select>
      <input name="category" placeholder="Categoria (opcional)" className="border rounded p-2" />
      <button type="submit" className="rounded bg-blue-600 text-white px-3 py-2 hover:bg-blue-700">Adicionar</button>
    </form>
  )
}

function FixedExpenseList({
  items,
}: {
  items: Array<{ id: string; name: string; amount: number; cycle: 'MONTHLY' | 'ANNUAL'; category: string | null }>
}) {
  return (
    <div className="space-y-2 mt-4">
      {items.length === 0 && <div className="text-gray-500">Nenhuma despesa fixa cadastrada.</div>}
      {items.map((e) => (
        <div key={e.id} className="flex items-center justify-between rounded border p-3 bg-white">
          <div>
            <div className="font-medium">{e.name}</div>
            <div className="text-xs text-gray-500">
              {e.category || 'Sem categoria'} • {e.cycle === 'MONTHLY' ? 'Mensal' : 'Anual'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{e.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            <form action={async () => {
              'use server'
              await serverUpdateFixedExpense(e.id, { active: false })
            }}>
              <button type="submit" className="rounded bg-red-100 text-red-700 px-2 py-1 hover:bg-red-200">
                Desativar
              </button>
            </form>
            <details className="relative">
              <summary className="cursor-pointer text-blue-600 hover:text-blue-800">Editar</summary>
              <form
                action={async (formData: FormData) => {
                  'use server'
                  await serverUpdateFixedExpense(e.id, {
                    name: String(formData.get('name') || e.name),
                    amount: Number(formData.get('amount') || e.amount),
                    cycle: String(formData.get('cycle') || e.cycle) as 'MONTHLY' | 'ANNUAL',
                    category: String(formData.get('category') || e.category || ''),
                  })
                }}
                className="mt-2 p-4 border rounded bg-gray-50 grid grid-cols-1 gap-2"
              >
                <input name="name" defaultValue={e.name} className="border rounded p-2" placeholder="Nome" />
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  defaultValue={e.amount}
                  className="border rounded p-2"
                  placeholder="Valor"
                />
                <select name="cycle" defaultValue={e.cycle} className="border rounded p-2">
                  <option value="MONTHLY">Mensal</option>
                  <option value="ANNUAL">Anual</option>
                </select>
                <input name="category" defaultValue={e.category || ''} className="border rounded p-2" placeholder="Categoria" />
                <button type="submit" className="rounded bg-blue-600 text-white px-3 py-2 hover:bg-blue-700">
                  Salvar alterações
                </button>
              </form>
            </details>
          </div>
        </div>
      ))}
    </div>
  )
}
