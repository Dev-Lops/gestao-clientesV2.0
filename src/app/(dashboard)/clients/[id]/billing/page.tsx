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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@radix-ui/react-select";
import {
  Calendar,
  CreditCard,
  DollarSign,
  FileText,
  Filter,
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
  const statusParam = sp.status?.toString().toUpperCase();
  const status = (statusParam && statusParam !== "ALL" ? statusParam as InvoiceStatusFilter : undefined);
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
      <div className="page-background">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Header com navegação
        <header className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="lg"
              asChild
              className="h-10 w-10 p-0 rounded-full border-2 hover:scale-105 transition-transform"
            >
              <Link href={`/clients/${client.id}`}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Voltar</span>
              </Link>
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-linear-to-br from-blue-500 to-purple-500 rounded-xl shadow-lg">
                  <Receipt className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Faturamento
                </h1>
              </div>
              <p className="text-base text-slate-600 dark:text-slate-400 font-medium">
                Gestão financeira de <span className="font-semibold text-slate-900 dark:text-white">{client.name}</span>
              </p>
            </div>
          </div>
        </header> */}

          {/* Resumo do Cliente - Cards em Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Status do Mês */}
            <Card className="border-2 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 bg-white/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2.5 bg-linear-to-br from-blue-500 to-cyan-500 rounded-xl shadow-md">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base font-bold truncate">Status do Mês</CardTitle>
                    <CardDescription className="text-xs font-medium">Situação de pagamento atual</CardDescription>
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
              <Card className="border-2 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 bg-white/50 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2.5 bg-linear-to-br from-purple-500 to-pink-500 rounded-xl shadow-md">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base font-bold truncate">Parcelas</CardTitle>
                      <CardDescription className="text-xs font-medium">Controle de pagamentos parcelados</CardDescription>
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
            <Card className="border-2 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 bg-white/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2.5 bg-linear-to-br from-emerald-500 to-teal-500 rounded-xl shadow-md">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base font-bold truncate">Contrato</CardTitle>
                    <CardDescription className="text-xs font-medium">Informações contratuais</CardDescription>
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
          <Card className="border-2 shadow-lg bg-white/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-linear-to-br from-slate-600 to-slate-700 rounded-xl shadow-md">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">Faturas</CardTitle>
                    <CardDescription className="font-medium">
                      {total > 0 ? `${total} ${total === 1 ? 'fatura encontrada' : 'faturas encontradas'}` : 'Nenhuma fatura'}
                    </CardDescription>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  {/* Filtros */}
                  <form method="get" className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative w-full sm:w-auto">
                      <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10 pointer-events-none" />
                      <Select name="status" defaultValue={status || "ALL"}>
                        <SelectTrigger className="h-10 pl-9 pr-3 text-sm font-medium w-full sm:w-auto">
                          <SelectValue placeholder="Todas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">Todas</SelectItem>
                          <SelectItem value="OPEN">Em aberto</SelectItem>
                          <SelectItem value="OVERDUE">Vencidas</SelectItem>
                          <SelectItem value="PAID">Pagas</SelectItem>
                          <SelectItem value="DRAFT">Rascunho</SelectItem>
                          <SelectItem value="VOID">Canceladas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        name="q"
                        defaultValue={q || ''}
                        placeholder="Buscar por número..."
                        className="h-10 pl-9 text-sm font-medium border-2 w-full sm:w-52"
                      />
                    </div>

                    <Button type="submit" size="lg" className="h-10 font-semibold">
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
                    <div className="p-5 bg-linear-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-full mb-4 shadow-inner">
                      <FileText className="h-10 w-10 text-slate-500" />
                    </div>
                    <p className="text-base font-bold text-slate-900 dark:text-white mb-1">
                      Nenhuma fatura encontrada
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
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
                          className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all px-3 -mx-3 rounded-xl border-l-4 border-transparent hover:border-blue-400"
                        >
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-base font-bold text-slate-900 dark:text-white">
                                {inv.number}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-xs font-bold border-2 rounded-full px-3 py-1 ${getInvoiceStatusBadge(inv.status)}`}
                              >
                                {getInvoiceStatusLabel(inv.status)}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4 text-slate-500" />
                                <span>Emissão: {issueDate.toLocaleDateString("pt-BR")}</span>
                              </div>
                              <div className={`flex items-center gap-1.5 ${isOverdue ? 'text-red-600 dark:text-red-400 font-bold' : ''}`}>
                                <CreditCard className="h-4 w-4" />
                                <span>Vence: {dueDate.toLocaleDateString("pt-BR")}</span>
                              </div>
                              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                                <DollarSign className="h-4 w-4 text-emerald-600" />
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
                              size="lg"
                              asChild
                              className="h-10 font-semibold border-2 hover:scale-105 transition-transform"
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
                <div className="pt-6 mt-6 border-t-2 border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                    Mostrando <span className="font-medium text-slate-900 dark:text-white">{((page - 1) * pageSize) + 1}</span> a{" "}
                    <span className="font-medium text-slate-900 dark:text-white">{Math.min(page * pageSize, total)}</span> de{" "}
                    <span className="font-medium text-slate-900 dark:text-white">{total}</span> faturas
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="lg"
                      className="border-2 font-semibold"
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

                    <span className="text-sm text-slate-600 dark:text-slate-400 font-medium px-2">
                      Página <span className="font-medium text-slate-900 dark:text-white">{page}</span> de{" "}
                      <span className="font-medium text-slate-900 dark:text-white">{totalPages}</span>
                    </span>

                    <Button
                      variant="outline"
                      size="lg"
                      className="border-2 font-semibold"
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
      </div>
    </ProtectedRoute>
  );
}
