import { ClientsPageClient } from "@/app/(dashboard)/clients/ClientsPageClient";
import ClientsToolbar from "@/app/(dashboard)/clients/ClientsToolbar";
import { GenerateInvoiceButton } from "@/components/GenerateInvoiceButton";
import AppShell from "@/components/layout/AppShell";
import GradientPageHeader from "@/components/layout/GradientPageHeader";
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card";
import { can } from "@/lib/permissions";
import { CLIENT_PLAN_LABELS, SOCIAL_CHANNEL_LABELS } from "@/lib/prisma-enums";
import { formatDate } from "@/lib/utils";
import { getSessionProfile } from "@/services/auth/session";
import { listClientsByOrg } from "@/services/repositories/clients";
import { CLIENT_STATUS_LABELS } from "@/types/enums";
import type { AppClient } from "@/types/tables";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/atoms/Card";
import type { ClientPlan, SocialChannel } from "@prisma/client";
import { CheckCircle2, PauseCircle, Plus, Users, XCircle } from "lucide-react";
import Link from "next/link";

// Config de cache
export const revalidate = 60; // 1 minuto
export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams?: Promise<Record<string, string>>;
}

export default async function ClientsPage({ searchParams }: PageProps) {
  const { user, orgId, role } = await getSessionProfile();
  const params = (await searchParams) || {};
  const query = params.q || "";
  const status = params.status || "";
  const plan = params.plan || "";
  const view = params.view || "grid";

  if (!user || !orgId) {
    return (
      <AppShell>
        <div className="relative bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-900 flex items-center justify-center p-8">
          <Card className="p-8 text-center text-slate-500 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-dashed space-y-3 max-w-md">
            <p>Você precisa estar autenticado para ver os clientes.</p>
            <Button
              size="sm"
              className="rounded-full bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              asChild
            >
              <Link href="/login">Ir para login</Link>
            </Button>
          </Card>
        </div>
      </AppShell>
    );
  }

  let clients: AppClient[] = [];
  try {
    const allClients = await listClientsByOrg(orgId);

    // Filter clients
    clients = allClients.filter((client) => {
      const matchesQuery =
        !query ||
        client.name.toLowerCase().includes(query.toLowerCase()) ||
        client.email?.toLowerCase().includes(query.toLowerCase());

      const matchesStatus = !status || client.status === status;
      const matchesPlan = !plan || client.plan === plan;

      return matchesQuery && matchesStatus && matchesPlan;
    });
  } catch {
    return (
      <AppShell>
        <div className="relative bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-900 flex items-center justify-center p-8">
          <Card className="p-6 text-red-600 bg-rose-50/80 dark:bg-rose-950/20 backdrop-blur-sm border-rose-200 dark:border-rose-900 shadow-sm max-w-md">
            Erro ao carregar clientes. Tente novamente.
          </Card>
        </div>
      </AppShell>
    );
  }

  const canCreateClient = role ? can(role, "create", "client") : false;

  // Get unique plans for filter
  const uniquePlans = Array.from(
    new Set((clients.map((c) => c.plan).filter(Boolean) as string[]))
  ).sort();

  const total = clients.length;
  const activeCount = clients.filter((c) => c.status === "active").length;
  const pausedCount = clients.filter((c) => c.status === "paused").length;
  const closedCount = clients.filter((c) => c.status === "closed").length;

  // // Filtros para o modal
  // const filterConfigs = [
  //   {
  //     name: "q",
  //     type: "text",
  //     placeholder: "Buscar por nome ou email...",
  //     label: "Busca",
  //     defaultValue: query,
  //   },
  //   {
  //     name: "status",
  //     type: "select",
  //     label: "Status",
  //     options: [
  //       { value: "", label: "Todos os status" },
  //       { value: "new", label: "Novo" },
  //       { value: "onboarding", label: "Onboarding" },
  //       { value: "active", label: "Ativo" },
  //       { value: "paused", label: "Pausado" },
  //       { value: "closed", label: "Encerrado" },
  //     ],
  //     defaultValue: status,
  //   },
  //   {
  //     name: "plan",
  //     type: "select",
  //     label: "Plano",
  //     options: [
  //       { value: "", label: "Todos os planos" },
  //       ...uniquePlans.map((p) => ({ value: p ?? "", label: p ?? "" })),
  //     ],
  //     defaultValue: plan,
  //   },
  // ];

  // Estado do modal


  return (
    <ClientsPageClient>
      <AppShell>
        <div className="page-background">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
            <GradientPageHeader
              icon={Users}
              title="Meus Clientes"
              subtitle="Visualize e gerencie todos os clientes da sua organização com informações atualizadas."
              gradient="primary"
              actions={
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Link href="/clients/new">
                    <Button
                      size="sm"
                      className="rounded-lg bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 sm:px-6 shadow-lg shadow-blue-500/30 w-full sm:w-auto transition-all duration-200 hover:shadow-xl hover:scale-105 active:scale-95"
                    >
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden sm:inline">Novo Cliente</span>
                      <span className="inline sm:hidden">Novo</span>
                    </Button>
                  </Link>
                </div>
              }
            />
            {/* KPI Header */}
            <KpiGrid columns={4} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                variant="blue"
                icon={Users}
                value={total}
                label="Total de Clientes"
                description="Base atual"
              />
              <KpiCard
                variant="emerald"
                icon={CheckCircle2}
                value={activeCount}
                label="Ativos"
                description={total > 0 ? `${Math.round((activeCount / total) * 100)}% da base` : "0% da base"}
                progress={total > 0 ? Math.round((activeCount / total) * 100) : 0}
              />
              <KpiCard
                variant="amber"
                icon={PauseCircle}
                value={pausedCount}
                label="Pausados"
                description="Temporariamente inativos"
              />
              <KpiCard
                variant="red"
                icon={XCircle}
                value={closedCount}
                label="Encerrados"
                description="Contratos finalizados"
              />
            </KpiGrid>
            <ClientsToolbar
              uniquePlans={uniquePlans}
              initialQuery={query}
              initialStatus={status}
              initialPlan={plan}
              initialView={view}
            />

            {!clients.length ? (
              <Card className="p-6 sm:p-8 lg:p-12 text-center border border-dashed text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm space-y-3 sm:space-y-4 transition-all duration-200 hover:shadow-lg">
                <div className="inline-flex w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-linear-to-tr from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 items-center justify-center text-3xl sm:text-4xl mb-2 animate-pulse">
                  👥
                </div>
                <div>
                  <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
                    {query || status || plan
                      ? "Nenhum cliente encontrado com esses filtros."
                      : "Nenhum cliente cadastrado ainda."}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
                    {query || status || plan
                      ? "Tente ajustar os filtros ou limpar a busca."
                      : "Que tal começar agora?"}
                  </p>
                </div>
                {canCreateClient && !(query || status || plan) && (
                  <Button
                    size="sm"
                    className="mt-4 rounded-full bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 gap-2 transition-all duration-200 hover:shadow-xl hover:scale-105 active:scale-95"
                    asChild
                  >
                    <Link href="/clients/new" className="flex items-center gap-2">
                      <Plus className="w-4 h-4 transition-transform group-hover:scale-110" />
                      Adicionar Cliente
                    </Link>
                  </Button>
                )}
              </Card>
            ) : view === "list" ? (
              /* List View */
              <Card className="overflow-hidden border-2 shadow-lg hover:shadow-xl transition-all duration-200">
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-xs sm:text-sm">
                    <thead className="bg-slate-50/80 dark:bg-slate-800/80">
                      <tr className="border-b">
                        <th className="text-left p-4 font-semibold">Cliente</th>
                        <th className="text-left p-4 font-semibold hidden sm:table-cell">Status</th>
                        <th className="text-left p-4 font-semibold hidden md:table-cell">Plano</th>
                        <th className="text-left p-4 font-semibold hidden md:table-cell">Canal</th>
                        <th className="text-left p-4 font-semibold hidden lg:table-cell">Criado em</th>
                        <th className="text-right p-4 font-semibold">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.map((client) => (
                        <tr
                          key={client.id}
                          className="border-b hover:bg-muted/30 transition-colors mt-5"
                        >
                          <td className="p-4">
                            <div>
                              <div className="font-medium text-foreground">
                                {client.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {client.email || "—"}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 hidden sm:table-cell">
                            <Badge variant={client.status === 'active' ? 'success' : client.status === 'new' ? 'info' : client.status === 'onboarding' ? 'warning' : client.status === 'paused' ? 'warning' : 'danger'} className="mt-2">
                              {CLIENT_STATUS_LABELS[client.status as keyof typeof CLIENT_STATUS_LABELS]}
                            </Badge>
                          </td>
                          <td className="p-4 hidden md:table-cell">
                            {client.plan ?? "—"}
                          </td>
                          <td className="p-4 hidden md:table-cell">
                            {client.main_channel ?? "—"}
                          </td>
                          <td className="p-4 hidden lg:table-cell text-muted-foreground">
                            {formatDate(client.created_at)}
                          </td>
                          <td className="p-4 text-right">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/clients/${client.id}/info`}>
                                Abrir
                              </Link>
                            </Button>
                            <GenerateInvoiceButton clientId={client.id} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-3 sm:p-4 bg-slate-50/80 dark:bg-slate-800/80 text-xs sm:text-sm text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
                  Total: {clients.length} cliente{clients.length !== 1 ? "s" : ""}
                </div>
              </Card>
            ) : (
              /* Grid View */
              <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-2 sm:mt-4">
                {clients.map((client) => (
                  <Link key={client.id} href={`/clients/${client.id}/info`}>
                    <Card className="group relative overflow-hidden rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 backdrop-blur-sm p-4 sm:p-6 shadow-lg hover:shadow-2xl hover:-translate-y-1 hover:scale-105 transition-all duration-200">
                      <div className="relative flex flex-col gap-2 sm:gap-3">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                            {client.name}
                          </h3>
                          <Badge variant={client.status === 'active' ? 'success' : client.status === 'new' ? 'info' : client.status === 'onboarding' ? 'warning' : client.status === 'paused' ? 'warning' : 'danger'} className="shrink-0">
                            {CLIENT_STATUS_LABELS[client.status as keyof typeof CLIENT_STATUS_LABELS]}
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                          {client.plan ? CLIENT_PLAN_LABELS[client.plan as ClientPlan] : "—"} • {client.main_channel ? SOCIAL_CHANNEL_LABELS[client.main_channel as SocialChannel] : "—"}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500">
                          Criado em{" "}
                          <span className="font-medium">
                            {formatDate(client.created_at)}
                          </span>
                        </p>
                      </div>
                      <div className="absolute bottom-0 left-0 w-full h-1 bg-linear-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </ClientsPageClient>
  );
}
