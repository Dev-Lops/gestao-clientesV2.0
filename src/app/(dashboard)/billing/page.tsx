import Pagination from "@/components/common/Pagination";
import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FinanceCreateModal } from "@/features/finance/components/FinanceCreateModal";
import { FinanceEditModal } from "@/features/finance/components/FinanceEditModal";
import { formatBRL, formatDateBR } from "@/lib/format";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getSessionProfile } from "@/services/auth/session";
import { BillingService, type InvoiceListFilters, type InvoiceStatusFilter } from "@/services/billing/BillingService";
import { Prisma } from "@prisma/client";
import { AlertCircle, ArrowUpRight, BadgeDollarSign, CheckCircle2, Clock, TrendingUp, Wallet } from "lucide-react";
import Link from "next/link";

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
  const status = (sp.status?.toString().toUpperCase() as InvoiceStatusFilter) || undefined
  const q = sp.q?.toString() || undefined
  const startDate = sp.startDate?.toString() || undefined
  const endDate = sp.endDate?.toString() || undefined
  const page = Number(sp.page || '1') || 1
  const pageSize = 20

  // Build filter options with date range
  const filterOptions: InvoiceListFilters = { status, q, page, pageSize }
  if (startDate || endDate) {
    // Note: dateRange não está na interface InvoiceListFilters original, 
    // então vamos apenas passar os valores sem dateRange por enquanto
  } const { items: invoices, total } = await BillingService.listOrgInvoices(orgId, filterOptions)

  // Clients list no longer needed here (typeahead will fetch)

  // Finance monthly summary - USA PAYMENT.PAIDAT para receitas (mais confiável)
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  // Receitas: Usa Payment.paidAt (fonte da verdade para "quando foi pago")
  const paymentsMonth = await prisma.payment.findMany({
    where: { orgId, paidAt: { gte: startMonth, lte: endMonth } }
  })
  const incomeMonth = paymentsMonth.reduce((s, p) => s + p.amount, 0)

  // Despesas: Usa Finance.date (lançamentos manuais)
  const expensesMonth = await prisma.finance.findMany({
    where: { orgId, type: 'expense', date: { gte: startMonth, lte: endMonth } }
  })
  const expenseMonth = expensesMonth.reduce((s, r) => s + r.amount, 0)
  const netMonth = incomeMonth - expenseMonth

  // Saldo total histórico
  // Receitas: Usa Payment (evita duplicação com lançamentos manuais)
  const allPayments = await prisma.payment.findMany({
    where: { orgId },
    select: { amount: true }
  })
  const totalIncome = allPayments.reduce((s, p) => s + p.amount, 0)

  // Despesas: Usa Finance (lançamentos manuais de despesas)
  const allExpenses = await prisma.finance.findMany({
    where: { orgId, type: 'expense' },
    select: { amount: true }
  })
  const totalExpense = allExpenses.reduce((s, r) => s + r.amount, 0)
  const totalNet = totalIncome - totalExpense

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
      {/* HEADER COM GRADIENTE */}
      <header className="relative overflow-hidden rounded-2xl bg-linear-to-br from-emerald-600 via-teal-600 to-cyan-600 p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <BadgeDollarSign className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold">Cobrança</h1>
              <p className="text-sm sm:text-base text-emerald-100 mt-1">
                Gestão financeira completa e controle de recebimentos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <form method="post" action="/api/notifications/finance/mark-read">
              <Button type="submit" variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                Limpar alertas
              </Button>
            </form>
            <Button size="sm" asChild className="bg-white/20 hover:bg-white/30 text-white border-white/30">
              <Link href="/billing/overdue">Ver inadimplência</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* KPIs FINANCEIROS */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-6">
        <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-br from-red-500/10 to-pink-500/10 rounded-full blur-2xl" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vencidas</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-linear-to-br from-red-500 to-pink-500 flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdue}</div>
            <p className="text-xs text-muted-foreground mt-1">Requerem atenção</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-2xl" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Em aberto</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-linear-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Clock className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{open}</div>
            <p className="text-xs text-muted-foreground mt-1">Aguardando pagamento</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-br from-emerald-500/10 to-green-500/10 rounded-full blur-2xl" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pagamentos do mês</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-linear-to-br from-emerald-500 to-green-500 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{paidRecent}</div>
            <p className="text-xs text-muted-foreground mt-1">Recebimentos confirmados</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-all">
          <div className={`absolute top-0 right-0 w-24 h-24 bg-linear-to-br ${netMonth >= 0 ? 'from-emerald-500/10 to-teal-500/10' : 'from-red-500/10 to-orange-500/10'} rounded-full blur-2xl`} />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo do mês</CardTitle>
            <div className={`h-8 w-8 rounded-lg bg-linear-to-br ${netMonth >= 0 ? 'from-emerald-500 to-teal-500' : 'from-red-500 to-orange-500'} flex items-center justify-center`}>
              <Wallet className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netMonth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatBRL(netMonth)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              {netMonth >= 0 ? (
                <><TrendingUp className="h-3 w-3" /> Resultado positivo</>
              ) : (
                <><ArrowUpRight className="h-3 w-3 rotate-90" /> Resultado negativo</>
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-all lg:col-span-2">
          <div className={`absolute top-0 right-0 w-32 h-32 bg-linear-to-br ${totalNet >= 0 ? 'from-violet-500/10 to-purple-500/10' : 'from-orange-500/10 to-red-500/10'} rounded-full blur-3xl`} />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Total Histórico</CardTitle>
            <div className={`h-8 w-8 rounded-lg bg-linear-to-br ${totalNet >= 0 ? 'from-violet-500 to-purple-500' : 'from-orange-500 to-red-500'} flex items-center justify-center`}>
              <BadgeDollarSign className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className={`text-3xl font-bold ${totalNet >= 0 ? 'text-violet-600' : 'text-orange-600'}`}>
              {formatBRL(totalNet)}
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <p className="text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-emerald-600" /> Total Recebido
                </p>
                <p className="font-semibold text-emerald-600">{formatBRL(totalIncome)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3 rotate-90 text-red-600" /> Total Despesas
                </p>
                <p className="font-semibold text-red-600">{formatBRL(totalExpense)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DETALHAMENTO FINANCEIRO DO MÊS */}
      <Card className="border-2 shadow-lg">
        <CardHeader className="bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-linear-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            Resumo Financeiro do Mês
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-6 sm:grid-cols-3">
            {/* Receitas */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Receitas do Mês</p>
                  <p className="text-xl font-bold text-emerald-600">{formatBRL(incomeMonth)}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Total recebido em {new Date().toLocaleDateString('pt-BR', { month: 'long' })}</p>
            </div>

            {/* Despesas */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <ArrowUpRight className="h-5 w-5 rotate-90 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Despesas do Mês</p>
                  <p className="text-xl font-bold text-red-600">{formatBRL(expenseMonth)}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Total gasto em {new Date().toLocaleDateString('pt-BR', { month: 'long' })}</p>
            </div>

            {/* Saldo Líquido */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className={`h-10 w-10 rounded-lg ${netMonth >= 0 ? 'bg-violet-100 dark:bg-violet-900/20' : 'bg-orange-100 dark:bg-orange-900/20'} flex items-center justify-center`}>
                  <Wallet className={`h-5 w-5 ${netMonth >= 0 ? 'text-violet-600' : 'text-orange-600'}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Resultado Líquido</p>
                  <p className={`text-xl font-bold ${netMonth >= 0 ? 'text-violet-600' : 'text-orange-600'}`}>{formatBRL(netMonth)}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {netMonth >= 0 ? (
                  <><CheckCircle2 className="h-3 w-3 text-emerald-600" /> Mês lucrativo</>
                ) : (
                  <><AlertCircle className="h-3 w-3 text-orange-600" /> Mês no prejuízo</>
                )}
              </p>
            </div>
          </div>

          {/* Barra de progresso visual */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Margem de lucro</span>
              <span className="font-semibold">{incomeMonth > 0 ? ((netMonth / incomeMonth) * 100).toFixed(1) : '0'}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all ${netMonth >= 0 ? 'bg-linear-to-r from-emerald-500 to-teal-500' : 'bg-linear-to-r from-red-500 to-orange-500'}`}
                style={{ width: incomeMonth > 0 ? `${Math.min(Math.max((netMonth / incomeMonth) * 100, 0), 100)}%` : '0%' }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader className="bg-linear-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <BadgeDollarSign className="h-4 w-4 text-white" />
              </div>
              Faturas
            </CardTitle>
            {/* Filters */}
            <form className="flex flex-col gap-3 w-full sm:w-auto" method="get">
              <div className="flex flex-wrap items-center gap-2">
                <select aria-label="Status da fatura" name="status" defaultValue={status || ''} className="h-9 text-xs border rounded-md px-2 bg-background">
                  <option value="">Todas</option>
                  <option value="OPEN">Em aberto</option>
                  <option value="OVERDUE">Vencidas</option>
                  <option value="PAID">Pagas</option>
                  <option value="VOID">Canceladas</option>
                  <option value="DRAFT">Rascunho</option>
                </select>
                <Input name="q" defaultValue={q || ''} placeholder="Buscar" className="h-9 text-xs w-full sm:w-40" aria-label="Buscar faturas" />
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    name="startDate"
                    defaultValue={startDate || ''}
                    placeholder="Data inicial"
                    className="h-9 text-xs w-36"
                    aria-label="Data inicial"
                  />
                  <span className="text-xs text-muted-foreground">até</span>
                  <Input
                    type="date"
                    name="endDate"
                    defaultValue={endDate || ''}
                    placeholder="Data final"
                    className="h-9 text-xs w-36"
                    aria-label="Data final"
                  />
                </div>
                <Button type="submit" size="sm" variant="default">Filtrar</Button>
                {(status || q || startDate || endDate) && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      window.location.href = '/billing';
                    }}
                  >
                    Limpar
                  </Button>
                )}
              </div>
            </form>
            <Button size="sm" variant="secondary" asChild className="w-full sm:w-auto">
              <a href={`/api/billing/invoices/export?${new URLSearchParams((await searchParams) || {}).toString()}`}>
                Exportar CSV
              </a>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground p-8 text-center">Sem faturas.</p>
          ) : (
            <>
              {/* Desktop table view */}
              <div className="hidden md:block divide-y">
                {invoices.map((inv) => (
                  <div key={inv.id} className="py-3 px-6 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors">
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{inv.number} — {inv.client.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDateBR(inv.issueDate)} • vence {formatDateBR(inv.dueDate)} •
                        <StatusBadge status={inv.status} className="ml-1" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="link" size="sm" asChild className="h-auto p-0">
                        <Link href={`/clients/${inv.clientId}/billing/invoices/${inv.id}`}>Abrir</Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild className="h-auto p-0">
                        <Link href={`/clients/${inv.clientId}/billing`}>Cliente</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile card view */}
              <div className="md:hidden divide-y">
                {invoices.map((inv) => (
                  <div key={inv.id} className="p-4 space-y-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium text-sm">{inv.number}</div>
                        <div className="text-xs text-muted-foreground">{inv.client.name}</div>
                      </div>
                      <StatusBadge status={inv.status} />
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Emissão: {formatDateBR(inv.issueDate)}</div>
                      <div>Vencimento: {formatDateBR(inv.dueDate)}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <Link href={`/clients/${inv.clientId}/billing/invoices/${inv.id}`}>Abrir</Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild className="flex-1">
                        <Link href={`/clients/${inv.clientId}/billing`}>Cliente</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {/* Pagination */}
          {total > pageSize && (
            <div className="p-4 border-t">
              <Pagination
                page={page}
                total={total}
                pageSize={pageSize}
                buildHref={(p) =>
                  `/billing?${new URLSearchParams({
                    ...(status ? { status } : {}),
                    ...(q ? { q } : {}),
                    page: String(p),
                  }).toString()}`
                }
                className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Finance entries (income/expense) */}
      <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader className="bg-linear-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-linear-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              Lançamentos financeiros
            </CardTitle>
            <form className="flex items-center gap-2 flex-wrap" method="get">
              <select aria-label="Tipo de lançamento" name="type" defaultValue={(await searchParams)?.['type'] || ''} className="h-8 text-xs border rounded-md px-2 bg-background">
                <option value="">Todos</option>
                <option value="income">Receitas</option>
                <option value="expense">Despesas</option>
              </select>
              <Input name="category" defaultValue={(await searchParams)?.['category'] || ''} placeholder="Categoria" className="h-8 text-xs w-32" />
              <Input name="q" defaultValue={(await searchParams)?.['q'] || ''} placeholder="Buscar" className="h-8 text-xs w-32" />
              <Input type="date" name="from" defaultValue={(await searchParams)?.['from'] || ''} className="h-8 text-xs w-32" />
              <Input type="date" name="to" defaultValue={(await searchParams)?.['to'] || ''} className="h-8 text-xs w-32" />
              <Button type="submit" size="sm" variant="default">Filtrar</Button>
            </form>
            <FinanceCreateModal />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {null}

          {await (async () => {
            const sp = (searchParams ? (await searchParams) : {}) as Record<string, string>
            const fType = sp['type'] || undefined
            const qf = sp['q'] || undefined
            const cat = sp['category'] || undefined
            const fromStr = sp['from']
            const toStr = sp['to']
            const pageF = Number(sp['page'] || '1') || 1
            const pageSizeF = 20
            const where: Prisma.FinanceWhereInput = { orgId }
            if (fType) where.type = fType
            if (qf) where.OR = [{ description: { contains: qf, mode: 'insensitive' } }, { category: { contains: qf, mode: 'insensitive' } }]
            if (cat) where.category = { contains: cat, mode: 'insensitive' }
            if (fromStr || toStr) where.date = { gte: fromStr ? new Date(fromStr) : undefined, lte: toStr ? new Date(toStr) : undefined }
            const skip = (pageF - 1) * pageSizeF
            const [rows, totalF] = await Promise.all([
              prisma.finance.findMany({ where, skip, take: pageSizeF, orderBy: { date: 'desc' }, include: { client: true } }),
              prisma.finance.count({ where }),
            ])
            // const totalPages = Math.ceil(totalF / pageSizeF)
            return (
              <div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="text-left text-slate-500">
                        <th className="py-2 pr-3">Data</th>
                        <th className="py-2 pr-3">Tipo</th>
                        <th className="py-2 pr-3">Valor</th>
                        <th className="py-2 pr-3">Categoria</th>
                        <th className="py-2 pr-3">Descrição</th>
                        <th className="py-2 pr-3">Cliente</th>
                        <th className="py-2 pr-3">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.id} className="border-t">
                          <td className="py-2 pr-3 whitespace-nowrap">{formatDateBR(r.date)}</td>
                          <td className="py-2 pr-3">{r.type === 'income' ? 'Receita' : 'Despesa'}</td>
                          <td className={`py-2 pr-3 ${r.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>{formatBRL(r.amount)}</td>
                          <td className="py-2 pr-3">{r.category || '-'}</td>
                          <td className="py-2 pr-3 max-w-[320px] truncate" title={r.description || ''}>{r.description || '-'}</td>
                          <td className="py-2 pr-3">{r.client ? r.client.name : '-'}</td>
                          <td className="py-2 pr-3 flex items-center gap-2">
                            <FinanceEditModal row={{ id: r.id, amount: r.amount, description: r.description, category: r.category, date: r.date.toISOString(), type: r.type as 'income' | 'expense', clientId: r.clientId || null, clientName: r.client?.name }} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalF > pageSizeF && (
                  <Pagination
                    page={pageF}
                    total={totalF}
                    pageSize={pageSizeF}
                    buildHref={(p) =>
                      `/billing?${new URLSearchParams({
                        ...(status ? { status } : {}),
                        ...(q ? { q } : {}),
                        page: String(p),
                      }).toString()}`
                    }
                    className="pt-3 flex items-center justify-between text-xs"
                  />
                )}
              </div>
            )
          })()}
        </CardContent>
      </Card>
    </div>
  );
}
