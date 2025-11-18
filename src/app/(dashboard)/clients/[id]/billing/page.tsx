import { ConfirmInvoiceModalWrapper } from "@/components/ConfirmInvoiceModalWrapper";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import ContractManager from "@/features/clients/components/ContractManager";
import { InstallmentManager } from "@/features/clients/components/InstallmentManager";
import { PaymentStatusCard } from "@/features/payments/components/PaymentStatusCard";
import { can } from "@/lib/permissions";
import { getSessionProfile } from "@/services/auth/session";
import { BillingService, type InvoiceStatusFilter } from "@/services/billing/BillingService";
import { getClientById } from "@/services/repositories/clients";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  DollarSign,
  FileText,
  Filter,
  Receipt,
  Search,
  TrendingUp
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

interface BillingPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    status?: InvoiceStatusFilter | string;
    page?: string;
    q?: string
  }>
}

// Helper function to get status badge styles
function getInvoiceStatusBadge(status: string) {
  const styles = {
    PAID: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    OVERDUE: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
    OPEN: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    DRAFT: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    VOID: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
  };
  return styles[status as keyof typeof styles] || styles.DRAFT;
}

// Helper function to get status label
function getInvoiceStatusLabel(status: string) {
  const labels = {
    PAID: "Paga",
    OVERDUE: "Vencida",
    OPEN: "Em Aberto",
    DRAFT: "Rascunho",
    VOID: "Cancelada"
  };
  return labels[status as keyof typeof labels] || status;
}

// Skeleton loader component
function InvoicesSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="py-4 flex items-center justify-between animate-pulse">
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
          </div>
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-20" />
        </div>
      ))}
    </div>
  );
}

export default async function BillingPage({ params, searchParams }: BillingPageProps) {
  const { id } = await params;
  const { orgId, role } = await getSessionProfile();

  // Early returns for unauthorized access
  if (!orgId || !role) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <FileText className="h-12 w-12 text-slate-400 mx-auto" />
          <p className="text-slate-600 dark:text-slate-400">Sessão expirada. Faça login novamente.</p>
        </div>
      </div>
    );
  }

  if (!can(role, "read", "finance")) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <FileText className="h-12 w-12 text-slate-400 mx-auto" />
          <p className="text-slate-600 dark:text-slate-400">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  const client = await getClientById(id);

  if (!client || client.orgId !== orgId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <FileText className="h-12 w-12 text-slate-400 mx-auto" />
          <p className="text-slate-600 dark:text-slate-400">Cliente não encontrado.</p>
        </div>
      </div>
    );
  }

  const sp = (await searchParams) || {};
  const status = (sp.status?.toString().toUpperCase() as InvoiceStatusFilter) || undefined;
  const page = Math.max(1, Number(sp.page || '1') || 1);
  const q = sp.q?.toString()?.trim() || undefined;
  const pageSize = 20;

  const { items: invoices, total } = await BillingService.listClientInvoicesPaged(
    id,
    orgId,
    { status, q, page, pageSize }
  );

  const totalPages = Math.ceil(total / pageSize);
  const canCreateFinance = can(role, "create", "finance");

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header com navegação */}
        <header className="space-y-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-9 w-9 p-0"
            >
              <Link href={`/clients/${client.id}`}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Voltar</span>
              </Link>
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <Receipt className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Faturamento
                </h1>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Gestão financeira de <span className="font-semibold text-slate-900 dark:text-white">{client.name}</span>
              </p>
            </div>
          </div>
        </header>

        {/* Resumo do Cliente - Cards em Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Status do Mês */}
          <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base truncate">Status do Mês</CardTitle>
                  <CardDescription className="text-xs">Situação de pagamento atual</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <Suspense fallback={<div className="animate-pulse h-32 bg-slate-100 dark:bg-slate-800 rounded" />}>
                <PaymentStatusCard
                  clientId={client.id}
                  clientName={client.name}
                  canEdit={canCreateFinance}
                />
              </Suspense>
            </CardContent>
          </Card>

          {/* Parcelas - só mostrar se cliente for parcelado */}
          {client.is_installment && (
            <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base truncate">Parcelas</CardTitle>
                    <CardDescription className="text-xs">Controle de pagamentos parcelados</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <Suspense fallback={<div className="animate-pulse h-32 bg-slate-100 dark:bg-slate-800 rounded" />}>
                  <InstallmentManager
                    clientId={client.id}
                    canEdit={canCreateFinance}
                  />
                </Suspense>
              </CardContent>
            </Card>
          )}

          {/* Contrato */}
          <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base truncate">Contrato</CardTitle>
                  <CardDescription className="text-xs">Informações contratuais</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <Suspense fallback={<div className="animate-pulse h-32 bg-slate-100 dark:bg-slate-800 rounded" />}>
                <ContractManager
                  clientId={client.id}
                  clientName={client.name}
                  contractStart={client.contract_start}
                  contractEnd={client.contract_end}
                  paymentDay={client.payment_day}
                  paymentDays={client.installment_payment_days}
                  contractValue={client.contract_value}
                />
              </Suspense>
            </CardContent>
          </Card>
        </div>

        {/* Faturas */}
        <Card className="border-2 shadow-sm">
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <FileText className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Faturas</CardTitle>
                  <CardDescription>
                    {total > 0 ? `${total} ${total === 1 ? 'fatura encontrada' : 'faturas encontradas'}` : 'Nenhuma fatura'}
                  </CardDescription>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {/* Filtros */}
                <form method="get" className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative">
                    <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <select
                      aria-label="Status da fatura"
                      name="status"
                      defaultValue={status || ''}
                      className="h-9 pl-9 pr-3 text-sm border border-slate-200 dark:border-slate-700 rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-shadow w-full sm:w-auto"
                    >
                      <option value="">Todas</option>
                      <option value="OPEN">Em aberto</option>
                      <option value="OVERDUE">Vencidas</option>
                      <option value="PAID">Pagas</option>
                      <option value="DRAFT">Rascunho</option>
                      <option value="VOID">Canceladas</option>
                    </select>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      name="q"
                      defaultValue={q || ''}
                      placeholder="Buscar por número..."
                      className="h-9 pl-9 text-sm w-full sm:w-48"
                    />
                  </div>

                  <Button type="submit" size="sm" className="h-9">
                    Filtrar
                  </Button>
                </form>

                {canCreateFinance && (
                  <ConfirmInvoiceModalWrapper client={client} />
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Suspense fallback={<InvoicesSkeleton />}>
              {invoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
                    <FileText className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                    Nenhuma fatura encontrada
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {q || status
                      ? "Tente ajustar os filtros de busca"
                      : canCreateFinance
                        ? "Crie a primeira fatura para este cliente"
                        : "Ainda não há faturas cadastradas"}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {invoices.map((inv) => {
                    const issueDate = new Date(inv.issueDate);
                    const dueDate = new Date(inv.dueDate);
                    const isOverdue = inv.status === 'OVERDUE';

                    return (
                      <div
                        key={inv.id}
                        className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors px-2 -mx-2 rounded-lg"
                      >
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                              {inv.number}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-semibold border ${getInvoiceStatusBadge(inv.status)}`}
                            >
                              {getInvoiceStatusLabel(inv.status)}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>Emissão: {issueDate.toLocaleDateString("pt-BR")}</span>
                            </div>
                            <div className={`flex items-center gap-1.5 ${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}`}>
                              <CreditCard className="h-3.5 w-3.5" />
                              <span>Vence: {dueDate.toLocaleDateString("pt-BR")}</span>
                            </div>
                            <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                              <DollarSign className="h-3.5 w-3.5" />
                              <span>
                                {new Intl.NumberFormat("pt-BR", {
                                  style: "currency",
                                  currency: inv.currency || "BRL"
                                }).format(inv.total)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="h-8 text-xs"
                          >
                            <Link href={`/clients/${client.id}/billing/invoices/${inv.id}`}>
                              Ver detalhes
                            </Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Suspense>

            {/* Paginação */}
            {total > pageSize && (
              <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Mostrando <span className="font-medium text-slate-900 dark:text-white">{((page - 1) * pageSize) + 1}</span> a{" "}
                  <span className="font-medium text-slate-900 dark:text-white">{Math.min(page * pageSize, total)}</span> de{" "}
                  <span className="font-medium text-slate-900 dark:text-white">{total}</span> faturas
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    asChild={page > 1}
                  >
                    {page > 1 ? (
                      <Link
                        href={`/clients/${client.id}/billing?${new URLSearchParams({
                          ...(status ? { status } : {}),
                          ...(q ? { q } : {}),
                          page: String(page - 1)
                        }).toString()}`}
                      >
                        Anterior
                      </Link>
                    ) : (
                      <span>Anterior</span>
                    )}
                  </Button>

                  <span className="text-sm text-slate-600 dark:text-slate-400 px-2">
                    Página <span className="font-medium text-slate-900 dark:text-white">{page}</span> de{" "}
                    <span className="font-medium text-slate-900 dark:text-white">{totalPages}</span>
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    asChild={page < totalPages}
                  >
                    {page < totalPages ? (
                      <Link
                        href={`/clients/${client.id}/billing?${new URLSearchParams({
                          ...(status ? { status } : {}),
                          ...(q ? { q } : {}),
                          page: String(page + 1)
                        }).toString()}`}
                      >
                        Próxima
                      </Link>
                    ) : (
                      <span>Próxima</span>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
