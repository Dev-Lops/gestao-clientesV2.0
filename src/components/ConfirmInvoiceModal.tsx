"use client";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Client {
  id: string;
  name: string;
}

export function ConfirmInvoiceModal({ client, onCreated }: { client: Client; onCreated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleConfirm() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/clients/${client.id}/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        setOpen(false);
        toast.success("Fatura gerada com sucesso!");
        if (onCreated) onCreated();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Erro ao gerar fatura.");
      }
    } catch {
      toast.error("Erro ao conectar com o servidor");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        className="bg-linear-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all gap-2"
        onClick={() => setOpen(true)}
      >
        <FileText className="h-4 w-4" />
        Gerar Fatura
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full mx-4">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-linear-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                <FileText className="h-8 w-8 text-white" />
              </div>

              <div className="text-center space-y-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Confirmar Geração de Fatura
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Uma nova fatura será criada para:
                </p>
                <p className="text-base font-semibold text-slate-900 dark:text-white">
                  {client.name}
                </p>
              </div>

              <div className="w-full bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-slate-600 dark:text-slate-400 text-center">
                  A fatura será gerada com base no valor do contrato e vencimento configurado.
                </p>
              </div>

              <div className="flex gap-3 w-full mt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setOpen(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  onClick={handleConfirm}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Gerando...
                    </>
                  ) : (
                    "Confirmar"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}