import { can, type AppRole } from "@/lib/permissions";
import { ConfirmFormButton } from "./ConfirmFormButton";
import { DeleteInvoiceButton } from "./DeleteInvoiceButton";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface InvoiceData {
  id: string;
  number?: string;
  total: number;
  dueDate: string | Date;
  status: string;
  clientId?: string;
  issueDate?: string | Date;
  client?: { name: string };
  items?: Array<{ id: string; description: string; quantity: number; total: number }>;
  payments?: Array<{
    id: string;
    status: string;
    method: string;
    paidAt?: string | Date | null;
    amount?: number;
    provider?: string | null;
    providerPaymentId?: string | null;
  }>;
  currency?: string;
}interface ClientInvoiceDetailProps {
  invoice: InvoiceData;
  role: AppRole;
}

const statusMap: Record<string, { label: string; class: string }> = {
  PAID: { label: "Pago", class: "bg-emerald-100 text-emerald-700" },
  OVERDUE: { label: "Vencida", class: "bg-red-100 text-red-700" },
  VOID: { label: "Cancelada", class: "bg-slate-200 text-slate-600" },
  CANCELED: { label: "Cancelada", class: "bg-slate-200 text-slate-600" },
  PENDING: { label: "Pendente", class: "bg-slate-100 text-slate-700" },
  DRAFT: { label: "Rascunho", class: "bg-slate-100 text-slate-500" },
};

export default function ClientInvoiceDetail({ invoice, role }: ClientInvoiceDetailProps) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fatura #{invoice.number}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>Cliente: <a href={`/dashboard/clients/${invoice.clientId}`} className="font-semibold text-blue-700 hover:underline">{invoice.client?.name || 'N/A'}</a></div>
          <div>Emissão: <span className="font-mono text-xs">{invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) : 'N/A'}</span></div>
          <div>Vencimento: <span className="font-mono text-xs">{new Date(invoice.dueDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}</span></div>
          {can(role, 'delete', 'finance') && (
            <DeleteInvoiceButton invoiceId={invoice.id} />
          )}
          <div>Status: <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${statusMap[invoice.status]?.class}`}>{statusMap[invoice.status]?.label || invoice.status}</span></div>
          <div>Total: <span className="font-bold text-lg">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: invoice.currency || "BRL" }).format(invoice.total)}</span></div>
          {invoice.status !== 'PAID' && invoice.status !== 'VOID' && invoice.status !== 'CANCELED' && invoice.payments && invoice.payments.length === 0 && can(role, 'create', 'finance') && (
            <ConfirmFormButton
              method="post"
              action={`/api/billing/invoices/${invoice.id}/cancel`}
              className="mt-3"
              confirmMessage="Tem certeza que deseja cancelar esta fatura?"
            >
              <span className="px-3 py-2 rounded-md text-sm bg-red-600 hover:bg-red-700 text-white transition-all">Cancelar fatura</span>
            </ConfirmFormButton>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Itens</CardTitle>
        </CardHeader>
        <CardContent>
          {!invoice.items || invoice.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem itens.</p>
          ) : (
            <div className="divide-y">
              {invoice.items.map((it: { id: string; description: string; quantity: number; total: number }) => (
                <div key={it.id} className="py-2 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-white">{it.description}</span> × <span className="font-mono">{it.quantity}</span>
                  </div>
                  <div className="font-bold text-blue-700">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: invoice.currency || "BRL" }).format(it.total)}</div>
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
          {!invoice.payments || invoice.payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem pagamentos.</p>
          ) : (
            <div className="divide-y">
              {invoice.payments.map((p: {
                id: string;
                status: string;
                method: string;
                paidAt?: string | Date | null;
                amount?: number;
              }) => (
                <div key={p.id} className="py-2 flex items-center justify-between text-sm">
                  <div>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${p.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : p.status === 'PENDING' ? 'bg-slate-100 text-slate-700' : 'bg-red-100 text-red-700'}`}>{p.status}</span>
                    <span className="ml-2 font-mono text-xs text-slate-600">{p.method}</span>
                  </div>
                  <div>
                    {p.paidAt ? <span className="font-mono text-xs">{new Date(p.paidAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}</span> : <span className="text-slate-400">—</span>}
                    <span className="mx-2">•</span>
                    <span className="font-bold text-emerald-700">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: invoice.currency || "BRL" }).format(p.amount || 0)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
