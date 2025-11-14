"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Info,
} from "lucide-react";
import { useEffect, useState } from "react";
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
  clientId,
  clientName,
  canEdit = false,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<MonthlyPaymentStatus | null>(null);
  const [installments, setInstallments] = useState<InstallmentInfo[]>([]);
  const [showAllInstallments, setShowAllInstallments] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statusRes, installmentsRes] = await Promise.all([
        fetch(`/api/clients/${clientId}/payment`),
        fetch(`/api/clients/${clientId}/installments-v2`),
      ]);

      if (statusRes.ok) {
        const data = await statusRes.json();
        setStatus(data);
      }

      if (installmentsRes.ok) {
        const data = await installmentsRes.json();
        setInstallments(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error loading payment data:", error);
      toast.error("Erro ao carregar informações de pagamento");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [clientId]);

  const handleConfirmMonthly = async () => {
    if (!status || status.mode !== "monthly") return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/payment/confirm`, {
        method: "POST",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Falha ao confirmar pagamento");
      }

      toast.success("Pagamento mensal confirmado!");
      await loadData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao confirmar pagamento",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmInstallment = async (installmentId: string) => {
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/clients/${clientId}/installments-v2?installmentId=${installmentId}`,
        { method: "POST" },
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Falha ao confirmar parcela");
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
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12 text-slate-500">
          <Info className="h-5 w-5 mr-2" />
          Nenhuma informação de pagamento disponível
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = () => {
    if (status.isPaid) return "bg-green-50 border-green-200 text-green-700";
    if (status.isLate) return "bg-red-50 border-red-200 text-red-700";
    return "bg-amber-50 border-amber-200 text-amber-700";
  };

  const getStatusIcon = () => {
    if (status.isPaid)
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    if (status.isLate) return <AlertCircle className="h-5 w-5 text-red-600" />;
    return <Clock className="h-5 w-5 text-amber-600" />;
  };

  const getStatusLabel = () => {
    if (status.isPaid) return "Pago";
    if (status.isLate) return "Atrasado";
    return "Pendente";
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5 text-blue-600" />
            {status.mode === "monthly"
              ? "Pagamento Mensal"
              : "Pagamento Parcelado"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status principal */}
          <div className={`p-4 rounded-lg border-2 ${getStatusColor()}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon()}
                <div>
                  <div className="font-semibold text-sm">
                    {status.mode === "installment" &&
                    status.details.installments ? (
                      <>
                        {status.details.installments.total > 1
                          ? `${status.details.installments.total} parcelas este mês`
                          : "Parcela do mês"}
                      </>
                    ) : (
                      "Mensalidade"
                    )}
                  </div>
                  <div className="text-xs flex items-center gap-1.5 mt-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Vencimento: {formatDate(status.dueDate)}
                  </div>
                  {status.isPaid && status.paidAt && (
                    <div className="text-xs mt-1">
                      Pago em: {formatDate(status.paidAt)}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {formatCurrency(status.amount)}
                </div>
                <div className="text-xs font-medium capitalize">
                  {getStatusLabel()}
                </div>
              </div>
            </div>
          </div>

          {/* Informações adicionais */}
          {status.mode === "monthly" &&
            status.details.monthlyIncome !== undefined && (
              <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded">
                <div className="flex justify-between">
                  <span>Valor recebido este mês:</span>
                  <span className="font-medium">
                    {formatCurrency(status.details.monthlyIncome)}
                  </span>
                </div>
              </div>
            )}

          {status.mode === "installment" && status.details.installments && (
            <div className="text-sm space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Total de parcelas no mês:</span>
                <span className="font-medium">
                  {status.details.installments.total}
                </span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Parcelas pagas:</span>
                <span className="font-medium">
                  {status.details.installments.paid}
                </span>
              </div>
              <div className="flex justify-between text-amber-600">
                <span>Parcelas pendentes:</span>
                <span className="font-medium">
                  {status.details.installments.pending}
                </span>
              </div>
            </div>
          )}

          {/* Ação de confirmação */}
          {canEdit && !status.isPaid && (
            <div className="pt-2">
              {status.mode === "monthly" ? (
                <Button
                  onClick={handleConfirmMonthly}
                  disabled={submitting}
                  className="w-full"
                  size="lg"
                >
                  {submitting ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Confirmar Pagamento Mensal
                    </>
                  )}
                </Button>
              ) : (
                status.details.installments?.nextPendingId && (
                  <Button
                    onClick={() =>
                      handleConfirmInstallment(
                        status.details.installments!.nextPendingId!,
                      )
                    }
                    disabled={submitting}
                    className="w-full"
                    size="lg"
                  >
                    {submitting ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Confirmar Próxima Parcela
                      </>
                    )}
                  </Button>
                )
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de parcelas (se aplicável) */}
      {status.mode === "installment" && installments.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Todas as Parcelas</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllInstallments(!showAllInstallments)}
              >
                {showAllInstallments ? "Ocultar" : "Mostrar"}
              </Button>
            </div>
          </CardHeader>
          {showAllInstallments && (
            <CardContent>
              <div className="space-y-2">
                {installments.map((inst) => (
                  <div
                    key={inst.id}
                    className={`p-3 rounded-lg border flex items-center justify-between ${
                      inst.status === "CONFIRMED"
                        ? "bg-green-50 border-green-200"
                        : inst.status === "LATE"
                          ? "bg-red-50 border-red-200"
                          : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {inst.status === "CONFIRMED" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : inst.status === "LATE" ? (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-slate-400" />
                      )}
                      <div>
                        <div className="text-sm font-medium">
                          Parcela {inst.number}/{inst.totalInstallments}
                        </div>
                        <div className="text-xs text-slate-600">
                          {formatDate(inst.dueDate)}
                          {inst.paidAt &&
                            ` • Pago em ${formatDate(inst.paidAt)}`}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">
                        {formatCurrency(inst.amount)}
                      </div>
                      {canEdit && inst.status !== "CONFIRMED" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleConfirmInstallment(inst.id)}
                          disabled={submitting}
                          className="mt-1 h-7 text-xs"
                        >
                          Confirmar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
