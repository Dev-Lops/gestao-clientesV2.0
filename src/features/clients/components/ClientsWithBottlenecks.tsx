"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { ClientHealthMetrics } from "./ClientHealthCard";

interface ClientsWithBottlenecksProps {
  clients: ClientHealthMetrics[];
  maxDisplay?: number;
  showOnlyIssues?: boolean; // quando false, mostra top N piores por score, mesmo sem issues
  canViewAmounts?: boolean;
}

export function ClientsWithBottlenecks({
  clients,
  maxDisplay = 5,
  showOnlyIssues = true,
  canViewAmounts = true,
}: ClientsWithBottlenecksProps) {
  // Ordenar clientes do pior para o melhor pela pontuação de saúde
  const sortedClients = [...clients].sort((a, b) => {
    const scoreA = calculateHealthScore(a);
    const scoreB = calculateHealthScore(b);
    return scoreA - scoreB;
  });

  // Lista filtrada conforme modo
  const filtered = showOnlyIssues
    ? sortedClients.filter((client) => getClientIssues(client).length > 0)
    : sortedClients;

  const clientsToShow = filtered.slice(0, maxDisplay);

  if (clientsToShow.length === 0) {
    return (
      <Card className="border-2 border-green-200/60 bg-linear-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20">
        <CardContent className="p-4 sm:p-6">
          <div className="text-center py-4 sm:py-6">
            <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-green-100 dark:bg-green-950/50 flex items-center justify-center mb-3">
              <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            </div>
            <p className="text-base sm:text-lg font-semibold text-green-900 dark:text-green-100 mb-1">
              Tudo em Ordem!
            </p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {showOnlyIssues
                ? "Nenhum cliente com gargalos detectados"
                : "Sem dados para exibir"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-red-200/60 bg-linear-to-br from-red-50/30 to-orange-50/30 dark:from-red-950/10 dark:to-orange-950/10">
      <CardHeader className="p-4 sm:p-6 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-red-600 to-orange-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg">
                Clientes Precisando de Atenção
              </CardTitle>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {clientsToShow.length}{" "}
                {clientsToShow.length === 1 ? "cliente" : "clientes"}{" "}
                {showOnlyIssues ? "com problemas" : "em destaque"}
              </p>
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 text-sm font-bold self-start sm:self-center">
            {clientsToShow.length}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="space-y-3">
          {clientsToShow.map((client) => {
            const score = calculateHealthScore(client);
            const issues = getClientIssues(client);
            const hasHigh = issues.some((i) => i.severity === "high");
            const hasMedium = issues.some((i) => i.severity === "medium");
            const chipClass = hasHigh
              ? "bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300"
              : hasMedium
                ? "bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300"
                : "bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-300";

            return (
              <Link
                key={client.clientId}
                href={`/clients/${client.clientId}/info`}
                className="block"
              >
                <div className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-4 border border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-700 hover:shadow-md transition-all group">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white truncate group-hover:text-red-600">
                        {client.clientName}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        {issues.length}{" "}
                        {issues.length === 1
                          ? "problema identificado"
                          : "problemas identificados"}
                      </p>
                    </div>
                    <div
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 ${chipClass}`}
                    >
                      {score}%
                    </div>
                  </div>

                  {/* Problemas */}
                  <div className="space-y-1.5">
                    {issues.map((issue, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 text-xs"
                      >
                        <div
                          className={`shrink-0 mt-0.5 ${issue.severity === "high" ? "text-red-600" : issue.severity === "medium" ? "text-orange-600" : "text-yellow-600"}`}
                        >
                          {issue.severity === "high" ? (
                            <XCircle className="w-3.5 h-3.5" />
                          ) : issue.severity === "medium" ? (
                            <AlertCircle className="w-3.5 h-3.5" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-700 dark:text-slate-300 line-clamp-1">
                            {!canViewAmounts &&
                            issue.message
                              .toLowerCase()
                              .startsWith("saldo negativo")
                              ? "Saldo negativo."
                              : issue.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span className="text-[10px] text-slate-600 dark:text-slate-400">
                          Pendentes
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {client.tasksPending}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <XCircle className="w-3 h-3 text-slate-500" />
                        <span className="text-[10px] text-slate-600 dark:text-slate-400">
                          Atrasadas
                        </span>
                      </div>
                      <p className="text-sm font-bold text-red-600">
                        {client.tasksOverdue}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <DollarSign className="w-3 h-3 text-slate-500" />
                        <span className="text-[10px] text-slate-600 dark:text-slate-400">
                          Saldo
                        </span>
                      </div>
                      <p
                        className={`text-sm font-bold ${client.balance >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {canViewAmounts
                          ? new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(client.balance)
                          : "••••"}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {filtered.length > maxDisplay && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 text-center">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Mostrando {clientsToShow.length} de {filtered.length}{" "}
              {showOnlyIssues ? "clientes com gargalos" : "clientes"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Função para calcular score de saúde
function calculateHealthScore(metrics: ClientHealthMetrics): number {
  let score = 0;

  // Taxa de conclusão (0-40 pontos)
  score += metrics.completionRate * 0.4;

  // Saldo financeiro (0-30 pontos)
  if (metrics.balance >= 5000) score += 30;
  else if (metrics.balance >= 0) score += 20;
  else if (metrics.balance >= -2000) score += 10;

  // Tarefas pendentes (0-30 pontos)
  const pendingRatio =
    metrics.tasksTotal > 0 ? metrics.tasksPending / metrics.tasksTotal : 0;
  if (pendingRatio <= 0.2) score += 30;
  else if (pendingRatio <= 0.4) score += 20;
  else if (pendingRatio <= 0.6) score += 10;

  return Math.round(score);
}

// Função para identificar problemas específicos
function getClientIssues(
  metrics: ClientHealthMetrics,
): Array<{ message: string; severity: "high" | "medium" | "low" }> {
  const issues: Array<{
    message: string;
    severity: "high" | "medium" | "low";
  }> = [];

  // Tarefas atrasadas
  const overdue = metrics.tasksOverdue ?? 0;
  if (overdue > 0) {
    issues.push({
      message: `${overdue} tarefa${overdue > 1 ? "s" : ""} atrasada${overdue > 1 ? "s" : ""}`,
      severity: overdue > 3 ? "high" : "medium",
    });
  }

  // Muitas tarefas pendentes
  const pendingRatio =
    metrics.tasksTotal > 0 ? metrics.tasksPending / metrics.tasksTotal : 0;
  if (pendingRatio > 0.6 && metrics.tasksPending > 5) {
    issues.push({
      message: `${Math.round(pendingRatio * 100)}% das tarefas pendentes (${metrics.tasksPending})`,
      severity: pendingRatio > 0.8 ? "high" : "medium",
    });
  }

  // Saldo negativo
  if (metrics.balance < 0) {
    issues.push({
      message: `Saldo negativo: R$ ${metrics.balance.toFixed(2)}`,
      severity: metrics.balance < -5000 ? "high" : "medium",
    });
  }

  // Taxa de conclusão baixa
  if (metrics.completionRate < 40 && metrics.tasksTotal > 3) {
    issues.push({
      message: `Taxa de conclusão baixa: ${metrics.completionRate.toFixed(0)}%`,
      severity: metrics.completionRate < 20 ? "high" : "low",
    });
  }

  // Sem tarefas concluídas
  if (metrics.tasksCompleted === 0 && metrics.tasksTotal > 5) {
    issues.push({
      message: "Nenhuma tarefa concluída",
      severity: "medium",
    });
  }

  return issues;
}
