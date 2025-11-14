"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ContractManagerProps {
  clientId: string;
  clientName: string;
  contractStart?: string | null;
  contractEnd?: string | null;
  paymentDay?: number | null;
  contractValue?: number | null;
  paymentStatus?: string;
}

export default function ContractManager({
  clientId,
  clientName,
  contractStart,
  contractEnd,
  paymentDay,
  contractValue,
  paymentStatus = "PENDING",
}: ContractManagerProps) {
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(paymentStatus);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Não definido";
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const formatCurrency = (value?: number | null) => {
    if (!value) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getPaymentStatusColor = () => {
    switch (currentStatus) {
      case "CONFIRMED":
        return "text-green-600 dark:text-green-400";
      case "LATE":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-yellow-600 dark:text-yellow-400";
    }
  };

  const getPaymentStatusIcon = () => {
    switch (currentStatus) {
      case "CONFIRMED":
        return <CheckCircle2 className="w-5 h-5" />;
      case "LATE":
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getPaymentStatusText = () => {
    switch (currentStatus) {
      case "CONFIRMED":
        return "Pago";
      case "LATE":
        return "Atrasado";
      default:
        return "Pendente";
    }
  };

  const handleConfirmPayment = async () => {
    if (!confirm(`Confirmar pagamento de ${clientName}?`)) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/clients/${clientId}/payments/confirm`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao confirmar pagamento");
      }

      setCurrentStatus("CONFIRMED");
      toast.success("Pagamento confirmado com sucesso!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao confirmar pagamento",
      );
    } finally {
      setLoading(false);
    }
  };

  // Check if contract is active
  const isContractActive = () => {
    if (!contractStart) return false;
    const now = new Date();
    const start = new Date(contractStart);
    if (now < start) return false;
    if (contractEnd) {
      const end = new Date(contractEnd);
      if (now > end) return false;
    }
    return true;
  };

  const getDaysUntilPayment = () => {
    if (!paymentDay) return null;
    const now = new Date();
    const currentDay = now.getDate();
    if (currentDay <= paymentDay) {
      return paymentDay - currentDay;
    }
    // Next month
    const nextMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      paymentDay,
    );
    const diff = Math.ceil(
      (nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    return diff;
  };

  const daysUntilPayment = getDaysUntilPayment();

  return (
    <div className="space-y-6">
      {/* Contract Status */}
      <div className="relative">
        <div className="absolute -inset-1 bg-linear-to-r from-blue-600 to-purple-600 rounded-3xl blur opacity-20" />
        <Card className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-linear-to-tr from-blue-600 to-purple-600 rounded-xl blur-md opacity-50" />
                <div className="relative w-10 h-10 bg-linear-to-tr from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
              </div>
              <span>Informações do Contrato</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Contract Dates */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Calendar className="w-4 h-4" />
                  <span>Início do Contrato</span>
                </div>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {formatDate(contractStart)}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Calendar className="w-4 h-4" />
                  <span>Término do Contrato</span>
                </div>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {contractEnd ? formatDate(contractEnd) : "Indeterminado"}
                </p>
              </div>
            </div>

            {/* Contract Value and Payment Day */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <DollarSign className="w-4 h-4" />
                  <span>Valor Mensal</span>
                </div>
                <p className="text-2xl font-bold bg-linear-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                  {formatCurrency(contractValue)}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Calendar className="w-4 h-4" />
                  <span>Dia de Pagamento</span>
                </div>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {paymentDay ? `Dia ${paymentDay}` : "Não definido"}
                </p>
              </div>
            </div>

            {/* Contract Status Badge */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Status do Contrato
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isContractActive()
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {isContractActive() ? "Ativo" : "Inativo"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Status */}
      {isContractActive() && (
        <div className="relative">
          <div className="absolute -inset-1 bg-linear-to-r from-green-600 to-emerald-600 rounded-3xl blur opacity-20" />
          <Card className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg">Pagamento do Mês Atual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`${getPaymentStatusColor()}`}>
                    {getPaymentStatusIcon()}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {getPaymentStatusText()}
                    </p>
                    {daysUntilPayment !== null &&
                      currentStatus === "PENDING" && (
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {daysUntilPayment === 0
                            ? "Vence hoje"
                            : daysUntilPayment > 0
                              ? `Vence em ${daysUntilPayment} ${daysUntilPayment === 1 ? "dia" : "dias"}`
                              : `Atrasado ${Math.abs(daysUntilPayment)} ${Math.abs(daysUntilPayment) === 1 ? "dia" : "dias"}`}
                        </p>
                      )}
                  </div>
                </div>

                {currentStatus === "PENDING" && (
                  <Button
                    onClick={handleConfirmPayment}
                    disabled={loading}
                    className="rounded-full bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/30"
                  >
                    {loading ? "Confirmando..." : "Confirmar Pagamento"}
                  </Button>
                )}

                {currentStatus === "CONFIRMED" && (
                  <div className="px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium">
                    Pago ✓
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!contractStart && (
        <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Nenhuma informação de contrato cadastrada. Edite o cliente para
                adicionar informações de contrato.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
