import AppShell from "@/components/layout/AppShell";
import PageContainer from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageLayout } from "@/components/layout/PageLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/features/clients/components/StatusBadge";
import { formatDate } from "@/lib/utils";
import { getSessionProfile } from "@/services/auth/session";
import { listClientsByOrg } from "@/services/repositories/clients";
import { ClientStatus } from "@/types/client";
import type { AppClient } from "@/types/tables";
import { Plus, Users } from "lucide-react";
import Link from "next/link";

export const revalidate = 60;

export default async function ClientsPage() {
  const { user, orgId } = await getSessionProfile();

  if (!user || !orgId) {
    return (
      <ProtectedRoute>
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
      </ProtectedRoute>
    );
  }

  let clients: AppClient[] = [];
  try {
    clients = await listClientsByOrg(orgId);
  } catch {
    return (
      <ProtectedRoute>
        <AppShell>
          <div className="relative bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-900 flex items-center justify-center p-8">
            <Card className="p-6 text-red-600 bg-rose-50/80 dark:bg-rose-950/20 backdrop-blur-sm border-rose-200 dark:border-rose-900 shadow-sm max-w-md">
              Erro ao carregar clientes. Tente novamente.
            </Card>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <PageContainer className="space-y-10">
          <PageLayout centered={false}>
            <PageHeader
              title="Meus Clientes"
              description="Visualize e gerencie todos os clientes da sua organização com informações atualizadas."
              icon={Users}
              iconColor="bg-blue-600"
              actions={
                <Link href="/clients/new">
                  <Button
                    size="lg"
                    className="rounded-full bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 shadow-lg shadow-blue-500/30 gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Novo Cliente
                  </Button>
                </Link>
              }
            />

            {!clients.length ? (
              <Card className="p-12 text-center border border-dashed text-slate-500 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm space-y-4">
                <div className="inline-flex w-16 h-16 rounded-2xl bg-linear-to-tr from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 items-center justify-center text-3xl mb-2">
                  👥
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    Nenhum cliente cadastrado ainda.
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                    Que tal começar agora?
                  </p>
                </div>
                <Link href="/clients/new">
                  <Button
                    size="sm"
                    className="mt-4 rounded-full bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Cliente
                  </Button>
                </Link>
              </Card>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {clients.map((client) => (
                  <Link key={client.id} href={`/clients/${client.id}/info`}>
                    <Card className="group relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                      <div className="relative flex flex-col gap-3">
                        <div className="flex items-start justify-between">
                          <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {client.name}
                          </h3>
                          <StatusBadge status={client.status as ClientStatus} />
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
          </PageLayout>
        </PageContainer>
      </AppShell>
    </ProtectedRoute>
  );
}
