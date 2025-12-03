import Pagination from "@/components/common/Pagination";
import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CSVImportButton } from "@/features/finance/components/CSVImportButton";
import { FinanceCreateModal } from "@/features/finance/components/FinanceCreateModal";
import { FinanceTable } from "@/features/finance/components/FinanceTable";
import { formatBRL, formatDateBR } from "@/lib/format";
import { can, can as canPerm } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getSessionProfile as getSession, getSessionProfile } from "@/services/auth/session";
import { BillingService, type InvoiceListFilters, type InvoiceStatusFilter } from "@/services/billing/BillingService";
import { Prisma } from "@prisma/client";
import { AlertCircle, ArrowUpRight, BadgeDollarSign, CheckCircle2, Clock, FileText, TrendingUp, Wallet } from "lucide-react";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BillingContent } from "./BillingContent";

async function serverUpdateFixedExpense(
  id: string,
  payload: Partial<{ name: string; amount: number; cycle: 'MONTHLY' | 'ANNUAL'; category: string; active: boolean }>
) {
  'use server'
  const { orgId, role } = await getSession()
  if (!orgId || !role || !canPerm(role, 'update', 'finance')) return

  await prisma.fixedExpense.update({
    where: { id },
    data: payload,
  })

  revalidatePath('/billing')
  redirect('/billing?tab=fixas')
}

async function serverCreateFixedExpense(formData: FormData) {
  'use server'
  const { orgId, role } = await getSession()
  if (!orgId || !role || !canPerm(role, 'create', 'finance')) return

  const name = String(formData.get('name') || '')
  const amount = Number(formData.get('amount') || 0)
  const cycle = String(formData.get('cycle') || 'MONTHLY') as 'MONTHLY' | 'ANNUAL'
  const category = String(formData.get('category') || '') || null

  await prisma.fixedExpense.create({
    data: {
      orgId,
      name,
      amount,
      cycle,
      category,
      active: true,
    },
  })

  revalidatePath('/billing')
  redirect('/billing?tab=fixas')
}

// Marca despesa fixa como paga e insere em finanças
async function serverPayFixedExpense(expenseId: string) {
  'use server'
  const { orgId, role } = await getSession()
  if (!orgId || !role || !canPerm(role, 'create', 'finance')) return

  const expense = await prisma.fixedExpense.findUnique({ where: { id: expenseId } })
  if (!expense || !expense.active || expense.orgId !== orgId) return

  await prisma.finance.create({
    data: {
      orgId,
      type: 'expense',
      amount: expense.amount,
      category: expense.category || 'Despesas Fixas',
      description: `Despesa fixa: ${expense.name}`,
      date: new Date(),
    }
  })

  revalidatePath('/billing')
  redirect('/billing?tab=fixas')
}

// Config de cache e revalidação
export const revalidate = 60; // 1 minuto
export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams?: Promise<Record<string, string>>
}

export default async function BillingHomePage({ searchParams }: PageProps) {
  const { orgId, role } = await getSessionProfile();
  if (!orgId || !role || !can(role, "read", "finance")) return null;

  const now = new Date();
  const [overdue, open, paidRecent] = await Promise.all([
    prisma.invoice.count({ where: { orgId, OR: [{ status: "OVERDUE" }, { AND: [{ status: "OPEN" }, { dueDate: { lt: now } }] }] } }),
    prisma.invoice.count({ where: { orgId, status: "OPEN" } }),
    prisma.payment.count({ where: { orgId, paidAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } } }),
  ]);

  const sp = (await searchParams) || {}
  const currentTab = (sp.tab?.toString() || 'resumo') as 'resumo' | 'faturas' | 'lancamentos' | 'projecao' | 'fixas'
  const status = (sp.status?.toString().toUpperCase() as InvoiceStatusFilter) || undefined
  const q = sp.q?.toString() || undefined
  const issueFrom = sp.issueFrom?.toString() || undefined
  const issueTo = sp.issueTo?.toString() || undefined
  const dueFrom = sp.dueFrom?.toString() || undefined
  const dueTo = sp.dueTo?.toString() || undefined
  const minAmount = sp.minAmount ? Number(sp.minAmount) : undefined
  const maxAmount = sp.maxAmount ? Number(sp.maxAmount) : undefined
  const page = Number(sp.page || '1') || 1
  const pageSize = 20

  const filterOptions: InvoiceListFilters = { status, q, issueFrom, issueTo, dueFrom, dueTo, minAmount, maxAmount, page, pageSize }
  const { items: invoices, total } = await BillingService.listOrgInvoices(orgId, filterOptions)

  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const [paymentsMonth, financeIncomeMonth] = await Promise.all([
    prisma.payment.findMany({
      where: { orgId, paidAt: { gte: startMonth, lte: endMonth } }
    }),
    prisma.finance.findMany({
      where: { orgId, type: 'income', date: { gte: startMonth, lte: endMonth } }
    })
  ])
  const incomeMonth = paymentsMonth.reduce((s, p) => s + p.amount, 0) + financeIncomeMonth.reduce((s, f) => s + f.amount, 0)

  const expensesMonth = await prisma.finance.findMany({
    where: { orgId, type: 'expense', date: { gte: startMonth, lte: endMonth } }
  })
  const expenseMonth = expensesMonth.reduce((s, r) => s + r.amount, 0)
  const netMonth = incomeMonth - expenseMonth

  const [allPayments, allFinanceIncome] = await Promise.all([
    prisma.payment.findMany({
      where: { orgId },
      select: { amount: true }
    }),
    prisma.finance.findMany({
      where: { orgId, type: 'income' },
      select: { amount: true }
    })
  ])
  const totalIncome = allPayments.reduce((s, p) => s + p.amount, 0) + allFinanceIncome.reduce((s, f) => s + f.amount, 0)

  const allExpenses = await prisma.finance.findMany({
    where: { orgId, type: 'expense' },
    select: { amount: true }
  })
  const totalExpense = allExpenses.reduce((s, r) => s + r.amount, 0)
  const totalNet = totalIncome - totalExpense

  let reconciliation: { invoicesPaidWithoutLinks: number; financesIncomeWithoutInvoiceId: number; currentMonth: { paymentsTotal: number; financesIncomeTotal: number; delta: number } } | null = null
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || process.env.SITE_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/reconciliation/summary`, { cache: 'no-store' })
    if (res.ok) {
      reconciliation = await res.json()
    }
  } catch { }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-[1600px] mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
        {/* HEADER SOFISTICADO */}
        <header className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-900 via-blue-900 to-indigo-900 p-8 sm:p-10 text-white shadow-2xl border border-white/10">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl" />

          <div className="relative">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <BadgeDollarSign className="h-7 w-7" />
                  </div>
                  <div>
                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Financeiro</h1>
                    <p className="text-blue-200 text-sm mt-1">Gestão completa de receitas e cobranças</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <CSVImportButton />
                <Button size="sm" asChild className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm">
                  <Link href="/billing/overdue">Ver inadimplência</Link>
                </Button>
                <Button size="sm" asChild variant="secondary" className="bg-white text-slate-900 hover:bg-white/90">
                  <a href={`/api/billing/invoices/export?${new URLSearchParams((await searchParams) || {}).toString()}`}>
                    Exportar CSV
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </header>

        <BillingContent initialTab={currentTab} />

        {/* KPIs PRINCIPAIS - GRID OTIMIZADO */}
        {currentTab === 'resumo' && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="relative overflow-hidden border border-red-200 dark:border-red-900/50 hover:shadow-xl transition-all group bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-red-500/10 to-pink-500/10 rounded-full blur-2xl group-hover:scale-110 transition-transform" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Vencidas</CardTitle>
                <div className="h-10 w-10 rounded-xl bg-linear-to-br from-red-500 to-pink-600 flex items-center justify-center shadow-lg">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{overdue}</div>
                <p className="text-xs text-muted-foreground mt-1">Faturas pendentes</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border border-blue-200 dark:border-blue-900/50 hover:shadow-xl transition-all group bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-2xl group-hover:scale-110 transition-transform" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Em aberto</CardTitle>
                <div className="h-10 w-10 rounded-xl bg-linear-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
                  <Clock className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{open}</div>
                <p className="text-xs text-muted-foreground mt-1">Aguardando</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border border-emerald-200 dark:border-emerald-900/50 hover:shadow-xl transition-all group bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-emerald-500/10 to-green-500/10 rounded-full blur-2xl group-hover:scale-110 transition-transform" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pagamentos</CardTitle>
                <div className="h-10 w-10 rounded-xl bg-linear-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-600">{paidRecent}</div>
                <p className="text-xs text-muted-foreground mt-1">Confirmados este mês</p>
              </CardContent>
            </Card>

            <Card className={`relative overflow-hidden border hover:shadow-xl transition-all group bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm ${netMonth >= 0 ? 'border-emerald-200 dark:border-emerald-900/50' : 'border-orange-200 dark:border-orange-900/50'}`}>
              <div className={`absolute top-0 right-0 w-32 h-32 bg-linear-to-br ${netMonth >= 0 ? 'from-emerald-500/10 to-teal-500/10' : 'from-orange-500/10 to-red-500/10'} rounded-full blur-2xl group-hover:scale-110 transition-transform`} />
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Saldo do mês</CardTitle>
                <div className={`h-10 w-10 rounded-xl bg-linear-to-br ${netMonth >= 0 ? 'from-emerald-500 to-teal-600' : 'from-orange-500 to-red-600'} flex items-center justify-center shadow-lg`}>
                  <Wallet className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${netMonth >= 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                  {formatBRL(netMonth)}
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  {netMonth >= 0 ? (
                    <><TrendingUp className="h-3 w-3" /> Positivo</>
                  ) : (
                    <><ArrowUpRight className="h-3 w-3 rotate-90" /> Negativo</>
                  )}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {currentTab === 'resumo' && (
          <Card className={`relative overflow-hidden border hover:shadow-xl transition-all group bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm ${totalNet >= 0 ? 'border-violet-200 dark:border-violet-900/50' : 'border-orange-200 dark:border-orange-900/50'}`}>
            <div className={`absolute top-0 right-0 w-48 h-48 bg-linear-to-br ${totalNet >= 0 ? 'from-violet-500/10 to-purple-500/10' : 'from-orange-500/10 to-red-500/10'} rounded-full blur-3xl group-hover:scale-110 transition-transform`} />
            <div className={`absolute bottom-0 left-0 w-40 h-40 bg-linear-to-br ${totalNet >= 0 ? 'from-indigo-500/10 to-violet-500/10' : 'from-red-500/10 to-orange-500/10'} rounded-full blur-3xl group-hover:scale-110 transition-transform`} />

            <CardHeader className="relative flex flex-row items-center justify-between pb-2 space-y-0">
              <div>
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Saldo Total</CardTitle>
                <div className={`text-4xl font-bold ${totalNet >= 0 ? 'text-violet-600' : 'text-orange-600'}`}>
                  {formatBRL(totalNet)}
                </div>
              </div>
              <div className={`h-12 w-12 rounded-xl bg-linear-to-br ${totalNet >= 0 ? 'from-violet-500 to-purple-600' : 'from-orange-500 to-red-600'} flex items-center justify-center shadow-lg`}>
                <BadgeDollarSign className="h-6 w-6 text-white" />
              </div>
            </CardHeader>

            <CardContent className="relative">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/30">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                    <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Receitas</p>
                  </div>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatBRL(totalIncome)}</p>
                </div>

                <div className="p-3 rounded-lg bg-red-50/50 dark:bg-red-950/30 border border-red-200/50 dark:border-red-900/30">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <ArrowUpRight className="h-3.5 w-3.5 rotate-90 text-red-600" />
                    <p className="text-xs font-medium text-red-700 dark:text-red-400">Despesas</p>
                  </div>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatBRL(totalExpense)}</p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Margem</span>
                <span className={`font-semibold ${totalNet >= 0 ? 'text-violet-600' : 'text-orange-600'}`}>
                  {totalIncome > 0 ? ((totalNet / totalIncome) * 100).toFixed(1) : '0'}%
                </span>
              </div>

              {reconciliation && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-6 w-6 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reconciliação</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-900/30">
                      <p className="text-xs text-muted-foreground mb-0.5">Sem vínculo</p>
                      <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{reconciliation.invoicesPaidWithoutLinks}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-900/30">
                      <p className="text-xs text-muted-foreground mb-0.5">Órfãs</p>
                      <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{reconciliation.financesIncomeWithoutInvoiceId}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200/50 dark:border-violet-900/30">
                      <p className="text-xs text-muted-foreground mb-0.5">Delta</p>
                      <p className={`text-lg font-bold ${reconciliation.currentMonth.delta >= 0 ? 'text-violet-700 dark:text-violet-300' : 'text-red-600'}`}>{formatBRL(reconciliation.currentMonth.delta)}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/api/reconciliation/details" target="_blank" className="text-xs">Ver detalhes</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {currentTab === 'resumo' && (
          <Card className="border border-blue-200 dark:border-blue-900/50 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <CardHeader className="bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                Resumo do Mês
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-6 sm:grid-cols-3 mb-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Receitas</p>
                      <p className="text-xl font-bold text-emerald-600">{formatBRL(incomeMonth)}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <ArrowUpRight className="h-5 w-5 rotate-90 text-red-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Despesas</p>
                      <p className="text-xl font-bold text-red-600">{formatBRL(expenseMonth)}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`h-10 w-10 rounded-xl ${netMonth >= 0 ? 'bg-violet-100 dark:bg-violet-900/30' : 'bg-orange-100 dark:bg-orange-900/30'} flex items-center justify-center`}>
                      <Wallet className={`h-5 w-5 ${netMonth >= 0 ? 'text-violet-600' : 'text-orange-600'}`} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Líquido</p>
                      <p className={`text-xl font-bold ${netMonth >= 0 ? 'text-violet-600' : 'text-orange-600'}`}>{formatBRL(netMonth)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Margem</span>
                  <span className="font-semibold">{incomeMonth > 0 ? ((netMonth / incomeMonth) * 100).toFixed(1) : '0'}%</span>
                </div>
                <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all ${netMonth >= 0 ? 'bg-linear-to-r from-emerald-500 to-teal-500' : 'bg-linear-to-r from-red-500 to-orange-500'}`}
                    style={{ width: incomeMonth > 0 ? `${Math.min(Math.max((netMonth / incomeMonth) * 100, 0), 100)}%` : '0%' }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {(currentTab === 'fixas' || currentTab === 'projecao') && (
          <div className="grid gap-6 grid-cols-1">
            {/* Despesas Fixas */}
            {currentTab === 'fixas' && (
              <Card className="border border-purple-200 dark:border-purple-900/50 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <CardHeader className="bg-linear-to-r from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-linear-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                        <Wallet className="h-4 w-4 text-white" />
                      </div>
                      Despesas Fixas
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {/* Formulário de criação */}
                  <form action={serverCreateFixedExpense} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 mb-4">
                    <Input name="name" placeholder="Nome" className="h-9" required />
                    <Input name="amount" type="number" step="0.01" placeholder="Valor" className="h-9" required />
                    <select name="cycle" title="Ciclo" className="h-9 border rounded px-2">
                      <option value="MONTHLY">Mensal</option>
                      <option value="ANNUAL">Anual</option>
                    </select>
                    <Input name="category" placeholder="Categoria (opcional)" className="h-9" />
                    <Button type="submit" size="sm" className="w-full sm:w-auto">Adicionar</Button>
                  </form>
                  {(async () => {
                    const fixedExpenses = await prisma.fixedExpense.findMany({
                      where: { orgId, active: true },
                      orderBy: { name: 'asc' },
                    })
                    const monthlyTotal = fixedExpenses
                      .filter((e) => e.cycle === 'MONTHLY')
                      .reduce((sum, e) => sum + e.amount, 0)
                    return (
                      <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-900/30">
                          <p className="text-xs text-muted-foreground mb-1">Total Mensal</p>
                          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{formatBRL(monthlyTotal)}</p>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {fixedExpenses.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma despesa fixa cadastrada.</p>
                          )}
                          {fixedExpenses.map((e) => (
                            <div key={e.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{e.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {e.category || 'Sem categoria'} • {e.cycle === 'MONTHLY' ? 'Mensal' : 'Anual'}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold">{formatBRL(e.amount)}</p>
                                  <form action={async () => {
                                    'use server'
                                    await serverPayFixedExpense(e.id)
                                  }}>
                                    <Button type="submit" variant="default" size="sm">Marcar como paga</Button>
                                  </form>
                                  <form className="ml-1" action={async () => {
                                    'use server'
                                    await serverUpdateFixedExpense(e.id, { active: false })
                                  }}>
                                    <Button type="submit" variant="outline" size="sm">Desativar</Button>
                                  </form>
                                </div>
                              </div>
                              <details className="mt-2">
                                <summary className="cursor-pointer text-xs text-blue-600">Editar</summary>
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
                                  className="mt-2 grid grid-cols-1 md:grid-cols-5 gap-2"
                                >
                                  <Input name="name" defaultValue={e.name} className="h-9" />
                                  <Input name="amount" type="number" step="0.01" defaultValue={e.amount} className="h-9" />
                                  <select name="cycle" defaultValue={e.cycle} className="h-9 border rounded px-2">
                                    <option value="MONTHLY">Mensal</option>
                                    <option value="ANNUAL">Anual</option>
                                  </select>
                                  <Input name="category" defaultValue={e.category || ''} className="h-9" />
                                  <Button type="submit" size="sm">Salvar</Button>
                                </form>
                              </details>
                            </div>
                          ))}
                        </div>

                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Projeção Próximo Mês */}
            {currentTab === 'projecao' && (
              <Card className="border border-indigo-200 dark:border-indigo-900/50 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <CardHeader className="bg-linear-to-r from-indigo-50 to-blue-50 dark:from-indigo-950 dark:to-blue-950">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-linear-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-white" />
                    </div>
                    Projeção Próximo Mês
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {(async () => {
                    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
                    const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0)
                    const [activeClients, installmentsDue, fixedExpenses] = await Promise.all([
                      prisma.client.findMany({
                        where: {
                          orgId,
                          status: { in: ['active', 'new'] },
                          contractValue: { gt: 0 },
                        },
                        select: { contractValue: true },
                      }),
                      prisma.installment.findMany({
                        where: {
                          client: { orgId },
                          dueDate: { gte: nextMonth, lte: nextMonthEnd },
                          status: { in: ['PENDING', 'CONFIRMED'] },
                        },
                        select: { amount: true },
                      }),
                      prisma.fixedExpense.findMany({
                        where: { orgId, active: true, cycle: 'MONTHLY' },
                        select: { amount: true },
                      }),
                    ])
                    const contractsRevenue = activeClients.reduce((sum, c) => sum + (c.contractValue || 0), 0)
                    const installmentsRevenue = installmentsDue.reduce((sum, i) => sum + i.amount, 0)
                    const estimatedRevenue = contractsRevenue + installmentsRevenue
                    const fixedMonthly = fixedExpenses.reduce((sum, e) => sum + e.amount, 0)
                    const netEstimate = estimatedRevenue - fixedMonthly
                    return (
                      <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-900/30">
                          <p className="text-xs text-muted-foreground mb-1">Receita Estimada</p>
                          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{formatBRL(estimatedRevenue)}</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/30">
                            <p className="text-xs text-muted-foreground mb-1">Contratos</p>
                            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatBRL(contractsRevenue)}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/30">
                            <p className="text-xs text-muted-foreground mb-1">Parcelas</p>
                            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatBRL(installmentsRevenue)}</p>
                          </div>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-muted-foreground">Despesas Fixas</p>
                            <p className="text-sm font-semibold text-red-600">{formatBRL(fixedMonthly)}</p>
                          </div>
                          <div className="pt-2 border-t flex items-center justify-between">
                            <p className="text-xs font-medium text-muted-foreground">Resultado Estimado</p>
                            <p className={`text-lg font-bold ${netEstimate >= 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                              {formatBRL(netEstimate)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* FATURAS */}
        {currentTab === 'faturas' && (
          <Card className="border border-slate-200 dark:border-slate-800 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <CardHeader className="bg-linear-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-linear-to-br from-slate-600 to-slate-800 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  Faturas
                </CardTitle>
                <form className="flex flex-wrap items-end gap-2 rounded-xl p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800" method="get">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-wide text-muted-foreground">Status</label>
                    <select aria-label="Status" name="status" defaultValue={status || ''} className="h-9 text-xs border rounded-lg px-3 bg-background min-w-28">
                      <option value="">Todas</option>
                      <option value="OPEN">Abertas</option>
                      <option value="OVERDUE">Vencidas</option>
                      <option value="PAID">Pagas</option>
                      <option value="VOID">Canceladas</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="q" className="text-[10px] uppercase tracking-wide text-muted-foreground">Busca</label>
                    <Input id="q" name="q" defaultValue={q || ''} placeholder="Número, cliente..." className="h-9 text-xs w-40" />
                  </div>

                  <div className="flex items-end gap-2">
                    <div className="flex flex-col gap-1">
                      <label htmlFor="issueFrom" className="text-[10px] uppercase tracking-wide text-muted-foreground">Emitida de</label>
                      <Input id="issueFrom" name="issueFrom" type="date" defaultValue={issueFrom || ''} className="h-9 text-xs" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label htmlFor="issueTo" className="text-[10px] uppercase tracking-wide text-muted-foreground">Emitida até</label>
                      <Input id="issueTo" name="issueTo" type="date" defaultValue={issueTo || ''} className="h-9 text-xs" />
                    </div>
                  </div>

                  <div className="flex items-end gap-2">
                    <div className="flex flex-col gap-1">
                      <label htmlFor="dueFrom" className="text-[10px] uppercase tracking-wide text-muted-foreground">Venc. de</label>
                      <Input id="dueFrom" name="dueFrom" type="date" defaultValue={dueFrom || ''} className="h-9 text-xs" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label htmlFor="dueTo" className="text-[10px] uppercase tracking-wide text-muted-foreground">Venc. até</label>
                      <Input id="dueTo" name="dueTo" type="date" defaultValue={dueTo || ''} className="h-9 text-xs" />
                    </div>
                  </div>

                  <div className="flex items-end gap-2">
                    <div className="flex flex-col gap-1">
                      <label htmlFor="minAmount" className="text-[10px] uppercase tracking-wide text-muted-foreground">Valor mín.</label>
                      <Input id="minAmount" name="minAmount" type="number" step="0.01" defaultValue={minAmount || ''} placeholder="0,00" className="h-9 text-xs w-28" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label htmlFor="maxAmount" className="text-[10px] uppercase tracking-wide text-muted-foreground">Valor máx.</label>
                      <Input id="maxAmount" name="maxAmount" type="number" step="0.01" defaultValue={maxAmount || ''} placeholder="0,00" className="h-9 text-xs w-28" />
                    </div>
                  </div>

                  <div className="flex items-end gap-2 ml-auto">
                    <Button type="submit" size="sm">Filtrar</Button>
                    {(status || q || issueFrom || issueTo || dueFrom || dueTo || minAmount || maxAmount) && (
                      <Button type="button" size="sm" variant="outline" asChild>
                        <Link href={`/billing?${new URLSearchParams({ tab: 'faturas' }).toString()}`}>Limpar</Link>
                      </Button>
                    )}
                  </div>
                </form>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground p-8 text-center">Nenhuma fatura encontrada.</p>
              ) : (
                <>
                  <div className="hidden md:block divide-y">
                    {invoices.map((inv) => (
                      <div key={inv.id} className="py-3 px-6 flex items-center justify-between hover:bg-muted/50 transition-colors">
                        <div className="min-w-0">
                          <div className="text-sm font-medium">{inv.number} — {inv.client.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDateBR(inv.issueDate)} • vence {formatDateBR(inv.dueDate)}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge status={inv.status} />
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/clients/${inv.clientId}/billing/invoices/${inv.id}`}>Ver</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="md:hidden divide-y">
                    {invoices.map((inv) => (
                      <div key={inv.id} className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium text-sm">{inv.number}</div>
                            <div className="text-xs text-muted-foreground">{inv.client.name}</div>
                          </div>
                          <StatusBadge status={inv.status} />
                        </div>
                        <Button variant="outline" size="sm" asChild className="w-full">
                          <Link href={`/clients/${inv.clientId}/billing/invoices/${inv.id}`}>Ver detalhes</Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {total > pageSize && (
                <div className="p-4 border-t">
                  <Pagination
                    page={page}
                    total={total}
                    pageSize={pageSize}
                    baseHref={`/billing?${new URLSearchParams({
                      tab: 'faturas',
                      ...(status ? { status } : {}),
                      ...(q ? { q } : {}),
                      ...(issueFrom ? { issueFrom } : {}),
                      ...(issueTo ? { issueTo } : {}),
                      ...(dueFrom ? { dueFrom } : {}),
                      ...(dueTo ? { dueTo } : {}),
                      ...(minAmount !== undefined ? { minAmount: minAmount.toString() } : {}),
                      ...(maxAmount !== undefined ? { maxAmount: maxAmount.toString() } : {}),
                    }).toString()}`}
                    className="flex items-center justify-between text-xs"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* LANÇAMENTOS */}
        {currentTab === 'lancamentos' && (
          <Card className="border border-emerald-200 dark:border-emerald-900/50 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <CardHeader className="bg-linear-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  Lançamentos Financeiros
                </CardTitle>
                <FinanceCreateModal />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {(async () => {
                const sp = (searchParams ? (await searchParams) : {}) as Record<string, string>
                const fType = sp['type'] || undefined
                const qf = sp['q'] || undefined
                const cat = sp['category'] || undefined
                const fromStr = sp['from']
                const toStr = sp['to']
                const minStr = sp['min']
                const maxStr = sp['max']
                const clientQ = sp['client'] || undefined
                const pageF = Number(sp['financePage'] || '1') || 1
                const pageSizeF = 15
                const where: Prisma.FinanceWhereInput = { orgId }
                if (fType) where.type = fType
                if (qf) where.OR = [{ description: { contains: qf, mode: 'insensitive' } }, { category: { contains: qf, mode: 'insensitive' } }]
                if (cat) where.category = { contains: cat, mode: 'insensitive' }
                if (fromStr || toStr) where.date = { gte: fromStr ? new Date(fromStr) : undefined, lte: toStr ? new Date(toStr) : undefined }
                if (minStr || maxStr) where.amount = { gte: minStr ? Number(minStr) : undefined, lte: maxStr ? Number(maxStr) : undefined }
                if (clientQ) where.client = { name: { contains: clientQ, mode: 'insensitive' } }
                const skip = (pageF - 1) * pageSizeF
                const [rows, totalF] = await Promise.all([
                  prisma.finance.findMany({ where, skip, take: pageSizeF, orderBy: { date: 'desc' }, include: { client: true } }),
                  prisma.finance.count({ where }),
                ])
                return (
                  <div className="space-y-4">
                    <form className="flex flex-wrap items-end gap-2 rounded-xl p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800" method="get">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase tracking-wide text-muted-foreground">Tipo</label>
                        <select aria-label="Tipo" name="type" defaultValue={fType || ''} className="h-9 text-xs border rounded-lg px-3 bg-background min-w-28">
                          <option value="">Todos</option>
                          <option value="income">Receitas</option>
                          <option value="expense">Despesas</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label htmlFor="q" className="text-[10px] uppercase tracking-wide text-muted-foreground">Busca</label>
                        <Input id="q" name="q" defaultValue={qf || ''} placeholder="Descrição ou categoria" className="h-9 text-xs w-40" />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label htmlFor="category" className="text-[10px] uppercase tracking-wide text-muted-foreground">Categoria</label>
                        <Input id="category" name="category" defaultValue={cat || ''} placeholder="Ex: Marketing" className="h-9 text-xs w-36" />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label htmlFor="client" className="text-[10px] uppercase tracking-wide text-muted-foreground">Cliente</label>
                        <Input id="client" name="client" defaultValue={clientQ || ''} placeholder="Nome do cliente" className="h-9 text-xs w-40" />
                      </div>

                      <div className="flex items-end gap-2">
                        <div className="flex flex-col gap-1">
                          <label htmlFor="from" className="text-[10px] uppercase tracking-wide text-muted-foreground">De</label>
                          <Input id="from" name="from" type="date" defaultValue={fromStr || ''} className="h-9 text-xs" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label htmlFor="to" className="text-[10px] uppercase tracking-wide text-muted-foreground">Até</label>
                          <Input id="to" name="to" type="date" defaultValue={toStr || ''} className="h-9 text-xs" />
                        </div>
                      </div>

                      <div className="flex items-end gap-2">
                        <div className="flex flex-col gap-1">
                          <label htmlFor="min" className="text-[10px] uppercase tracking-wide text-muted-foreground">Valor mín.</label>
                          <Input id="min" name="min" type="number" step="0.01" defaultValue={minStr || ''} placeholder="0,00" className="h-9 text-xs w-28" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label htmlFor="max" className="text-[10px] uppercase tracking-wide text-muted-foreground">Valor máx.</label>
                          <Input id="max" name="max" type="number" step="0.01" defaultValue={maxStr || ''} placeholder="0,00" className="h-9 text-xs w-28" />
                        </div>
                      </div>

                      <div className="flex items-end gap-2 ml-auto">
                        <Button type="submit" size="sm">Filtrar</Button>
                        {(fType || qf || cat || fromStr || toStr || minStr || maxStr || clientQ) && (
                          <Button type="button" size="sm" variant="outline" asChild>
                            <Link href={`/billing?${new URLSearchParams({ tab: 'lancamentos' }).toString()}`}>Limpar</Link>
                          </Button>
                        )}
                      </div>
                    </form>

                    <FinanceTable rows={rows} />

                    {totalF > pageSizeF && (
                      <Pagination
                        page={pageF}
                        total={totalF}
                        pageSize={pageSizeF}
                        baseHref={`/billing?${new URLSearchParams({
                          tab: 'lancamentos',
                          ...(fType ? { type: fType } : {}),
                          ...(qf ? { q: qf } : {}),
                          ...(cat ? { category: cat } : {}),
                          ...(fromStr ? { from: fromStr } : {}),
                          ...(toStr ? { to: toStr } : {}),
                          ...(minStr ? { min: minStr } : {}),
                          ...(maxStr ? { max: maxStr } : {}),
                          ...(clientQ ? { client: clientQ } : {}),
                        }).toString()}&financePage=`}
                        className="pt-3 flex items-center justify-between text-xs"
                      />
                    )}
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}