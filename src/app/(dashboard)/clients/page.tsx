import AppShell from "@/components/layout/AppShell";
import GradientPageHeader from "@/components/layout/GradientPageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { can } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";
import { getSessionProfile } from "@/services/auth/session";
import { listClientsByOrg } from "@/services/repositories/clients";
import { CLIENT_STATUS_LABELS } from "@/types/enums";
import type { AppClient } from "@/types/tables";
import { Plus, Users } from "lucide-react";
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
  // const uniquePlans = Array.from(
  //   new Set(clients.map((c) => c.plan).filter(Boolean))
  // ).sort();

  // const total = clients.length;
  // const activeCount = clients.filter((c) => c.status === "active").length;
  // const pausedCount = clients.filter((c) => c.status === "paused").length;
  // const inactiveCount = clients.filter((c) => c.status === "closed").length;

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
    <AppShell>
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <GradientPageHeader
          icon={Users}
          title="Meus Clientes"
          subtitle="Visualize e gerencie todos os clientes da sua organização com informações atualizadas."
          gradient="primary"
          actions={
            <div className="flex gap-2">
              <Button
                size="lg"
                className="rounded-lg bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 shadow-lg shadow-blue-500/30 gap-2"
                asChild
              >
                <Link href="/clients/new">
                  <Plus className="w-5 h-5" />
                  Novo Cliente
                </Link>
              </Button>
              {/* <Button
                size="lg"
                variant="outline"
                className="rounded-lg px-6 gap-2 border-blue-300"
                onClick={() => setFilterModalOpen(true)}
              >
                <Grid3x3 className="w-5 h-5" />
                Filtros
              </Button> */}
            </div>
          }
        />
        {/* <FilterBarModal
          filters={filterConfigs}
          open={filterModalOpen}
          setOpen={setFilterModalOpen}
        /> */}

        {!clients.length ? (
          <Card className="p-12 text-center border border-dashed text-slate-500 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm space-y-4">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-linear-to-tr from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 items-center justify-center text-3xl mb-2">
              👥
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">
                {query || status || plan
                  ? "Nenhum cliente encontrado com esses filtros."
                  : "Nenhum cliente cadastrado ainda."}
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                {query || status || plan
                  ? "Tente ajustar os filtros ou limpar a busca."
                  : "Que tal começar agora?"}
              </p>
            </div>
            {canCreateClient && !(query || status || plan) && (
              <Link href="/clients/new">
                <Button
                  size="sm"
                  className="mt-4 rounded-full bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Cliente
                </Button>
              </Link>
            )}
          </Card>
        ) : view === "list" ? (
          /* List View */
          <Card className="overflow-hidden border-2 shadow-lg hover:shadow-xl transition-shadow">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
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
                        <Link href={`/clients/${client.id}/info`}>
                          <Button variant="ghost" size="sm">
                            Abrir
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-muted/20 text-sm text-muted-foreground border-t">
              Total: {clients.length} cliente{clients.length !== 1 ? "s" : ""}
            </div>
          </Card>
        ) : (
          /* Grid View */
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-4">
            {clients.map((client) => (
              <Link key={client.id} href={`/clients/${client.id}/info`}>
                <Card className="group relative overflow-hidden rounded-2xl border-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="relative flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {client.name}
                      </h3>
                      <Badge variant={client.status === 'active' ? 'success' : client.status === 'new' ? 'info' : client.status === 'onboarding' ? 'warning' : client.status === 'paused' ? 'warning' : 'danger'}>
                        {CLIENT_STATUS_LABELS[client.status as keyof typeof CLIENT_STATUS_LABELS]}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {client.plan ?? "—"} • {client.main_channel ?? "—"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                      Criado em{" "}
                      <span className="font-medium">
                        {formatDate(client.created_at)}
                      </span>
                    </p>
                  </div>
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-linear-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
