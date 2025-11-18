"use client";

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, Clock, Info } from "lucide-react";
import React, { useCallback, useState } from "react";
import { toast } from "sonner";

type MonthlyPaymentStatus = {
  mode: "monthly" | "installment";
  amount: number;
  isPaid: boolean;
  isLate: boolean;
  dueDate: string;
  paidAt: string | null;
  details: {
    monthlyIncome?: number;
    installments?: {
      total: number;
      paid: number;
      pending: number;
      nextPendingId?: string;
    };
  };
};

type InstallmentInfo = {
  id: string;
  number: number;
  totalInstallments: number;
  amount: number;
  dueDate: string;
  status: "PENDING" | "CONFIRMED" | "LATE";
  paidAt: string | null;
};

type Props = {
  clientId: string;
  clientName: string;
  canEdit?: boolean;
};

export function PaymentStatusCard({
  // ...código existente...
  clientId,
  clientName,
  canEdit = false,
}: Props) {
  // clientName currently unused in this component; keep for API compatibility
  void clientName;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<MonthlyPaymentStatus | null>(null);
  const [installments, setInstallments] = useState<InstallmentInfo[]>([]);
  const [showAllInstallments, setShowAllInstallments] = useState(false);

  const [authError, setAuthError] = useState<string | null>(null);
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setAuthError(null);
      const [statusRes, installmentsRes] = await Promise.all([
        fetch(`/api/clients/${clientId}/payment`, { credentials: "include" }),
        fetch(`/api/clients/${clientId}/installments`, { credentials: "include" }),
      ]);
      const statusJson = await statusRes.json();
      const installmentsJson = await installmentsRes.json();
      if (statusJson?.error === "Não autenticado") {
        setAuthError("Você precisa estar autenticado para visualizar o status do mês.");
        setStatus(null);
      } else {
        setStatus(statusJson || null);
      }
      // installmentsJson é um array diretamente
      setInstallments(Array.isArray(installmentsJson) ? installmentsJson : []);
    } catch {
      toast.error("Erro ao carregar dados de pagamento");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  // Carregar dados automaticamente na montagem do componente
  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleConfirmMonthly = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/payment`, { method: "POST" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Falha ao confirmar pagamento");
      }
      toast.success("Pagamento mensal confirmado!");
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao confirmar pagamento");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmInstallment = async (installmentId: string) => {
    setSubmitting(true);
    try {
      // Confirmar parcela usando PATCH (rota correta) e marcar como CONFIRMED
      const res = await fetch(
        `/api/clients/${clientId}/installments?installmentId=${installmentId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "CONFIRMED",
            paidAt: new Date().toISOString(),
            notes: "Confirmada via PaymentStatusCard",
          }),
        },
      );

      if (!res.ok) {
        let errorMsg = "Falha ao confirmar parcela";
        try {
          const error = await res.json();
          errorMsg = error.error || errorMsg;
        } catch {
          /* ignore parse error */
        }
        throw new Error(errorMsg);
      }

      toast.success("Parcela confirmada!");
      await loadData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao confirmar parcela",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const day = String(d.getUTCDate()).padStart(2, "0");
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const year = d.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="md" variant="primary" />
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex items-center gap-2 text-red-600 text-sm py-4">
        <Info className="h-4 w-4" />
        <span>{authError}</span>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="flex items-center gap-2 text-slate-500 text-sm py-4">
        <Info className="h-4 w-4" />
        <span>Nenhuma informação disponível</span>
      </div>
    );
  }

  const getStatusColor = () => {
    if (status.isPaid) return "bg-green-50 border-green-200 text-green-700";
    if (status.isLate) return "bg-red-50 border-red-200 text-red-700";
    return "bg-amber-50 border-amber-200 text-amber-700";
  };

  const getStatusLabel = () => {
    if (status.isPaid) return "Pago";
    if (status.isLate) return "Atrasado";
    return "Pendente";
  };

  return (
    <div className="space-y-4">
      {/* Card de destaque com informação da parcela/mensalidade */}
      <div className={`rounded-xl border overflow-hidden ${getStatusColor()}`}>
        <div className="p-5">
          {/* Header com título e badge de status */}
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-1">
              <div className="text-sm font-medium opacity-80">
                {status.mode === "installment" ? "Parcela do mês" : "Mensalidade"}
              </div>
              <div className="text-3xl font-bold">{formatCurrency(status.amount)}</div>
            </div>
            <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${status.isPaid ? 'bg-green-500 text-white' :
              status.isLate ? 'bg-red-500 text-white' :
                'bg-amber-500 text-white'
              }`}>
              {getStatusLabel()}
            </div>
          </div>

          {/* Info de vencimento */}
          <div className="flex items-center gap-2 text-sm opacity-80">
            <Clock className="h-4 w-4" />
            <span>Vencimento: {formatDate(status.dueDate)}</span>
          </div>
        </div>
      </div>

      {/* Resumo de estatísticas - só mostrar se for parcelado */}
      {status.mode === "installment" && status.details.installments && (
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-xs font-medium text-slate-500 mb-3">RESUMO DO MÊS</div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Total de parcelas no mês:</span>
              <span className="font-bold text-slate-900">{status.details.installments.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Parcelas pagas:</span>
              <span className="font-bold text-green-600">{status.details.installments.paid}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Parcelas pendentes:</span>
              <span className="font-bold text-amber-600">{status.details.installments.pending}</span>
            </div>
          </div>
        </div>
      )}
      {/* Ação de confirmação - apenas para modo mensal */}
      {canEdit && !status.isPaid && status.mode === "monthly" && (
        <div>
          <Button
            onClick={handleConfirmMonthly}
            disabled={submitting}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            {submitting ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Processando...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Confirmar Pagamento
              </>
            )}
          </Button>
        </div>
      )}
      {/* Lista de parcelas (se aplicável) */}
      {status.mode === "installment" && installments.length > 0 && (
        <div className="bg-white rounded-lg border p-5 space-y-3">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Todas as Parcelas</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllInstallments(!showAllInstallments)}
            >
              {showAllInstallments ? "Ocultar" : "Mostrar"}
            </Button>
          </div>
          {showAllInstallments && (
            <div className="space-y-2">
              {installments.map((inst) => (
                <div
                  key={inst.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-colors",
                    inst.status === "CONFIRMED" && "bg-green-50/50 border-green-200",
                    inst.status === "LATE" && "bg-red-50/50 border-red-200",
                    inst.status === "PENDING" && "bg-gray-50/50 border-gray-200"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center",
                      inst.status === "CONFIRMED" && "bg-green-500",
                      inst.status === "LATE" && "bg-red-500",
                      inst.status === "PENDING" && "bg-amber-500"
                    )}>
                      {inst.status === "CONFIRMED" && <CheckCircle2 className="h-4 w-4 text-white" />}
                      {inst.status === "LATE" && <AlertCircle className="h-4 w-4 text-white" />}
                      {inst.status === "PENDING" && <Clock className="h-4 w-4 text-white" />}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        Parcela {inst.number}/{inst.totalInstallments}
                      </div>
                      <div className="text-xs text-gray-600">
                        {formatDate(inst.dueDate)}
                        {inst.paidAt && ` • Pago em ${formatDate(inst.paidAt)}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <div className="text-base font-bold text-gray-900">{formatCurrency(inst.amount)}</div>
                      {canEdit && inst.status !== "CONFIRMED" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleConfirmInstallment(inst.id)}
                          disabled={submitting}
                          className="mt-1 h-7 text-xs hover:bg-green-50 hover:text-green-700"
                        >
                          Confirmar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
