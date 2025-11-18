"use client";
import { useState } from "react";

export function DeleteInvoiceButton({ invoiceId, onDeleted }: { invoiceId: string; onDeleted?: () => void }) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Tem certeza que deseja apagar esta fatura? Esta ação não pode ser desfeita.")) return;
    setLoading(true);
    const res = await fetch(`/api/billing/invoices/${invoiceId}`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) {
      if (onDeleted) {
        onDeleted();
      } else {
        // Redireciona para tela de faturas do cliente
        window.location.href = window.location.pathname.split("/invoices/")[0];
      }
    } else {
      alert("Erro ao apagar fatura.");
    }
  }

  return (
    <button
      type="button"
      className="px-3 py-2 rounded-md text-sm bg-red-700 hover:bg-red-800 text-white transition-all mt-3"
      onClick={handleDelete}
      disabled={loading}
    >
      {loading ? "Apagando..." : "Apagar fatura"}
    </button>
  );
}

// Botão para cancelar fatura (deve ser exportado no topo do módulo)
export function CancelInvoiceButton({ invoiceId, onCanceled }: { invoiceId: string; onCanceled?: () => void }) {
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    if (!confirm("Tem certeza que deseja cancelar esta fatura?")) return;
    setLoading(true);
    const res = await fetch(`/api/billing/invoices/${invoiceId}/cancel`, { method: "POST" });
    setLoading(false);
    if (res.ok) {
      if (onCanceled) {
        onCanceled();
      } else {
        window.location.reload();
      }
    } else {
      alert("Erro ao cancelar fatura.");
    }
  }

  return (
    <button
      type="button"
      className="px-3 py-2 rounded-md text-sm bg-yellow-600 hover:bg-yellow-700 text-white transition-all mt-3"
      onClick={handleCancel}
      disabled={loading}
    >
      {loading ? "Cancelando..." : "Cancelar fatura"}
    </button>
  );
}
