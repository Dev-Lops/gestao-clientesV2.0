"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import {
  ClientHealthMetrics,
  ExtendedMetrics,
  GARGALO_META,
  getClientIssues,
} from "./ClientHealthCard";

type Props = {
  metrics: ClientHealthMetrics | ExtendedMetrics;
  canViewAmounts?: boolean;
};

export function ClientBottlenecksCard({
  metrics,
  canViewAmounts = true,
}: Props) {
  const issues = getClientIssues(metrics as ExtendedMetrics);

  return (
    <Card className="border border-red-200/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" /> Gargalos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {issues.length === 0 ? (
          <div className="text-sm text-slate-600">
            Nenhum gargalo detectado no momento.
          </div>
        ) : (
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
                      {issue.type === "balance" && !canViewAmounts
                        ? "O cliente está com saldo negativo."
                        : meta.description(issue)}
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
