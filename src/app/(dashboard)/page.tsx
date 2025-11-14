"use client";

import AppShell from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card } from "@/components/ui/card";
import {
  ClientsWithBottlenecks,
  type ClientHealthMetrics,
} from "@/features/clients/components";
import { MonthlyCalendar } from "@/features/dashboard/components/MonthlyCalendar";
import { can, type AppRole } from "@/lib/permissions";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  ListTodo,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface DashboardData {
  clients: Array<{
    id: string;
    name: string;
    email: string | null;
    createdAt: Date;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    description: string | null;
    createdAt: Date;
    priority: string;
    dueDate: Date | null;
    client: {
      id: string;
      name: string;
    };
  }>;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  metrics?: {
    totals: { clients: number; tasks: number };
    mostPendingClient: {
      clientId: string;
      pending: number;
      name: string;
    } | null;
    mostUrgentClient: { clientId: string; urgent: number; name: string } | null;
    urgentTasks: Array<{
      id: string;
      title: string;
      status: string;
      priority: string;
      dueDate: Date | null;
      urgencyScore: number;
      client: { id: string; name: string };
    }>;
  };
  clientsHealth?: ClientHealthMetrics[];
  activities?: Array<{
    id: string;
    title: string;
    type: "meeting" | "task";
    date: Date;
    clientId: string;
    clientName: string;
    status?: string;
  }>;
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <RealtimeDashboard />
      </AppShell>
    </ProtectedRoute>
  );
}

function RealtimeDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnlyIssues, setShowOnlyIssues] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [monthKey, setMonthKey] = useState<string>(() => {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    return `${now.getFullYear()}-${mm}`;
  });
  const searchParams = useSearchParams();

  useEffect(() => {
    // sync from URL on mount / changes
    const m = searchParams?.get("month");
    if (m && m !== monthKey) {
      setMonthKey(m);
    }
  }, [searchParams, monthKey]);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await fetch(
          `/api/dashboard?month=${encodeURIComponent(monthKey)}`,
        );
        if (!res.ok) {
          throw new Error("Falha ao carregar dashboard");
        }
        const json = await res.json();
        setData(json);
        // Fetch role from session to control financial visibility
        const sess = await fetch("/api/session");
        if (sess.ok) {
          const sjson = await sess.json();
          setRole(sjson.role || null);
        }
      } catch {
        setError("Não foi possível carregar os dados.");
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, [monthKey]);

  if (loading) {
    return (
      <div className="relative flex min-h-[70vh] items-center justify-center">
        <div className="absolute inset-0 bg-linear-to-br from-blue-50 via-purple-50/30 to-pink-50 dark:from-slate-950 dark:via-purple-950/20 dark:to-slate-900" />
        <div className="relative flex flex-col items-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-linear-to-tr from-blue-500 via-purple-500 to-pink-500 opacity-30 blur-2xl animate-pulse" />
            <div className="relative h-20 w-20 rounded-full border-4 border-t-transparent border-r-transparent border-blue-600 dark:border-blue-400 animate-spin" />
          </div>
          <div className="space-y-2 text-center">
            <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
              Carregando Dashboard
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Preparando suas métricas e insights...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-10 text-center">
        <p className="text-red-600 font-medium mb-4">
          {error || "Erro desconhecido"}
        </p>
        <button
          onClick={() => router.push("/login")}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Voltar ao login
        </button>
      </div>
    );
  }

  const { clients, tasks } = data;

  // Cálculos derivados com fix status
  const isPendingStatus = (s: string) => s === "pending" || s === "todo";
  const isInProgressStatus = (s: string) =>
    s === "in_progress" || s === "in-progress";
  const isDoneStatus = (s: string) => s === "done" || s === "completed";

  const pendingTasks = tasks.filter((t) => isPendingStatus(t.status));
  const inProgressTasks = tasks.filter((t) => isInProgressStatus(t.status));
  const completedTasks = tasks.filter((t) => isDoneStatus(t.status));
  const priorities = pendingTasks.slice(0, 6);

  const metrics = data.metrics;

  return (
    <motion.div
      className="space-y-6 p-4 sm:p-6 lg:p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* HEADER PROFISSIONAL COM GRADIENTE */}
      <header className="relative overflow-hidden rounded-2xl bg-linear-to-br from-blue-600 via-purple-600 to-pink-600 p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3"
            >
              <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold">
                  Painel de Gestão
                </h1>
                <p className="text-sm sm:text-base text-blue-100 mt-1">
                  Olá, {data.user.name || "Usuário"}! Aqui está um resumo do seu
                  negócio
                </p>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30">
              <p className="text-xs font-medium">
                {new Date().toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
            </div>
          </motion.div>
        </div>
      </header>

      {/* KPIs PRINCIPAIS COM ANIMAÇÃO */}
      <section className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          iconColor="from-blue-500 to-cyan-500"
          label="Total de Clientes"
          value={clients.length.toString()}
          trend={clients.length > 0 ? "+12%" : "0%"}
          trendUp={true}
          description="Clientes ativos"
          delay={0.1}
        />
        <StatCard
          icon={ListTodo}
          iconColor="from-amber-500 to-orange-500"
          label="Tarefas Pendentes"
          value={pendingTasks.length.toString()}
          trend={`${pendingTasks.length} aguardando`}
          trendUp={false}
          description="Requerem atenção"
          delay={0.2}
        />
        <StatCard
          icon={Activity}
          iconColor="from-purple-500 to-pink-500"
          label="Em Progresso"
          value={inProgressTasks.length.toString()}
          trend={`${Math.round((inProgressTasks.length / Math.max(tasks.length, 1)) * 100)}%`}
          trendUp={true}
          description="Do total de tarefas"
          delay={0.3}
        />
        <StatCard
          icon={CheckCircle2}
          iconColor="from-emerald-500 to-green-500"
          label="Concluídas"
          value={completedTasks.length.toString()}
          trend={`${Math.round((completedTasks.length / Math.max(tasks.length, 1)) * 100)}%`}
          trendUp={true}
          description="Taxa de conclusão"
          delay={0.4}
        />
      </section>

      {/* Layout em 2 colunas para desktop: Calendário maior à esquerda, Cards menores à direita */}
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        {/* Coluna do Calendário (60% - 3fr) */}
        <div className="space-y-6">
          {/* Calendário Mensal */}
          {data.activities && (
            <Card className="overflow-hidden border-slate-200 dark:border-slate-700 shadow-xl">
              <div className="bg-linear-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-b border-slate-200 dark:border-slate-700 p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Calendário
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Reuniões e tarefas
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <MonthlyCalendar
                  key={monthKey}
                  activities={data.activities}
                  initialMonth={(() => {
                    const [y, m] = monthKey.split("-").map((n) => Number(n));
                    return new Date(y, (m || 1) - 1, 1);
                  })()}
                  onMonthChange={(d) => {
                    const mm = String(d.getMonth() + 1).padStart(2, "0");
                    const value = `${d.getFullYear()}-${mm}`;
                    setMonthKey(value);
                    try {
                      const url = new URL(window.location.href);
                      url.searchParams.set("month", value);
                      window.history.replaceState(null, "", url.toString());
                    } catch {}
                  }}
                />
              </div>
            </Card>
          )}
        </div>

        {/* Coluna dos Cards (40% - 2fr) */}
        <div className="space-y-6">
          {/* Clientes com Gargalos */}
          {(role
            ? can(role as unknown as AppRole, "update", "finance")
            : false) &&
            data.clientsHealth &&
            data.clientsHealth.length > 0 && (
              <Card className="overflow-hidden border-slate-200 dark:border-slate-700 shadow-xl">
                <div className="bg-linear-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-800/50 border-b border-slate-200 dark:border-slate-700 p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-linear-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                          Clientes
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                          Monitoramento de saúde e gargalos
                        </p>
                      </div>
                    </div>
                    <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-1 bg-white dark:bg-slate-800">
                      <button
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                          showOnlyIssues
                            ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                        }`}
                        onClick={() => setShowOnlyIssues(true)}
                      >
                        <AlertCircle className="h-3 w-3 inline mr-1" />
                        Com problemas
                      </button>
                      <button
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                          !showOnlyIssues
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                        }`}
                        onClick={() => setShowOnlyIssues(false)}
                      >
                        Todos
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <ClientsWithBottlenecks
                    clients={data.clientsHealth}
                    maxDisplay={3}
                    showOnlyIssues={showOnlyIssues}
                    canViewAmounts={true}
                  />
                </div>
              </Card>
            )}{" "}
          {/* Tarefas Urgentes */}
          {metrics && metrics.urgentTasks.length > 0 && (
            <Card className="overflow-hidden border-slate-200 dark:border-slate-700 shadow-xl">
              <div className="bg-linear-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border-b border-slate-200 dark:border-slate-700 p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-linear-to-br from-red-500 to-orange-500 flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        Tarefas Urgentes
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        Requerem atenção imediata
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs font-semibold">
                    {metrics.urgentTasks.length} urgentes
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  {metrics.urgentTasks.slice(0, 4).map((t) => (
                    <Link
                      key={t.id}
                      href={`/clients/${t.client.id}`}
                      className="block p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-700 hover:shadow-md transition-all bg-white dark:bg-slate-800 group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-4 w-4 text-red-500 shrink-0" />
                            <h4 className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 truncate">
                              {t.title}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                            {t.client.name}
                          </p>
                          <div className="flex items-center gap-4 text-xs">
                            <span className="flex items-center gap-1 text-slate-500">
                              <Activity className="h-3 w-3" />
                              Score: {t.urgencyScore.toFixed(0)}
                            </span>
                            {t.dueDate && (
                              <span className="flex items-center gap-1 text-slate-500">
                                <Calendar className="h-3 w-3" />
                                {new Date(t.dueDate).toLocaleDateString(
                                  "pt-BR",
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs font-medium uppercase">
                          {t.priority}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </Card>
          )}
          {/* Tarefas Pendentes */}
          {priorities.length > 0 && (
            <Card className="overflow-hidden border-slate-200 dark:border-slate-700 shadow-xl">
              <div className="bg-linear-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border-b border-slate-200 dark:border-slate-700 p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-linear-to-br from-amber-500 to-yellow-500 flex items-center justify-center">
                      <ListTodo className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        Tarefas Pendentes
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        Aguardando início
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/clients"
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                  >
                    Ver todas
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
              <div className="p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {priorities.slice(0, 6).map((task) => (
                    <Link
                      key={task.id}
                      href={`/clients/${task.client.id}`}
                      className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-md transition-all bg-white dark:bg-slate-800 group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 line-clamp-1">
                          {task.title}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[10px] font-medium uppercase whitespace-nowrap">
                          {task.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {task.client.name}
                      </p>
                      {task.dueDate && (
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-2 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(task.dueDate).toLocaleDateString("pt-BR")}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            </Card>
          )}
          {/* Quick Stats */}
          {metrics && (
            <Card className="overflow-hidden border-slate-200 dark:border-slate-700 shadow-xl">
              <div className="bg-linear-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-b border-slate-200 dark:border-slate-700 p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-linear-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Resumo
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Visão geral rápida
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-4">
                {metrics.mostPendingClient && (
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-xs font-medium text-amber-900 dark:text-amber-100">
                        Mais Tarefas Pendentes
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {metrics.mostPendingClient.name}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {metrics.mostPendingClient.pending} tarefas
                    </p>
                  </div>
                )}

                {metrics.mostUrgentClient && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <span className="text-xs font-medium text-red-900 dark:text-red-100">
                        Mais Tarefas Urgentes
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {metrics.mostUrgentClient.name}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {metrics.mostUrgentClient.urgent} urgentes
                    </p>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {metrics.totals.clients}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Clientes
                      </p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {metrics.totals.tasks}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Tarefas
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface StatCardProps {
  icon: LucideIcon;
  iconColor: string;
  label: string;
  value: string;
  trend: string;
  trendUp: boolean;
  description: string;
  delay: number;
}

function StatCard({
  icon: Icon,
  iconColor,
  label,
  value,
  trend,
  trendUp,
  description,
  delay,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Card className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-xl transition-all duration-300 group">
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br ${iconColor} shadow-lg group-hover:scale-110 transition-transform duration-300`}
            >
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div
              className={`flex items-center gap-1 text-xs font-semibold ${trendUp ? "text-green-600 dark:text-green-400" : "text-slate-500 dark:text-slate-400"}`}
            >
              {trendUp && <ArrowUpRight className="h-3 w-3" />}
              <span>{trend}</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {value}
            </p>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {label}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {description}
            </p>
          </div>
        </div>
        <div
          className={`absolute bottom-0 left-0 h-1 w-full bg-linear-to-r ${iconColor} opacity-50`}
        />
      </Card>
    </motion.div>
  );
}
