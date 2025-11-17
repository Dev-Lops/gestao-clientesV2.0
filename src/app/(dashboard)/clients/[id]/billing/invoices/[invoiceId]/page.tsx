import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getSessionProfile } from "@/services/auth/session";

interface InvoiceDetailPageProps { params: Promise<{ id: string; invoiceId: string }> }

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { id, invoiceId } = await params
  const { orgId, role } = await getSessionProfile()
  if (!orgId || !role) return null
  if (!can(role, "read", "finance")) return null

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId }, include: { items: true, payments: true, client: true } })
  if (!invoice || invoice.orgId !== orgId || invoice.clientId !== id) return null

  return (
    <ProtectedRoute>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fatura {invoice.number}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>Cliente: <strong>{invoice.client.name}</strong></div>
            <div>Emissão: {new Date(invoice.issueDate).toLocaleDateString("pt-BR")}</div>
            <div>Vencimento: {new Date(invoice.dueDate).toLocaleDateString("pt-BR")}</div>
            <div>Status: <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${invoice.status === "PAID" ? "bg-emerald-100 text-emerald-700" : invoice.status === "OVERDUE" ? "bg-red-100 text-red-700" : invoice.status === 'VOID' ? 'bg-slate-200 text-slate-600' : "bg-slate-100 text-slate-700"}`}>{invoice.status}</span></div>
            <div>Total: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: invoice.currency || "BRL" }).format(invoice.total)}</div>
            {invoice.status !== 'PAID' && invoice.status !== 'VOID' && invoice.payments.length === 0 && can(role, 'create', 'finance') && (
              <form method="post" action={`/api/billing/invoices/${invoice.id}/cancel`} className="mt-3">
                <button className="px-3 py-2 rounded-md text-sm bg-red-600 hover:bg-red-700 text-white">Cancelar fatura</button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Itens</CardTitle>
          </CardHeader>
          <CardContent>
            {invoice.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem itens.</p>
            ) : (
              <div className="divide-y">
                {invoice.items.map((it) => (
                  <div key={it.id} className="py-2 flex items-center justify-between text-sm">
                    <div>{it.description} × {it.quantity}</div>
                    <div>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: invoice.currency || "BRL" }).format(it.total)}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pagamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {invoice.payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem pagamentos.</p>
            ) : (
              <div className="divide-y">
                {invoice.payments.map((p) => (
                  <div key={p.id} className="py-2 flex items-center justify-between text-sm">
                    <div>{p.method} — {p.status}</div>
                    <div>
                      {p.paidAt ? new Date(p.paidAt).toLocaleDateString("pt-BR") : ""}
                      {" • "}
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: invoice.currency || "BRL" }).format(p.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {invoice.status !== "PAID" && can(role, "create", "finance") && (
              <form method="post" action={`/api/billing/invoices/${invoice.id}/pay`} className="mt-3">
                <button className="px-3 py-2 rounded-md text-sm bg-emerald-600 hover:bg-emerald-700 text-white">Marcar pago</button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
