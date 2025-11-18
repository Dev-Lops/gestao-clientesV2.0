"use client";

import {
  AlertTriangle,
  Calendar,
  DollarSign,
  TrendingUp
} from "lucide-react";
import { useState } from "react";

interface ContractManagerProps {
  clientId: string;
  clientName: string;
  contractStart?: string | null;
  contractEnd?: string | null;
  paymentDay?: number | null;
  paymentDays?: number[];
  contractValue?: number | null;
  paymentStatus?: string;
}

export default function ContractManager({
  clientId,
  clientName,
  contractStart,
  contractEnd,
  paymentDay,
  paymentDays,
  contractValue,
  paymentStatus = "PENDING",
}: ContractManagerProps) {
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

  return (
    <div className="space-y-3">
      {/* Título com ícone */}
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-pink-600" />
        <span className="text-sm font-semibold text-pink-700">Informações do Contrato</span>
      </div>

      {/* Grid de informações */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Início</span>
          </div>
          <p className="text-sm font-semibold text-slate-900">{formatDate(contractStart)}</p>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Término</span>
          </div>
          <p className="text-sm font-semibold text-slate-900">{contractEnd ? formatDate(contractEnd) : "Não definido"}</p>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Valor Mensal</span>
          </div>
          <p className="text-base font-bold text-green-700">{formatCurrency(contractValue)}</p>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Dia{paymentDays && paymentDays.length > 1 ? 's' : ''} de Pagamento</span>
          </div>
          <p className="text-sm font-semibold text-slate-900">
            {paymentDays && paymentDays.length > 0
              ? paymentDays.map(d => `Dia ${d}`).join(', ')
              : paymentDay
                ? `Dia ${paymentDay}`
                : "Não definido"}
          </p>
        </div>
      </div>

      {/* Status do contrato */}
      <div className="pt-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Status do Contrato</span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${isContractActive() ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
            {isContractActive() ? "Ativo" : "Inativo"}
          </span>
        </div>
      </div>



      {/* Aviso de contrato não cadastrado */}
      {!contractStart && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mt-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          <p className="text-sm text-yellow-800 dark:text-yellow-200">Nenhuma informação de contrato cadastrada. Edite o cliente para adicionar informações de contrato.</p>
        </div>
      )}
    </div>
  );
}
