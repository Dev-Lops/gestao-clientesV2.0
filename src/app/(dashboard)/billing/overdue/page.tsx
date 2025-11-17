import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getSessionProfile } from "@/services/auth/session";
import { AlertCircle, BadgeDollarSign, Clock, Timer } from "lucide-react";
import Link from "next/link";

export default async function OverdueBillingPage() {
  const { orgId, role } = await getSessionProfile()
  if (!orgId || !role) return null
  if (!can(role, "read", "finance")) return null

  const now = new Date()
  const overdue = await prisma.invoice.findMany({
    where: { orgId, OR: [{ status: "OVERDUE" }, { AND: [{ status: "OPEN" }, { dueDate: { lt: now } }] }] },
    include: { client: true },
    orderBy: [{ dueDate: "asc" }],
  })

  const total = overdue.reduce((a, i) => a + i.total, 0)
  const dayMs = 86_400_000
  const daysMetrics = overdue.map(inv => Math.max(0, Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / dayMs)))
  const avgDays = daysMetrics.length ? (daysMetrics.reduce((a, b) => a + b, 0) / daysMetrics.length) : 0
  const maxDays = daysMetrics.length ? Math.max(...daysMetrics) : 0
  const currency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 overflow-x-hidden max-w-7xl mx-auto">
      {/* HEADER GRADIENTE */}
      <header className="relative overflow-hidden rounded-2xl bg-linear-to-br from-red-600 via-rose-600 to-orange-500 p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-white/25 backdrop-blur-sm flex items-center justify-center">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold">Inadimplência</h1>
              <p className="text-sm sm:text-base text-rose-100 mt-1">Faturas vencidas que requerem ação imediata</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" asChild className="bg-white/20 hover:bg-white/30 text-white border-white/30">
              <Link href="/billing">Voltar à cobrança</Link>
            </Button>
            <Button size="sm" variant="secondary" asChild className="bg-white/20 hover:bg-white/30 text-white border-white/30">
              <Link href="/billing?status=OVERDUE">Ver lista geral</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* KPIs */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-br from-red-500/10 to-pink-500/10 rounded-full blur-2xl" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vencidas</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-linear-to-br from-red-500 to-pink-500 flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdue.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Quantidade total</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-br from-amber-500/10 to-orange-500/10 rounded-full blur-2xl" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Valor total</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-linear-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <BadgeDollarSign className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{currency(total)}</div>
            <p className="text-xs text-muted-foreground mt-1">Somatório bruto</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-br from-purple-500/10 to-fuchsia-500/10 rounded-full blur-2xl" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Média dias atraso</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-linear-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center">
              <Clock className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{avgDays.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">Dias corridos médios</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-br from-slate-500/10 to-slate-700/10 rounded-full blur-2xl" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Máx dias atraso</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-linear-to-br from-slate-600 to-slate-800 flex items-center justify-center">
              <Timer className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-600">{maxDays}</div>
            <p className="text-xs text-muted-foreground mt-1">Pior caso</p>
          </CardContent>
        </Card>
      </div>

      {/* LISTA DE FATURAS VENCIDAS */}
      <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader className="bg-linear-to-r from-red-50 to-pink-50 dark:from-red-950 dark:to-pink-950">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-linear-to-br from-red-500 to-pink-500 flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-white" />
              </div>
              Faturas vencidas
            </CardTitle>
            <div className="text-xs text-muted-foreground">Atualizado em {now.toLocaleDateString("pt-BR")}</div>
          </div>
        </CardHeader>
        <CardContent className="divide-y">
          {overdue.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma fatura vencida.</p>
          ) : (
            overdue.map((inv, idx) => {
              const daysLate = daysMetrics[idx]
              return (
                <div key={inv.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{inv.number} — {inv.client.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
                      <span>Venceu {new Date(inv.dueDate).toLocaleDateString("pt-BR")}</span>
                      <span>•</span>
                      <StatusBadge status={inv.status} />
                      <span>• {daysLate}d atraso</span>
                      {inv.notes && (
                        <span className="truncate max-w-[220px]" title={inv.notes}>• {inv.notes}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="link" size="sm" asChild className="h-auto p-0">
                      <Link href={`/clients/${inv.clientId}/billing/invoices/${inv.id}`}>Detalhes</Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild className="h-auto p-0">
                      <Link href={`/clients/${inv.clientId}/billing`}>Cobrança</Link>
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
