"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  CheckCircle,
  Clock,
  Percent,
  TrendingDown,
  TrendingDown as TrendingDownIcon,
  TrendingUp,
  XCircle,
} from "lucide-react";

export interface ClientHealthMetrics {
  clientId: string;
  clientName: string;
  completionRate: number;
  balance: number;
  daysActive: number;
  tasksTotal: number;
  tasksCompleted: number;
  tasksPending: number;
  tasksOverdue?: number;
}

interface ClientHealthCardProps {
  metrics: ClientHealthMetrics;
  variant?: "compact" | "detailed";
  onClientClick?: (clientId: string) => void;
  canViewAmounts?: boolean;
}

export function ClientHealthCard({
  metrics,
  variant = "detailed",
  onClientClick,
  canViewAmounts = true,
}: ClientHealthCardProps) {
  // Calcular indicadores de saúde
  const healthScore = calculateHealthScore(metrics);
  const issues = getClientIssues(metrics);
  const status = getHealthStatus(healthScore);

  const handleClick = () => {
    if (onClientClick) {
      onClientClick(metrics.clientId);
    }
  };

  if (variant === "compact") {
    return (
      <Card
        className={`relative overflow-hidden border-2 transition-all duration-200 hover:shadow-lg ${
          onClientClick ? "cursor-pointer hover:-translate-y-1" : ""
        } ${getStatusBorderColor(status)}`}
        onClick={handleClick}
      >
        <div
          className={`absolute top-0 left-0 w-full h-1 ${getStatusGradient(status)}`}
        />
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                {metrics.clientName}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {metrics.daysActive} dias ativo
              </p>
            </div>
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(status)}`}
            >
              {status === "critical" && <AlertTriangle className="h-3 w-3" />}
              {status === "warning" && <TrendingDown className="h-3 w-3" />}
              {status === "good" && <TrendingUp className="h-3 w-3" />}
              {status === "excellent" && <CheckCircle className="h-3 w-3" />}
              <span>{healthScore}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
              <div className="text-lg font-bold text-blue-600">
                {metrics.completionRate}%
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Conclusão
              </p>
            </div>
            <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
              <div
                className={`text-lg font-bold ${metrics.balance >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {canViewAmounts
                  ? new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(metrics.balance)
                  : "••••"}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Saldo
              </p>
            </div>
            <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
              <div className="text-lg font-bold text-amber-600">
                {metrics.tasksPending}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Pendentes
              </p>
            </div>
          </div>

          {issues.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-1.5 text-xs">
                {issues[0].severity === "high" ? (
                  <XCircle className="h-3 w-3 text-red-600" />
                ) : issues[0].severity === "medium" ? (
                  <AlertCircle className="h-3 w-3 text-orange-600" />
                ) : (
                  <AlertTriangle className="h-3 w-3 text-yellow-600" />
                )}
                <span
                  className={`font-medium truncate ${
                    issues[0].severity === "high"
                      ? "text-red-600 dark:text-red-400"
                      : issues[0].severity === "medium"
                        ? "text-orange-600 dark:text-orange-400"
                        : "text-yellow-700 dark:text-yellow-400"
                  }`}
                >
                  {issues[0].type === "balance" && !canViewAmounts
                    ? "O cliente está com saldo negativo."
                    : issues[0].message}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`relative overflow-hidden border-2 shadow-xl ${getStatusBorderColor(status)}`}
    >
      <div
        className={`absolute top-0 left-0 w-full h-2 ${getStatusGradient(status)}`}
      />
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">{metrics.clientName}</CardTitle>
            <p className="text-sm text-slate-500 mt-1">
              Cliente há {metrics.daysActive} dias
            </p>
          </div>
          <div
            className={`px-4 py-2 rounded-full text-sm font-bold ${getStatusBadgeColor(status)}`}
          >
            Score: {healthScore}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Métricas principais */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-200">
            <div className="text-3xl font-bold text-blue-600">
              {metrics.completionRate}%
            </div>
            <p className="text-xs text-slate-600 mt-1">Taxa de Conclusão</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {metrics.tasksCompleted}/{metrics.tasksTotal}
            </p>
          </div>
          <div
            className={`text-center p-4 rounded-lg border ${
              metrics.balance >= 0
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div
              className={`text-2xl font-bold ${metrics.balance >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {canViewAmounts
                ? new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(metrics.balance)
                : "••••"}
            </div>
            <p className="text-xs text-slate-600 mt-1">Balanço</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-amber-50 border border-amber-200">
            <div className="text-3xl font-bold text-amber-600">
              {metrics.tasksPending}
            </div>
            <p className="text-xs text-slate-600 mt-1">Tarefas Pendentes</p>
          </div>
        </div>

        {/* Status geral */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Status Geral</p>
          <div className="flex items-center gap-2">
            <div
              className={`h-3 w-3 rounded-full ${getStatusDotColor(status)}`}
            />
            <span className="text-base font-semibold text-slate-900">
              {getStatusLabel(status)}
            </span>
          </div>
        </div>

        {/* Alertas de Gargalo */}
        {issues.length > 0 && (
          <div className="space-y-3">
            {issues.map((issue, idx) => {
              const meta = GARGALO_META[issue.type];
              return (
                <div
                  key={idx}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${meta.color} ${issue.severity === "high" ? "border-2 border-red-400" : "border"} shadow-sm`}
                >
                  <div className="shrink-0 mt-0.5">{meta.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${meta.color}`}
                      >
                        {meta.label}
                      </span>
                      {issue.severity === "high" && (
                        <span className="text-xs text-red-600 font-bold">
                          Crítico
                        </span>
                      )}
                      {issue.severity === "medium" && (
                        <span className="text-xs text-orange-600 font-bold">
                          Atenção
                        </span>
                      )}
                      {issue.severity === "low" && (
                        <span className="text-xs text-yellow-700 font-bold">
                          Baixo
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                      {meta.description(issue)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Funções auxiliares
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

// Identificar problemas específicos com severidade
export type Gargalo = {
  type:
    | "overdue"
    | "pending"
    | "balance"
    | "completion"
    | "noneDone"
    | "paymentLate"
    | "meetingMissed"
    | "installmentLate";
  message: string;
  severity: "high" | "medium" | "low";
  action?: string;
  amount?: number;
  count?: number;
};

export const GARGALO_META: Record<
  Gargalo["type"],
  {
    label: string;
    icon: React.ReactNode;
    color: string;
    description: (g: Gargalo) => string;
    actionLabel?: string;
  }
> = {
  overdue: {
    label: "Atraso",
    icon: <Clock className="h-4 w-4" />,
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    description: (g) => `Existem tarefas atrasadas. ${g.message}`,
    actionLabel: "Ver tarefas",
  },
  pending: {
    label: "Pendências",
    icon: <AlertOctagon className="h-4 w-4" />,
    color:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    description: (g) => `Muitas tarefas pendentes. ${g.message}`,
    actionLabel: "Ver pendências",
  },
  balance: {
    label: "Saldo Negativo",
    icon: <TrendingDownIcon className="h-4 w-4" />,
    color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    description: (g) => `O cliente está com saldo negativo. ${g.message}`,
    actionLabel: "Ver financeiro",
  },
  completion: {
    label: "Baixa Conclusão",
    icon: <Percent className="h-4 w-4" />,
    color:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    description: (g) => `A taxa de conclusão está baixa. ${g.message}`,
    actionLabel: "Ver tarefas",
  },
  noneDone: {
    label: "Sem Progresso",
    icon: <AlertCircle className="h-4 w-4" />,
    color: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    description: () => `Nenhuma tarefa foi concluída ainda.`,
    actionLabel: "Criar tarefa",
  },
  paymentLate: {
    label: "Pagamento Atrasado",
    icon: <TrendingDown className="h-4 w-4" />,
    color: "bg-red-200 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    description: (g) => `Pagamento pendente ou atrasado. ${g.message}`,
    actionLabel: "Cobrar pagamento",
  },
  meetingMissed: {
    label: "Reunião Não Realizada",
    icon: <AlertTriangle className="h-4 w-4" />,
    color:
      "bg-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    description: (g) => `Reunião marcada não foi realizada. ${g.message}`,
    actionLabel: "Remarcar reunião",
  },
  installmentLate: {
    label: "Parcela em Atraso",
    icon: <XCircle className="h-4 w-4" />,
    color: "bg-rose-200 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
    description: (g) => `Existem parcelas em atraso. ${g.message}`,
    actionLabel: "Ver parcelas",
  },
};

export type ExtendedMetrics = ClientHealthMetrics & {
  paymentsLate?: number;
  meetingsMissed?: number;
  installmentsLate?: number;
};

export function getClientIssues(metrics: ExtendedMetrics): Gargalo[] {
  const rules: Array<{
    type: Gargalo["type"];
    check: (metrics: ExtendedMetrics) => {
      active: boolean;
      message: string;
      severity: Gargalo["severity"];
      action?: string;
      amount?: number;
      count?: number;
    };
  }> = [
    {
      type: "overdue",
      check: (m) => {
        const overdue = m.tasksOverdue ?? 0;
        return {
          active: overdue > 0,
          message: `${overdue} tarefa${overdue > 1 ? "s" : ""} atrasada${overdue > 1 ? "s" : ""}`,
          severity: overdue > 3 ? "high" : overdue > 0 ? "medium" : "low",
          action: "Ver tarefas",
          count: overdue,
        };
      },
    },
    {
      type: "pending",
      check: (m) => {
        const pendingRatio =
          m.tasksTotal > 0 ? m.tasksPending / m.tasksTotal : 0;
        return {
          active: pendingRatio > 0.6 && m.tasksPending > 5,
          message: `${Math.round(pendingRatio * 100)}% das tarefas pendentes (${m.tasksPending})`,
          severity:
            pendingRatio > 0.8 ? "high" : pendingRatio > 0.6 ? "medium" : "low",
          action: "Ver pendências",
          count: m.tasksPending,
        };
      },
    },
    {
      type: "balance",
      check: (m) => {
        return {
          active: m.balance < 0,
          message: `Saldo negativo: ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(m.balance)}`,
          severity:
            m.balance < -5000 ? "high" : m.balance < 0 ? "medium" : "low",
          action: "Ver financeiro",
          amount: m.balance,
        };
      },
    },
    {
      type: "completion",
      check: (m) => {
        return {
          active: m.completionRate < 40 && m.tasksTotal > 3,
          message: `Taxa de conclusão baixa: ${m.completionRate.toFixed(0)}%`,
          severity:
            m.completionRate < 20
              ? "high"
              : m.completionRate < 40
                ? "low"
                : "medium",
          action: "Ver tarefas",
        };
      },
    },
    {
      type: "noneDone",
      check: (m) => {
        return {
          active: m.tasksCompleted === 0 && m.tasksTotal > 5,
          message: "Nenhuma tarefa concluída",
          severity: "medium",
          action: "Criar tarefa",
        };
      },
    },
    {
      type: "paymentLate",
      check: (m) => {
        const late = m.paymentsLate ?? 0;
        return {
          active: late > 0,
          message: `${late} pagamento${late > 1 ? "s" : ""} pendente${late > 1 ? "s" : ""}`,
          severity: late > 2 ? "high" : "medium",
          action: "Cobrar pagamento",
          count: late,
        };
      },
    },
    {
      type: "meetingMissed",
      check: (m) => {
        const missed = m.meetingsMissed ?? 0;
        return {
          active: missed > 0,
          message: `${missed} reunião${missed > 1 ? "s" : ""} não realizada${missed > 1 ? "s" : ""}`,
          severity: missed > 2 ? "high" : "medium",
          action: "Remarcar reunião",
          count: missed,
        };
      },
    },
    {
      type: "installmentLate",
      check: (m) => {
        const late = m.installmentsLate ?? 0;
        return {
          active: late > 0,
          message: `${late} parcela${late > 1 ? "s" : ""} em atraso`,
          severity: late > 2 ? "high" : "medium",
          action: "Ver parcelas",
          count: late,
        };
      },
    },
  ];

  return rules
    .map((rule) => {
      const res = rule.check(metrics);
      return res.active
        ? {
            type: rule.type,
            message: res.message,
            severity: res.severity,
            action: res.action,
            amount: res.amount,
            count: res.count,
          }
        : null;
    })
    .filter(Boolean) as Gargalo[];
}

function getHealthStatus(
  score: number,
): "critical" | "warning" | "good" | "excellent" {
  if (score >= 80) return "excellent";
  if (score >= 60) return "good";
  if (score >= 40) return "warning";
  return "critical";
}

function getStatusLabel(status: string): string {
  const labels = {
    excellent: "Excelente",
    good: "Bom",
    warning: "Atenção Necessária",
    critical: "Crítico",
  };
  return labels[status as keyof typeof labels] || "Desconhecido";
}

function getStatusBorderColor(status: string): string {
  const colors = {
    excellent: "border-green-200/60 shadow-green-200/50",
    good: "border-blue-200/60 shadow-blue-200/50",
    warning: "border-amber-200/60 shadow-amber-200/50",
    critical: "border-red-200/60 shadow-red-200/50",
  };
  return colors[status as keyof typeof colors] || "border-slate-200/60";
}

function getStatusGradient(status: string): string {
  const gradients = {
    excellent: "bg-linear-to-r from-green-500 to-emerald-500",
    good: "bg-linear-to-r from-blue-500 to-cyan-500",
    warning: "bg-linear-to-r from-amber-500 to-orange-500",
    critical: "bg-linear-to-r from-red-500 to-rose-500",
  };
  return (
    gradients[status as keyof typeof gradients] ||
    "bg-linear-to-r from-slate-500 to-slate-600"
  );
}

function getStatusBadgeColor(status: string): string {
  const colors = {
    excellent:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    good: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    warning:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
  return colors[status as keyof typeof colors] || "bg-slate-100 text-slate-700";
}

function getStatusDotColor(status: string): string {
  const colors = {
    excellent: "bg-green-500",
    good: "bg-blue-500",
    warning: "bg-amber-500",
    critical: "bg-red-500",
  };
  return colors[status as keyof typeof colors] || "bg-slate-500";
}
