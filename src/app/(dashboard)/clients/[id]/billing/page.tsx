import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import ContractManager from "@/features/clients/components/ContractManager";
import { InstallmentManager } from "@/features/clients/components/InstallmentManager";
import { PaymentStatusCard } from "@/features/payments/components/PaymentStatusCard";
import { can } from "@/lib/permissions";
import { getSessionProfile } from "@/services/auth/session";
import { BillingService, type InvoiceStatusFilter } from "@/services/billing/BillingService";
import { getClientById } from "@/services/repositories/clients";
import Link from "next/link";

interface BillingPageProps { params: Promise<{ id: string }>; searchParams?: Promise<{ status?: InvoiceStatusFilter | string; page?: string; q?: string }> }

export default async function BillingPage({ params, searchParams }: BillingPageProps) {
  const { id } = await params
  const { orgId, role } = await getSessionProfile()
  if (!orgId || !role) return null
  if (!can(role, "read", "finance")) return null

  const client = await getClientById(id)
  if (!client || client.orgId !== orgId) return null
  const sp = (await searchParams) || {}
  const status = (sp.status?.toString().toUpperCase() as InvoiceStatusFilter) || undefined
  const page = Number(sp.page || '1') || 1
  const q = sp.q?.toString() || undefined
  const pageSize = 20
  const { items: invoices, total } = await BillingService.listClientInvoicesPaged(id, orgId, { status, q, page, pageSize })

  return (
    <ProtectedRoute>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-xl font-semibold">Cobrança — {client.name}</h1>
          <p className="text-sm text-muted-foreground">Gerencie contrato, parcelas e faturas.</p>
        </div>

        {/* Status mensal / Parcelas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status do mês</CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentStatusCard clientId={client.id} clientName={client.name} canEdit={can(role, "create", "finance")} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Parcelas</CardTitle>
            </CardHeader>
            <CardContent>
              <InstallmentManager clientId={client.id} canEdit={can(role, "create", "finance")} />
            </CardContent>
          </Card>
        </div>

        {/* Contrato */}
        <ContractManager
          clientId={client.id}
          clientName={client.name}
          contractStart={client.contract_start}
          contractEnd={client.contract_end}
          paymentDay={client.payment_day}
          contractValue={client.contract_value}
        />

        {/* Faturas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-base">Faturas</CardTitle>
              <form className="flex items-center gap-2" method="get">
                <select aria-label="Status da fatura" name="status" defaultValue={status || ''} className="h-8 text-xs border rounded-md px-2 bg-background">
                  <option value="">Todas</option>
                  <option value="OPEN">Em aberto</option>
                  <option value="OVERDUE">Vencidas</option>
                  <option value="PAID">Pagas</option>
                  <option value="DRAFT">Rascunho</option>
                </select>
                <Input name="q" defaultValue={q || ''} placeholder="Buscar" className="h-8 text-xs w-40" />
                <Button type="submit" size="sm">Filtrar</Button>
              </form>
              {can(role, "create", "finance") && (
                <form method="post" action={`/api/clients/${client.id}/invoices`}>
                  <Button type="submit" size="sm">Gerar fatura do mês</Button>
                </form>
              )}
            </div>
          </CardHeader>
          <CardContent className="divide-y">
            {invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma fatura encontrada.</p>
            ) : (
              invoices.map((inv) => (
                <div key={inv.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{inv.number} — {new Date(inv.issueDate).toLocaleDateString("pt-BR")} • vence {new Date(inv.dueDate).toLocaleDateString("pt-BR")}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${inv.status === "PAID" ? "bg-emerald-100 text-emerald-700" : inv.status === "OVERDUE" ? "bg-red-100 text-red-700" : inv.status === "OPEN" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700"}`}>{inv.status}</span>
                      <span>total {new Intl.NumberFormat("pt-BR", { style: "currency", currency: inv.currency || "BRL" }).format(inv.total)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/clients/${client.id}/billing/invoices/${inv.id}`} className="text-xs text-blue-600 hover:text-blue-700">Detalhes</Link>
                    {can(role, "create", "finance") && inv.status !== "PAID" && (
                      <form method="post" action={`/api/billing/invoices/${inv.id}/pay`}>
                        <input type="hidden" name="method" value="manual" />
                        <Button type="submit" size="sm" variant="default">Marcar pago</Button>
                      </form>
                    )}
                  </div>
                </div>
              ))
            )}
            {total > pageSize && (
              <div className="pt-3 flex items-center justify-between text-xs">
                <div>
                  Página {page} de {Math.ceil(total / pageSize)}
                </div>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/clients/${client.id}/billing?${new URLSearchParams({ ...(status ? { status } : {}), ...(q ? { q } : {}), page: String(page - 1) }).toString()}`}>Anterior</Link>
                    </Button>
                  )}
                  {page < Math.ceil(total / pageSize) && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/clients/${client.id}/billing?${new URLSearchParams({ ...(status ? { status } : {}), ...(q ? { q } : {}), page: String(page + 1) }).toString()}`}>Próxima</Link>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
