import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ClientInfoDisplay } from "@/features/clients/components/ClientInfoDisplay";
import { can } from "@/lib/permissions";
import { getSessionProfile } from "@/services/auth/session";
import { getClientDashboard } from "@/services/clients/getClientDashboard";
import { getClientById } from "@/services/repositories/clients";
import {
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  FolderKanban,
  Image as ImageIcon,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  Video,
  Zap
} from "lucide-react";
import Link from "next/link";

interface ClientInfoPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientInfoPage({ params }: ClientInfoPageProps) {
  const { id } = await params;
  const { orgId, role } = await getSessionProfile();

  if (!role) return null;

  const client = await getClientById(id);

  if (!client || client.orgId !== orgId) {
    return null;
  }

  const dash = await getClientDashboard(orgId, id);

  // Permissions
  const canEditClient = can(role, "update", "client");
  const canManageFinance = can(role, "update", "finance");
  const canCreateTask = can(role, "create", "task");
  const canCreateMeeting = can(role, "create", "meeting");
  const canViewAmounts = canManageFinance;

  const taskStats = {
    total: dash?.counts.tasks.total ?? 0,
    completed: dash?.counts.tasks.done ?? 0,
    inProgress: dash?.counts.tasks.inProgress ?? 0,
    pending: dash?.counts.tasks.todo ?? 0,
    completionRate:
      dash && dash.counts.tasks.total > 0
        ? Math.round((dash.counts.tasks.done / dash.counts.tasks.total) * 100)
        : 0,
  };

  const financeStats = {
    income: dash?.counts.finance.income ?? 0,
    expense: dash?.counts.finance.expense ?? 0,
    balance: dash?.counts.finance.net ?? 0,
  };

  const mediaStats = {
    total: dash?.counts.media ?? 0,
    images: dash?.counts.mediaByType.images ?? 0,
    videos: dash?.counts.mediaByType.videos ?? 0,
    documents: dash?.counts.mediaByType.documents ?? 0,
  };

  const meetingStats = {
    total: dash?.counts.meetings.total ?? 0,
    upcoming: dash?.counts.meetings.upcoming ?? 0,
    past: dash?.counts.meetings.past ?? 0,
  };

  const daysActive = client.created_at
    ? Math.floor(
      (new Date().getTime() - new Date(client.created_at).getTime()) /
      (1000 * 60 * 60 * 24)
    )
    : 0;

  const now = new Date();
  const nextDueDate = (() => {
    if (!client.payment_day) return null;
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = Number(client.payment_day);
    const candidate = new Date(year, month, day);
    if (candidate >= new Date(year, month, now.getDate())) return candidate;
    return new Date(year, month + 1, day);
  })();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Header do Dashboard */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-linear-to-r from-slate-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent mb-2">
                {client.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={client.status === "active" ? "default" : "secondary"}
                  className="capitalize"
                >
                  {client.status}
                </Badge>
                {client.plan && (
                  <Badge variant="outline" className="capitalize">
                    {client.plan}
                  </Badge>
                )}
                {daysActive > 0 && (
                  <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Cliente há {daysActive} dias
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {canCreateTask && (
                <Link
                  href={`/clients/${client.id}/tasks`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all hover:shadow-lg hover:scale-105"
                >
                  <FolderKanban className="h-4 w-4" /> Nova Tarefa
                </Link>
              )}
              {canManageFinance && (
                <Link
                  href={`/clients/${client.id}/billing`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-linear-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white transition-all hover:shadow-lg hover:scale-105"
                >
                  <DollarSign className="h-4 w-4" /> Cobrança
                </Link>
              )}
            </div>
          </div>

          {/* Grid Principal */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Coluna Esquerda - 2/3 */}
            <div className="xl:col-span-2 space-y-6">
              {/* KPIs Principais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Taxa de Conclusão */}
                <Card className="group border-2 border-emerald-200 dark:border-emerald-800 bg-linear-to-br from-emerald-50 to-green-50 dark:from-emerald-950/50 dark:to-green-950/30 hover:shadow-xl transition-all hover:scale-105 cursor-default">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl group-hover:scale-110 transition-transform">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                        {taskStats.completionRate}%
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Taxa de Conclusão
                    </p>
                    <Progress
                      value={taskStats.completionRate}
                      className="h-2 bg-emerald-100 dark:bg-emerald-900/30"
                    />
                  </CardContent>
                </Card>

                {/* Tarefas Ativas */}
                <Card className="group border-2 border-blue-200 dark:border-blue-800 bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/30 hover:shadow-xl transition-all hover:scale-105 cursor-default">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2.5 bg-blue-100 dark:bg-blue-900/50 rounded-xl group-hover:scale-110 transition-transform">
                        <FolderKanban className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {taskStats.total - taskStats.completed}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Tarefas Ativas
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {taskStats.completed} concluídas
                    </p>
                  </CardContent>
                </Card>

                {/* Mídias */}
                <Card className="group border-2 border-purple-200 dark:border-purple-800 bg-linear-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/30 hover:shadow-xl transition-all hover:scale-105 cursor-default">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2.5 bg-purple-100 dark:bg-purple-900/50 rounded-xl group-hover:scale-110 transition-transform">
                        <ImageIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                        {mediaStats.total}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Arquivos de Mídia
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {mediaStats.images} imagens
                    </p>
                  </CardContent>
                </Card>

                {/* Reuniões */}
                <Card className="group border-2 border-amber-200 dark:border-amber-800 bg-linear-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/30 hover:shadow-xl transition-all hover:scale-105 cursor-default">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2.5 bg-amber-100 dark:bg-amber-900/50 rounded-xl group-hover:scale-110 transition-transform">
                        <Users className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <span className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                        {meetingStats.upcoming}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Reuniões Futuras
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {meetingStats.total} no total
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Informações do Cliente */}
              <Card className="border-2 shadow-sm hover:shadow-lg transition-all">
                <ClientInfoDisplay client={client} canEdit={canEditClient} />
              </Card>

              {/* Resumo Executivo */}
              {canManageFinance && (
                <Card className="border-2 shadow-sm hover:shadow-lg transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-linear-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-lg">
                        <Zap className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <CardTitle className="text-base font-semibold">
                        Resumo Executivo
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="p-4 bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">
                          Status do Projeto
                        </p>
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-3 w-3 rounded-full animate-pulse ${taskStats.completionRate >= 75
                              ? "bg-green-500"
                              : taskStats.completionRate >= 50
                                ? "bg-blue-500"
                                : taskStats.completionRate >= 25
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                              }`}
                          />
                          <span className="text-lg font-bold text-slate-900 dark:text-white">
                            {taskStats.completionRate >= 75
                              ? "Excelente"
                              : taskStats.completionRate >= 50
                                ? "Bom"
                                : taskStats.completionRate >= 25
                                  ? "Regular"
                                  : "Precisa Atenção"}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 bg-linear-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">
                          Saúde Financeira
                        </p>
                        <div className="flex items-center gap-2">
                          {financeStats.balance >= 0 ? (
                            <TrendingUp className="h-5 w-5 text-emerald-600" />
                          ) : (
                            <TrendingDown className="h-5 w-5 text-red-600" />
                          )}
                          <span className="text-lg font-bold text-slate-900 dark:text-white">
                            {financeStats.balance >=
                              (client.contract_value
                                ? Number(client.contract_value) * 0.5
                                : 1000)
                              ? "Lucrativo"
                              : financeStats.balance >= 0
                                ? "Equilibrado"
                                : "Deficitário"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-linear-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        Cliente ativo há{" "}
                        <strong className="text-blue-600 dark:text-blue-400">
                          {daysActive} dias
                        </strong>{" "}
                        com taxa de conclusão de{" "}
                        <strong className="text-emerald-600 dark:text-emerald-400">
                          {taskStats.completionRate}%
                        </strong>
                        .
                        {canViewAmounts &&
                          (financeStats.balance >= 0 ? (
                            <>
                              {" "}
                              Balanço positivo de{" "}
                              <strong className="text-emerald-600 dark:text-emerald-400">
                                {new Intl.NumberFormat("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                }).format(financeStats.balance)}
                              </strong>
                            </>
                          ) : (
                            <>
                              {" "}
                              Déficit de{" "}
                              <strong className="text-red-600 dark:text-red-400">
                                {new Intl.NumberFormat("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                }).format(Math.abs(financeStats.balance))}
                              </strong>
                            </>
                          ))}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Desempenho de Tarefas */}
              <Card className="border-2 shadow-sm hover:shadow-lg transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-linear-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg">
                      <FolderKanban className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle className="text-base font-semibold">
                      Desempenho de Tarefas
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {taskStats.total === 0 ? (
                    <div className="p-6 rounded-xl bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 border-2 border-dashed border-slate-300 dark:border-slate-700 text-center">
                      <Sparkles className="h-10 w-10 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        Nenhuma tarefa cadastrada ainda
                      </p>
                      {canCreateTask && (
                        <Link
                          href={`/clients/${client.id}/tasks`}
                          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                        >
                          Criar a primeira tarefa
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500"></div>
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                              Concluídas
                            </span>
                          </div>
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                            {taskStats.completed}
                          </Badge>
                        </div>
                        <Progress
                          value={(taskStats.completed / taskStats.total) * 100}
                          className="h-2 bg-emerald-100 dark:bg-emerald-900/30"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full bg-blue-500"></div>
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                              Em Progresso
                            </span>
                          </div>
                          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            {taskStats.inProgress}
                          </Badge>
                        </div>
                        <Progress
                          value={(taskStats.inProgress / taskStats.total) * 100}
                          className="h-2 bg-blue-100 dark:bg-blue-900/30"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full bg-amber-500"></div>
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                              Pendentes
                            </span>
                          </div>
                          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                            {taskStats.pending}
                          </Badge>
                        </div>
                        <Progress
                          value={(taskStats.pending / taskStats.total) * 100}
                          className="h-2 bg-amber-100 dark:bg-amber-900/30"
                        />
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium uppercase tracking-wider">
                          Taxa de Conclusão Geral
                        </span>
                        <span className="text-2xl font-bold bg-linear-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                          {taskStats.completionRate}%
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Coluna Direita - 1/3 */}
            <div className="space-y-6">
              {/* Alertas Inteligentes */}
              {(() => {
                const alerts: Array<{
                  label: string;
                  href?: string;
                  tone: "danger" | "warning" | "info";
                }> = [];
                if ((dash?.counts.tasks.overdue ?? 0) > 0) {
                  alerts.push({
                    label: `${dash?.counts.tasks.overdue} tarefa(s) atrasada(s)`,
                    href: `/clients/${client.id}/tasks`,
                    tone: "danger",
                  });
                }
                if (canManageFinance && (dash?.counts.finance.net ?? 0) < 0) {
                  alerts.push({
                    label: `Balanço financeiro negativo`,
                    href: `/clients/${client.id}/finance`,
                    tone: "danger",
                  });
                }
                const endIso = client.contract_end;
                if (endIso) {
                  const end = new Date(endIso);
                  const diffDays = Math.ceil(
                    (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                  );
                  if (diffDays > 0 && diffDays <= 15) {
                    alerts.push({
                      label: `Contrato vence em ${diffDays} dia(s)`,
                      href: `/clients/${client.id}/finance`,
                      tone: "warning",
                    });
                  }
                }
                const expiresIso = client.instagram_token_expires_at;
                if (!client.instagram_access_token) {
                  alerts.push({
                    label: `Instagram não conectado`,
                    href: `/clients/${client.id}/settings`,
                    tone: "info",
                  });
                } else if (expiresIso) {
                  const exp = new Date(expiresIso);
                  const days = Math.ceil(
                    (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                  );
                  if (days <= 7)
                    alerts.push({
                      label: `Token do Instagram expira em ${days} dia(s)`,
                      href: `/clients/${client.id}/settings`,
                      tone: "warning",
                    });
                }
                return alerts.length > 0 ? (
                  <Card className="border-2 border-red-200 dark:border-red-800 shadow-sm hover:shadow-lg transition-all">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <CardTitle className="text-base font-semibold">
                          Alertas
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <div className="space-y-2">
                        {alerts.map((alert, idx) => (
                          <Link
                            key={idx}
                            href={alert.href || "#"}
                            className={`block p-3 rounded-lg border-2 text-sm font-medium transition-all hover:scale-105 ${alert.tone === "danger"
                              ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100 dark:bg-red-950/30 dark:border-red-800 dark:text-red-300"
                              : alert.tone === "warning"
                                ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300"
                                : "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300"
                              }`}
                          >
                            {alert.label}
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : null;
              })()}

              {/* Tendências */}
              {dash?.trends && (
                <Card className="border-2 shadow-sm hover:shadow-lg transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <CardTitle className="text-base font-semibold">
                        Tendências (30 dias)
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border border-blue-200 dark:border-blue-800">
                        <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Tarefas</div>
                        <div className={`flex items-center gap-1 font-semibold text-sm ${dash.trends.tasksCreated30dPct > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : dash.trends.tasksCreated30dPct < 0
                            ? "text-red-600 dark:text-red-400"
                            : "text-slate-600 dark:text-slate-400"
                          }`}>
                          {dash.trends.tasksCreated30dPct > 0 ? "▲" : dash.trends.tasksCreated30dPct < 0 ? "▼" : "–"}
                          {Math.abs(dash.trends.tasksCreated30dPct)}%
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-linear-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 border border-purple-200 dark:border-purple-800">
                        <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Reuniões</div>
                        <div className={`flex items-center gap-1 font-semibold text-sm ${dash.trends.meetings30dPct > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : dash.trends.meetings30dPct < 0
                            ? "text-red-600 dark:text-red-400"
                            : "text-slate-600 dark:text-slate-400"
                          }`}>
                          {dash.trends.meetings30dPct > 0 ? "▲" : dash.trends.meetings30dPct < 0 ? "▼" : "–"}
                          {Math.abs(dash.trends.meetings30dPct)}%
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-linear-to-br from-pink-50 to-pink-100 dark:from-pink-950/30 dark:to-pink-900/30 border border-pink-200 dark:border-pink-800">
                        <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Mídias</div>
                        <div className={`flex items-center gap-1 font-semibold text-sm ${dash.trends.media30dPct > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : dash.trends.media30dPct < 0
                            ? "text-red-600 dark:text-red-400"
                            : "text-slate-600 dark:text-slate-400"
                          }`}>
                          {dash.trends.media30dPct > 0 ? "▲" : dash.trends.media30dPct < 0 ? "▼" : "–"}
                          {Math.abs(dash.trends.media30dPct)}%
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-linear-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
                        <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Financeiro</div>
                        <div className={`flex items-center gap-1 font-semibold text-sm ${dash.trends.financeNet30dPct > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : dash.trends.financeNet30dPct < 0
                            ? "text-red-600 dark:text-red-400"
                            : "text-slate-600 dark:text-slate-400"
                          }`}>
                          {dash.trends.financeNet30dPct > 0 ? "▲" : dash.trends.financeNet30dPct < 0 ? "▼" : "–"}
                          {Math.abs(dash.trends.financeNet30dPct)}%
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tarefas Urgentes */}
              {dash?.urgentTasks && dash.urgentTasks.length > 0 && (
                <Card className="border-2 border-orange-200 dark:border-orange-800 shadow-sm hover:shadow-lg transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <CardTitle className="text-base font-semibold">
                        Tarefas Urgentes
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="space-y-2">
                      {dash.urgentTasks.slice(0, 5).map((task) => (
                        <Link
                          key={task.id}
                          href={`/clients/${client.id}/tasks`}
                          className="block p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-all"
                        >
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate mb-1">
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                            <Badge variant="outline" className="capitalize">
                              {task.priority}
                            </Badge>
                            {task.dueDate && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(task.dueDate).toLocaleDateString("pt-BR")}
                              </span>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Próxima Reunião */}
              {(() => {
                const upcoming = (dash?.meetings ?? []).filter(
                  (m) => new Date(m.startTime) > new Date()
                );
                if (upcoming.length === 0) {
                  return (
                    <Card className="border-2 shadow-sm hover:shadow-lg transition-all">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <CardTitle className="text-base font-semibold">
                            Próxima Reunião
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="px-4 pb-4">
                        <div className="p-6 rounded-xl bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 border-2 border-dashed border-slate-300 dark:border-slate-700 text-center">
                          <Users className="h-10 w-10 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                            Nenhuma reunião agendada
                          </p>
                          {canCreateMeeting && (
                            <Link
                              href={`/clients/${client.id}/meetings`}
                              className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
                            >
                              Agendar agora
                              <ArrowUpRight className="h-4 w-4" />
                            </Link>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
                const next = upcoming.sort(
                  (a, b) =>
                    new Date(a.startTime).getTime() -
                    new Date(b.startTime).getTime()
                )[0];
                return (
                  <Card className="border-2 shadow-sm hover:shadow-lg transition-all">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                          <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <CardTitle className="text-base font-semibold">
                          Próxima Reunião
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <div className="p-4 bg-linear-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 rounded-xl border border-purple-200 dark:border-purple-800">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                          {next.title}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(next.startTime).toLocaleString("pt-BR")}
                        </p>
                      </div>
                      <Link
                        href={`/clients/${client.id}/meetings`}
                        className="inline-flex items-center gap-2 mt-3 text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
                      >
                        Ver todas as reuniões
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Próximo Vencimento */}
              {canManageFinance && nextDueDate && (
                <Card className="border-2 border-emerald-200 dark:border-emerald-800 shadow-sm hover:shadow-lg transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                        <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <CardTitle className="text-base font-semibold">
                        Próximo Vencimento
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="p-4 bg-linear-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                        {nextDueDate.toLocaleDateString("pt-BR")}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Dia do pagamento: {client.payment_day}
                      </p>
                    </div>
                    <Link
                      href={`/clients/${client.id}/billing`}
                      className="inline-flex items-center gap-2 mt-3 text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium"
                    >
                      Gerenciar cobrança
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </CardContent>
                </Card>
              )}

              {/* Biblioteca de Mídia */}
              <Card className="border-2 shadow-sm hover:shadow-lg transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-linear-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg">
                      <ImageIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <CardTitle className="text-base font-semibold">
                      Biblioteca de Mídia
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-4 rounded-xl bg-linear-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 border border-purple-200 dark:border-purple-800 hover:scale-105 transition-transform">
                      <ImageIcon className="h-6 w-6 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {mediaStats.images}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
                        Imagens
                      </p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-linear-to-br from-pink-50 to-pink-100 dark:from-pink-950/30 dark:to-pink-900/30 border border-pink-200 dark:border-pink-800 hover:scale-105 transition-transform">
                      <Video className="h-6 w-6 text-pink-600 dark:text-pink-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                        {mediaStats.videos}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
                        Vídeos
                      </p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-linear-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/30 dark:to-indigo-900/30 border border-indigo-200 dark:border-indigo-800 hover:scale-105 transition-transform">
                      <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                        {mediaStats.documents}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
                        Docs
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/clients/${client.id}/media`}
                    className="inline-flex items-center gap-2 mt-4 text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
                  >
                    Ver biblioteca completa
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </CardContent>
              </Card>

              {/* Histórico de Reuniões */}
              <Card className="border-2 shadow-sm hover:shadow-lg transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle className="text-base font-semibold">
                      Histórico de Reuniões
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="text-center p-4 rounded-xl bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 hover:scale-105 transition-transform">
                      <Users className="h-6 w-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {meetingStats.upcoming}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
                        Próximas
                      </p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 border border-slate-200 dark:border-slate-700 hover:scale-105 transition-transform">
                      <Clock className="h-6 w-6 text-slate-600 dark:text-slate-400 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-slate-600 dark:text-slate-400">
                        {meetingStats.past}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
                        Realizadas
                      </p>
                    </div>
                  </div>
                  <div className="p-5 rounded-xl bg-linear-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-pink-950/30 border border-purple-200 dark:border-purple-800 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <span className="text-xs text-slate-600 dark:text-slate-400 font-medium uppercase tracking-wider">
                        Total
                      </span>
                    </div>
                    <p className="text-4xl font-bold bg-linear-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {meetingStats.total}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 font-medium">
                      reuniões registradas
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
