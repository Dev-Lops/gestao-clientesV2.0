import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ClientHealthMetrics } from "@/features/clients/components";
import { ClientInfoDisplay } from "@/features/clients/components/ClientInfoDisplay";
import ContractManager from "@/features/clients/components/ContractManager";
import { InstallmentManager } from "@/features/clients/components/InstallmentManager";
import { PaymentStatusCard } from "@/features/payments/components/PaymentStatusCard";
import { InstagramGrid } from "@/features/social/InstagramGrid";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { getSessionProfile } from "@/services/auth/session";
import { getClientById } from "@/services/repositories/clients";
import type { Finance, Media, Meeting, Task } from "@prisma/client";
import {
  Clock,
  FileText,
  FolderKanban,
  Image as ImageIcon,
  Lightbulb,
  Users,
} from "lucide-react";

interface ClientInfoPageProps {
  params: Promise<{ id: string }>;
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  trend,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{value}</div>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          {trend && (
            <div
              className={`text-xs font-medium px-2 py-1 rounded ${
                trend === "up"
                  ? "bg-green-100 text-green-700"
                  : trend === "down"
                    ? "bg-red-100 text-red-700"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function ClientInfoPage({ params }: ClientInfoPageProps) {
  const { id } = await params;
  const { orgId, role } = await getSessionProfile();

  if (!role) return null;

  const client = await getClientById(id);

  if (!client || client.orgId !== orgId) {
    return null;
  }

  const base = process.env.NEXT_PUBLIC_APP_URL || "";

  interface ClientDashboard {
    counts: {
      tasks: {
        total: number;
        todo: number;
        inProgress: number;
        done: number;
        overdue: number;
      };
      finance: { income: number; expense: number; net: number };
      media: number;
      brandings: number;
      strategies: number;
    };
    meetings: Array<{
      id: string;
      title: string;
      startTime: string;
      description?: string;
    }>;
    urgentTasks: Array<{
      id: string;
      title: string;
      status: string;
      priority: string;
      dueDate: string | null;
      urgencyScore: number;
    }>;
  }

  let dash: ClientDashboard | null = null;
  try {
    const res = await fetch(`${base}/api/clients/${id}/dashboard`, {
      cache: "no-store",
    });
    if (res.ok) dash = (await res.json()) as ClientDashboard;
  } catch {}

  const isOwner = can(role, "update", "finance");
  const canViewAmounts = isOwner;

  // Buscar dados detalhados para os relatórios
  const [tasks, finances, media, meetings]: [
    Task[],
    Finance[],
    Media[],
    Meeting[],
  ] = await Promise.all([
    prisma.task.findMany({
      where: { clientId: id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.finance.findMany({
      where: { clientId: id },
      orderBy: { date: "desc" },
    }),
    prisma.media.findMany({ where: { clientId: id } }),
    prisma.meeting.findMany({
      where: { clientId: id },
      orderBy: { startTime: "desc" },
      take: 10,
    }),
  ]);

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(
      (t) => t.status === "done" || t.status === "completed",
    ).length,
    inProgress: tasks.filter(
      (t) => t.status === "in_progress" || t.status === "in-progress",
    ).length,
    pending: tasks.filter((t) => t.status === "todo" || t.status === "pending")
      .length,
    completionRate:
      tasks.length > 0
        ? Math.round(
            (tasks.filter(
              (t) => t.status === "done" || t.status === "completed",
            ).length /
              tasks.length) *
              100,
          )
        : 0,
  };

  const financeStats = {
    income: finances
      .filter((f) => f.type === "income")
      .reduce((sum, f) => sum + Number(f.amount), 0),
    expense: finances
      .filter((f) => f.type === "expense")
      .reduce((sum, f) => sum + Number(f.amount), 0),
    balance: 0,
    transactions: finances.length,
  };
  financeStats.balance = financeStats.income - financeStats.expense;

  const mediaStats = {
    total: media.length,
    images: media.filter((m) => m.type === "image").length,
    videos: media.filter((m) => m.type === "video").length,
    documents: media.filter((m) => m.type === "document").length,
  };

  const meetingStats = {
    total: meetings.length,
    upcoming: meetings.filter((m) => new Date(m.startTime) > new Date()).length,
    past: meetings.filter((m) => new Date(m.startTime) <= new Date()).length,
  };

  // Preparar métricas para o ClientHealthCard
  const healthMetrics: ClientHealthMetrics = {
    clientId: client.id,
    clientName: client.name,
    completionRate: dash?.counts.tasks.total
      ? Math.round((dash.counts.tasks.done / dash.counts.tasks.total) * 100)
      : 0,
    balance: dash?.counts.finance.net || 0,
    daysActive: client.created_at
      ? Math.floor(
          (new Date().getTime() - new Date(client.created_at).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0,
    tasksTotal: dash?.counts.tasks.total || 0,
    tasksCompleted: dash?.counts.tasks.done || 0,
    tasksPending: dash?.counts.tasks.todo || 0,
    tasksOverdue: dash?.counts.tasks.overdue || 0,
  };

  return (
    <ProtectedRoute>
      <div className="bg-background transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Grid Principal: Info + Métricas */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Coluna Esquerda: Informações Principais */}
            <div className="xl:col-span-2 space-y-8">
              {/* Card: Info do Cliente */}
              <ClientInfoDisplay client={client} canEdit={isOwner} />

              {/* Grid: Métricas Rápidas */}
              {dash && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-lg transition-all">
                    <CardContent className="pt-6 pb-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-3 rounded-xl bg-linear-to-r from-blue-500 to-cyan-600 shadow-lg">
                          <FolderKanban className="h-5 w-5 text-white" />
                        </div>
                        {dash.counts.tasks.overdue > 0 && (
                          <span className="text-xs font-semibold px-2 py-1 bg-red-100 text-red-700 rounded-full">
                            {dash.counts.tasks.overdue} atrasadas
                          </span>
                        )}
                      </div>
                      <p className="text-3xl font-bold text-foreground">
                        {dash.counts.tasks.total - dash.counts.tasks.done}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Tarefas ativas • {dash.counts.tasks.done} concluídas
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-lg transition-all">
                    <CardContent className="pt-6 pb-5">
                      <div className="p-3 rounded-xl bg-linear-to-r from-purple-500 to-pink-600 shadow-lg mb-3 w-fit">
                        <ImageIcon className="h-5 w-5 text-white" />
                      </div>
                      <p className="text-3xl font-bold text-foreground">
                        {dash.counts.media}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Arquivos de mídia
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-lg transition-all">
                    <CardContent className="pt-6 pb-5">
                      <div className="p-3 rounded-xl bg-linear-to-r from-amber-500 to-orange-600 shadow-lg mb-3 w-fit">
                        <Lightbulb className="h-5 w-5 text-white" />
                      </div>
                      <p className="text-3xl font-bold text-foreground">
                        {dash.counts.strategies}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Estratégias
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-lg transition-all">
                    <CardContent className="pt-6 pb-5">
                      <div className="p-3 rounded-xl bg-linear-to-r from-indigo-500 to-purple-600 shadow-lg mb-3 w-fit">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <p className="text-3xl font-bold text-foreground">
                        {dash.counts.brandings}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Materiais de branding
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
              {isOwner && (
                <ContractManager
                  clientId={client.id}
                  clientName={client.name}
                  contractStart={client.contract_start}
                  contractEnd={client.contract_end}
                  paymentDay={client.payment_day}
                  contractValue={client.contract_value}
                />
              )}
              {isOwner && (
                <PaymentStatusCard
                  clientId={client.id}
                  clientName={client.name}
                  canEdit={isOwner}
                />
              )}

              {isOwner && (
                <InstallmentManager clientId={client.id} canEdit={isOwner} />
              )}
            </div>
            <div className="space-y-6">
              {/* Metadata Card */}
              <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="bg-linear-to-r from-slate-50 to-slate-100/50 dark:from-slate-900/40 dark:to-slate-800/30 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-linear-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-md">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-lg">Metadados</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                        Criado em
                      </div>
                      <div className="text-sm font-semibold text-foreground">
                        {formatDate(client.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                        Última atualização
                      </div>
                      <div className="text-sm font-semibold text-foreground">
                        {formatDate(client.updated_at)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-linear-to-br from-indigo-50 to-purple-50/40 dark:from-indigo-900/40 dark:to-purple-900/30 border border-border/50">
                    <FileText className="h-4 w-4 text-indigo-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                        ID do Cliente
                      </div>
                      <div className="text-xs text-foreground font-mono bg-card px-2 py-1.5 rounded border border-border break-all">
                        {client.id}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Media Library Card */}
              <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="bg-linear-to-r from-purple-50 via-pink-50 to-indigo-50 dark:from-purple-950/30 dark:via-pink-950/30 dark:to-indigo-950/30 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-linear-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-md">
                      <ImageIcon className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-lg">
                      Biblioteca de Mídia
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
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
                  <div className="mt-4 p-4 rounded-lg bg-linear-to-r from-slate-50 to-slate-100 dark:from-slate-900/30 dark:to-slate-800/30 border border-border/50 text-center">
                    <p className="text-3xl font-bold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {mediaStats.total}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">
                      Total de arquivos
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Task Breakdown */}
              <Card className="border-border shadow-sm hover:shadow-lg transition-shadow">
                <CardHeader className="bg-linear-to-r from-blue-50 via-cyan-50 to-blue-50 dark:from-blue-950/30 dark:via-cyan-950/30 dark:to-blue-950/30 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-linear-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-md">
                      <FolderKanban className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        Desempenho de Tarefas
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {taskStats.total} tarefas no total
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-5">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        <span className="text-sm font-semibold text-muted-foreground">
                          Concluídas
                        </span>
                      </div>
                      <span className="text-sm font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                        {taskStats.completed}
                      </span>
                    </div>
                    <ProgressBar
                      value={taskStats.completed}
                      max={taskStats.total}
                      color="green"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        <span className="text-sm font-semibold text-muted-foreground">
                          Em Progresso
                        </span>
                      </div>
                      <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                        {taskStats.inProgress}
                      </span>
                    </div>
                    <ProgressBar
                      value={taskStats.inProgress}
                      max={taskStats.total}
                      color="blue"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                        <span className="text-sm font-semibold text-muted-foreground">
                          Pendentes
                        </span>
                      </div>
                      <span className="text-sm font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                        {taskStats.pending}
                      </span>
                    </div>
                    <ProgressBar
                      value={taskStats.pending}
                      max={taskStats.total}
                      color="amber"
                    />
                  </div>

                  <div className="pt-4 mt-4 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium">
                        Taxa de Conclusão
                      </span>
                      <span className="text-lg font-bold bg-linear-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        {taskStats.completionRate}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Meeting Stats */}
              <Card className="border-border shadow-sm hover:shadow-lg transition-shadow">
                <CardHeader className="bg-linear-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-pink-950/30 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-linear-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-md">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        Histórico de Reuniões
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Acompanhamento de meetings
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
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
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Instagram Feed */}
          <div>
            <InstagramGrid clientId={client.id} />
          </div>

          {/* Summary */}
          {isOwner && (
            <Card className="relative overflow-hidden border-2 border-border shadow-xl bg-card transition-colors">
              <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 bg-size-[200%_100%] animate-gradient" />
              <CardHeader>
                <CardTitle className="text-xl">Resumo Executivo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Status Geral do Projeto
                    </p>
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-3 w-3 rounded-full ${
                          taskStats.completionRate >= 75
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
                        className={`h-3 w-3 rounded-full ${
                          financeStats.balance >=
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
                    Cliente ativo há{" "}
                    <strong>{healthMetrics.daysActive} dias</strong> com{" "}
                    <strong>{taskStats.completionRate}%</strong> de taxa de
                    conclusão de tarefas.
                    {canViewAmounts ? (
                      financeStats.balance >= 0 ? (
                        <>
                          {" "}
                          Apresenta balanço financeiro positivo de{" "}
                          <strong>
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(financeStats.balance)}
                          </strong>
                          .
                        </>
                      ) : (
                        <>
                          {" "}
                          Atenção: balanço financeiro negativo de{" "}
                          <strong>
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(Math.abs(financeStats.balance))}
                          </strong>
                          .
                        </>
                      )
                    ) : financeStats.balance >= 0 ? (
                      <> Apresenta balanço financeiro positivo.</>
                    ) : (
                      <> Atenção: balanço financeiro negativo.</>
                    )}{" "}
                    Possui <strong>{mediaStats.total} arquivos</strong> na
                    biblioteca de mídia e{" "}
                    <strong>{meetingStats.total} reuniões</strong> registradas.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
