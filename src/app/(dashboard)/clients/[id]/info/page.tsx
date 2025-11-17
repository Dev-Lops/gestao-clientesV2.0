import { KPICard } from "@/components/common/KPICard";
import { SectionCard } from "@/components/common/SectionCard";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ClientInfoDisplay } from "@/features/clients/components/ClientInfoDisplay";
// Cobrança movida para a área dedicada de Billing
// import { useClientKPI } from "@/hooks/useClientKPI";
import { can } from "@/lib/permissions";
import { getSessionProfile } from "@/services/auth/session";
import { getClientDashboard } from "@/services/clients/getClientDashboard";
import { getClientById } from "@/services/repositories/clients";
import {
  AlertTriangle,
  Clock,
  FileText,
  FolderKanban,
  Image as ImageIcon,
  Lightbulb,
  Users
} from "lucide-react";

interface ClientInfoPageProps {
  params: Promise<{ id: string }>;
}

// Removed unused StatCard helper to avoid lint warning

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
  const canCreateMedia = can(role, "create", "media");
  const canCreateMeeting = can(role, "create", "meeting");
  const canViewAmounts = canManageFinance;

  // Dados consolidados via serviço (dash)
  type DashCounts = {
    tasks: {
      total: number;
      done: number;
    };
    media: number;
    strategies: number;
    brandings: number;
  };

  type DashType = {
    counts: DashCounts;
  };

  function getKPIData(dash: DashType | undefined) {
    return {
      activeTasks: (dash?.counts.tasks.total ?? 0) - (dash?.counts.tasks.done ?? 0),
      completedTasks: dash?.counts.tasks.done ?? 0,
      media: dash?.counts.media ?? 0,
      strategies: dash?.counts.strategies ?? 0,
      brandings: dash?.counts.brandings ?? 0,
      strategiesDescription:
        (dash?.counts.strategies ?? 0) === 0
          ? "Nenhuma estratégia cadastrada"
          : `${dash!.counts.strategies} plano${dash!.counts.strategies === 1 ? '' : 's'} ativo${dash!.counts.strategies === 1 ? '' : 's'}`,
    };
  }

  const taskStats = {
    total: dash?.counts.tasks.total ?? 0,
    completed: dash?.counts.tasks.done ?? 0,
    inProgress: dash?.counts.tasks.inProgress ?? 0,
    pending: dash?.counts.tasks.todo ?? 0,
    completionRate:
      dash && dash.counts.tasks.total > 0
        ? Math.round(
          (dash.counts.tasks.done / dash.counts.tasks.total) * 100,
        )
        : 0,
  };

  const financeStats = {
    income: dash?.counts.finance.income ?? 0,
    expense: dash?.counts.finance.expense ?? 0,
    balance: dash?.counts.finance.net ?? 0,
    transactions: 0,
  };

  // Data de referência para cálculos locais em cards (evita Date.now em render)
  const now = new Date();

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

  // Dias ativo do cliente (antes usado via healthMetrics)
  const daysActive = client.created_at
    ? Math.floor(
      (new Date().getTime() - new Date(client.created_at).getTime()) /
      (1000 * 60 * 60 * 24),
    )
    : 0;

  // Utilitários: próximo vencimento (com base em payment_day)
  const today = new Date();
  const nextDueDate = (() => {
    if (!client.payment_day) return null;
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = Number(client.payment_day);
    const candidate = new Date(year, month, day);
    if (candidate >= new Date(year, month, today.getDate())) return candidate;
    return new Date(year, month + 1, day);
  })();

  return (
    <ProtectedRoute>
      <div className="bg-background transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Grid Principal: Info + Métricas */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Coluna Esquerda: Métricas, Info, Ações, Cobrança */}
            <div className="xl:col-span-2 space-y-6">
              {/* Grid: Métricas Rápidas (adjusted sizes and responsive cols) */}
              {dash ? (
                (() => {
                  const kpi = getKPIData(dash);
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      <KPICard
                        className="min-h-14 flex items-center"
                        icon={FolderKanban}
                        label="Tarefas ativas"
                        value={kpi.activeTasks}
                        description={`${kpi.completedTasks} concluídas`}
                        variant="info"
                        aria-label="Tarefas ativas"
                      />
                      <KPICard
                        className="min-h-14 flex items-center"
                        icon={ImageIcon}
                        label="Mídias"
                        value={kpi.media}
                        description="Arquivos de mídia"
                        variant="neutral"
                        aria-label="Mídias"
                      />
                      <div className="relative">
                        <KPICard
                          className="min-h-14"
                          icon={Lightbulb}
                          label="Estratégias"
                          value={kpi.strategies}
                          description={kpi.strategiesDescription}
                          variant="warning"
                          aria-label="Estratégias"
                        />
                        {kpi.strategies > 0 && (
                          <div className="absolute bottom-2 right-2">
                            <a
                              href={`/clients/${client.id}/strategy`}
                              className="text-xs text-orange-600 hover:underline"
                              aria-label="Gerenciar estratégias"
                            >
                              Gerenciar estratégias
                            </a>
                          </div>
                        )}
                      </div>
                      <KPICard
                        className="min-h-14 flex items-center"
                        icon={FileText}
                        label="Branding"
                        value={kpi.brandings}
                        description="Materiais"
                        variant="info"
                        aria-label="Branding"
                      />
                    </div>
                  );
                })()
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <KPICard className="min-h-5 flex items-center" icon={FolderKanban} label="Tarefas ativas" value={taskStats.total - taskStats.completed} description={`${taskStats.completed} concluídas`} variant="info" aria-label="Tarefas ativas" />
                  <KPICard className="min-h-5 flex items-center" icon={ImageIcon} label="Mídias" value={mediaStats.total} description="Arquivos de mídia" variant="neutral" aria-label="Mídias" />
                </div>
              )}

              {/* Card: Info do Cliente */}
              <SectionCard title="Informações do Cliente" icon={FileText} headerGradient="default">
                <ClientInfoDisplay client={client} canEdit={canEditClient} />
              </SectionCard>

              {canManageFinance && (
                <SectionCard title="Resumo Executivo" icon={FileText}>
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">
                          Status Geral do Projeto
                        </p>
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-3 w-3 rounded-full ${taskStats.completionRate >= 75
                              ? "bg-green-500"
                              : taskStats.completionRate >= 50
                                ? "bg-blue-500"
                                : taskStats.completionRate >= 25
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                              }`}
                          />
                          <span className="text-base font-semibold text-foreground">
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

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">
                          Saúde Financeira
                        </p>
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-3 w-3 rounded-full ${financeStats.balance >=
                              (client.contract_value
                                ? Number(client.contract_value) * 0.5
                                : 1000)
                              ? "bg-green-500"
                              : financeStats.balance >= 0
                                ? "bg-blue-500"
                                : "bg-red-500"
                              }`}
                          />
                          <span className="text-base font-semibold text-foreground">
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

                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Cliente ativo há <strong>{daysActive} dias</strong> com
                        {" "}
                        <strong>{taskStats.completionRate}%</strong> de taxa de
                        conclusão de tarefas.
                        {" "}
                        {canViewAmounts
                          ? financeStats.balance >= 0
                            ? (
                              <>
                                Apresenta balanço financeiro positivo de {" "}
                                <strong>
                                  {new Intl.NumberFormat("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                  }).format(financeStats.balance)}
                                </strong>
                                .
                              </>
                            )
                            : (
                              <>
                                Atenção: balanço financeiro negativo de {" "}
                                <strong>
                                  {new Intl.NumberFormat("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                  }).format(Math.abs(financeStats.balance))}
                                </strong>
                                .
                              </>
                            )
                          : financeStats.balance >= 0
                            ? " Apresenta balanço financeiro positivo."
                            : " Atenção: balanço financeiro negativo."}
                      </p>
                    </div>
                  </div>
                </SectionCard>
              )}

              {/* Ações Rápidas (respeitando permissões) */}
              {(canCreateTask || canCreateMedia || canCreateMeeting) && (
                <SectionCard title="Ações Rápidas" icon={FolderKanban} headerGradient="default">
                  <div className="flex flex-wrap gap-3">
                    {canCreateTask && (
                      <a
                        href={`/clients/${client.id}/tasks`}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <FolderKanban className="h-4 w-4" /> Nova tarefa
                      </a>
                    )}
                    {canCreateMedia && (
                      <a
                        href={`/clients/${client.id}/media`}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <ImageIcon className="h-4 w-4" /> Enviar mídia
                      </a>
                    )}
                    {canCreateMeeting && (
                      <a
                        href={`/clients/${client.id}/meetings`}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <Users className="h-4 w-4" /> Agendar reunião
                      </a>
                    )}
                  </div>
                </SectionCard>
              )}

              {canManageFinance && (
                <SectionCard title="Cobrança" icon={FileText} headerGradient="success">
                  <p className="text-sm text-muted-foreground mb-3">Gerencie contratos, parcelas e faturas em um só lugar.</p>
                  <a
                    href={`/clients/${client.id}/billing`}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Abrir gerenciamento de cobrança
                  </a>
                </SectionCard>
              )}

              <SectionCard title="Desempenho de Tarefas" icon={FolderKanban}>
                <div className="pt-2 space-y-5">
                  {taskStats.total === 0 ? (
                    <div className="p-4 rounded-lg bg-muted/40 border border-border/50 text-sm text-muted-foreground">
                      Nenhuma tarefa cadastrada.
                      {canCreateTask && (
                        <>
                          {" "}
                          <a href={`/clients/${client.id}/tasks`} className="text-blue-600 hover:text-blue-700">
                            Criar a primeira
                          </a>
                          .
                        </>
                      )}
                    </div>
                  ) : (
                    <>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500"></div>
                            <span className="text-sm font-semibold text-muted-foreground">Concluídas</span>
                          </div>
                          <span className="text-sm font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">{taskStats.completed}</span>
                        </div>
                        <ProgressBar value={taskStats.completed} max={taskStats.total} color="green" />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                            <span className="text-sm font-semibold text-muted-foreground">Em Progresso</span>
                          </div>
                          <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">{taskStats.inProgress}</span>
                        </div>
                        <ProgressBar value={taskStats.inProgress} max={taskStats.total} color="blue" />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                            <span className="text-sm font-semibold text-muted-foreground">Pendentes</span>
                          </div>
                          <span className="text-sm font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">{taskStats.pending}</span>
                        </div>
                        <ProgressBar value={taskStats.pending} max={taskStats.total} color="amber" />
                      </div>

                      <div className="pt-4 mt-4 border-t border-border/50">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground font-medium">Taxa de Conclusão</span>
                          <span className="text-lg font-bold bg-linear-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{taskStats.completionRate}%</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </SectionCard>
            </div>
            {/* Coluna Direita: Alertas, Tendências, Reuniões, Vencimento, Urgentes, Contato, Mídia, Tarefas, Histórico */}
            <div className="space-y-6">
              {/* Alertas inteligentes */}
              {(() => {
                const alerts: Array<{ label: string; href?: string; tone: "danger" | "warning" | "info" }> = [];
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
                // contrato a vencer em 15 dias
                const endIso = client.contract_end;
                if (endIso) {
                  const end = new Date(endIso);
                  const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  if (diffDays > 0 && diffDays <= 15) {
                    alerts.push({ label: `Contrato vence em ${diffDays} dia(s)`, href: `/clients/${client.id}/finance`, tone: "warning" });
                  }
                }
                // token instagram ausente ou a expirar em 7 dias
                const expiresIso = client.instagram_token_expires_at;
                if (!client.instagram_access_token) {
                  alerts.push({ label: `Instagram não conectado`, href: `/clients/${client.id}/settings`, tone: "info" });
                } else if (expiresIso) {
                  const exp = new Date(expiresIso);
                  const days = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  if (days <= 7) alerts.push({ label: `Token do Instagram expira em ${days} dia(s)`, href: `/clients/${client.id}/settings`, tone: "warning" });
                }


              })()}
              {/* Tendências (últimos 30 dias) */}
              {dash?.trends && (
                <SectionCard title="Tendências (30 dias)">
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="p-3 rounded-lg border border-border/60">
                      <div className="text-xs text-muted-foreground">Tarefas novas</div>
                      <div className={`font-semibold ${dash.trends.tasksCreated30dPct > 0 ? "text-green-600" : dash.trends.tasksCreated30dPct < 0 ? "text-red-600" : "text-foreground"}`}>
                        {dash.trends.tasksCreated30dPct > 0 ? "▲" : dash.trends.tasksCreated30dPct < 0 ? "▼" : "–"} {Math.abs(dash.trends.tasksCreated30dPct)}%
                      </div>
                    </div>
                    <div className="p-3 rounded-lg border border-border/60">
                      <div className="text-xs text-muted-foreground">Reuniões</div>
                      <div className={`font-semibold ${dash.trends.meetings30dPct > 0 ? "text-green-600" : dash.trends.meetings30dPct < 0 ? "text-red-600" : "text-foreground"}`}>
                        {dash.trends.meetings30dPct > 0 ? "▲" : dash.trends.meetings30dPct < 0 ? "▼" : "–"} {Math.abs(dash.trends.meetings30dPct)}%
                      </div>
                    </div>
                    <div className="p-3 rounded-lg border border-border/60">
                      <div className="text-xs text-muted-foreground">Mídias</div>
                      <div className={`font-semibold ${dash.trends.media30dPct > 0 ? "text-green-600" : dash.trends.media30dPct < 0 ? "text-red-600" : "text-foreground"}`}>
                        {dash.trends.media30dPct > 0 ? "▲" : dash.trends.media30dPct < 0 ? "▼" : "–"} {Math.abs(dash.trends.media30dPct)}%
                      </div>
                    </div>
                    <div className="p-3 rounded-lg border border-border/60 col-span-3">
                      <div className="text-xs text-muted-foreground">Financeiro (saldo)</div>
                      <div className={`font-semibold ${dash.trends.financeNet30dPct > 0 ? "text-green-600" : dash.trends.financeNet30dPct < 0 ? "text-red-600" : "text-foreground"}`}>
                        {dash.trends.financeNet30dPct > 0 ? "▲" : dash.trends.financeNet30dPct < 0 ? "▼" : "–"} {Math.abs(dash.trends.financeNet30dPct)}%
                      </div>
                    </div>
                  </div>
                </SectionCard>
              )}
              {/* Próxima reunião */}
              {(() => {
                const upcoming = (dash?.meetings ?? []).filter((m) => new Date(m.startTime) > new Date());
                if (upcoming.length === 0) {
                  return (
                    <SectionCard title="Próxima reunião" icon={Users}>
                      <p className="text-sm text-muted-foreground">Nenhuma reunião futura.</p>
                      <div className="mt-3">
                        <a href={`/clients/${client.id}/meetings`} className="text-xs text-blue-600 hover:text-blue-700">
                          {canCreateMeeting ? "Agendar agora" : "Ver reuniões"}
                        </a>
                      </div>
                    </SectionCard>
                  );
                }
                const next = upcoming.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];
                return (
                  <SectionCard title="Próxima reunião" icon={Users}>
                    <div className="space-y-2">
                      <div className="text-sm font-semibold">{next.title}</div>
                      <div className="text-xs text-muted-foreground">{new Date(next.startTime).toLocaleString("pt-BR")}</div>
                      {/* Descrição opcional removida; serviço não garante este campo */}
                      <a href={`/clients/${client.id}/meetings`} className="inline-flex mt-2 text-xs text-blue-600 hover:text-blue-700">
                        Ver todas as reuniões
                      </a>
                    </div>
                  </SectionCard>
                );
              })()}

              {/* Próximo vencimento (finance) */}
              {canManageFinance && nextDueDate && (
                <SectionCard title="Próximo vencimento" icon={Clock} headerGradient="success">
                  <div className="text-sm font-semibold">{nextDueDate.toLocaleDateString("pt-BR")}</div>
                  <p className="text-xs text-muted-foreground mt-1">Dia do pagamento: {client.payment_day}</p>
                  <a href={`/clients/${client.id}/billing`} className="inline-flex mt-2 text-xs text-blue-600 hover:text-blue-700">
                    Gerenciar cobrança
                  </a>
                </SectionCard>
              )}

              {/* Tarefas Urgentes */}
              {dash?.urgentTasks && dash.urgentTasks.length > 0 && (
                <SectionCard title="Tarefas urgentes" icon={AlertTriangle} headerGradient="danger">
                  <div className="space-y-3">
                    {dash.urgentTasks.slice(0, 5).map((t) => (
                      <div key={t.id} className="flex items-center justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{t.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {t.priority} {t.dueDate ? `• vence ${new Date(t.dueDate).toLocaleDateString('pt-BR')}` : ""}
                          </div>
                        </div>
                        <a href={`/clients/${client.id}/tasks`} className="text-xs text-blue-600 hover:text-blue-700">Abrir</a>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              )}


              {/* Media Library Card */}
              <SectionCard title="Biblioteca de Mídia" icon={ImageIcon} iconGradient="from-purple-600 to-pink-600">
                <div className="pt-2">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-4 rounded-lg bg-linear-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-900/40 border border-border/50 hover:shadow-md transition-shadow">
                      <ImageIcon className="h-5 w-5 text-purple-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-purple-600">
                        {mediaStats.images}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 font-medium">
                        Imagens
                      </p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-linear-to-br from-pink-50 to-pink-100 dark:from-pink-900/30 dark:to-pink-900/40 border border-border/50 hover:shadow-md transition-shadow">
                      <FileText className="h-5 w-5 text-pink-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-pink-600">
                        {mediaStats.videos}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 font-medium">
                        Vídeos
                      </p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-linear-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-900/40 border border-border/50 hover:shadow-md transition-shadow">
                      <FileText className="h-5 w-5 text-indigo-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-indigo-600">
                        {mediaStats.documents}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 font-medium">
                        Docs
                      </p>
                    </div>
                  </div>
                </div>
              </SectionCard>

              {/* Task Breakdown */}


              {/* Meeting Stats */}
              <SectionCard title="Histórico de Reuniões" icon={Users}>
                <div className="pt-2">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="text-center p-4 rounded-xl bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/40 border border-border/50 hover:shadow-md transition-shadow">
                      <Users className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-blue-600">
                        {meetingStats.upcoming}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 font-medium">
                        Próximas
                      </p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900/30 dark:to-slate-800/30 border border-border/50 hover:shadow-md transition-shadow">
                      <Clock className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                      <div className="text-3xl font-bold text-muted-foreground">
                        {meetingStats.past}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 font-medium">
                        Realizadas
                      </p>
                    </div>
                  </div>
                  <div className="p-5 rounded-xl bg-linear-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-pink-950/30 border border-border/50 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-purple-600" />
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                        Total
                      </span>
                    </div>
                    <p className="text-4xl font-bold bg-linear-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {meetingStats.total}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1.5 font-medium">
                      reuniões registradas
                    </p>
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>

          {/* Instagram Feed (com Suspense fallback) */}
          <div>
            {/* <Suspense
                fallback={
                  <div className="grid grid-cols-3 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-24 rounded-lg bg-muted animate-pulse border border-border/50" />
                    ))}
                  </div>
                }
              >
                <InstagramGrid clientId={client.id} />
              </Suspense> */}
          </div>

          {/* Summary */}

        </div>
      </div>
    </ProtectedRoute>
  );
}
