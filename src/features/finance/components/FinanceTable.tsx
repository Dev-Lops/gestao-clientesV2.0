"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FinanceEditModal } from "@/features/finance/components/FinanceEditModal";
import { formatBRL, formatDateBR } from "@/lib/format";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface FinanceRow {
  id: string;
  date: Date;
  type: string;
  amount: number;
  category: string | null;
  description: string | null;
  client: { name: string } | null;
  clientId: string | null;
}

interface FinanceTableProps {
  rows: FinanceRow[];
}

export function FinanceTable({ rows }: FinanceTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const toggleSelectAll = () => {
    if (selected.size === rows.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(rows.map((r) => r.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;

    const confirmed = confirm(
      `Tem certeza que deseja excluir ${selected.size} transação(ões)?`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const response = await fetch("/api/finance/bulk-delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });

      if (!response.ok) {
        throw new Error("Falha ao excluir transações");
      }

      const result = await response.json();
      toast.success(`${result.deleted} transação(ões) excluída(s) com sucesso!`);
      setSelected(new Set());

      // Recarregar página
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("Error deleting transactions:", error);
      toast.error("Erro ao excluir transações");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-3">
      {selected.size > 0 && (
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
          <span className="text-sm font-medium">
            {selected.size} transação(ões) selecionada(s)
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isDeleting ? "Excluindo..." : "Excluir Selecionadas"}
          </Button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="text-left text-muted-foreground border-b">
              <th className="py-2 pr-3 w-10">
                <Checkbox
                  checked={selected.size === rows.length && rows.length > 0}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Selecionar todas"
                />
              </th>
              <th className="py-2 pr-3">Data</th>
              <th className="py-2 pr-3">Tipo</th>
              <th className="py-2 pr-3">Valor</th>
              <th className="py-2 pr-3">Categoria</th>
              <th className="py-2 pr-3">Descrição</th>
              <th className="py-2 pr-3">Cliente</th>
              <th className="py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className={`border-b hover:bg-muted/30 transition-colors ${selected.has(r.id) ? "bg-muted/50" : ""
                  }`}
              >
                <td className="py-2 pr-3">
                  <Checkbox
                    checked={selected.has(r.id)}
                    onCheckedChange={() => toggleSelect(r.id)}
                    aria-label={`Selecionar ${r.description || "transação"}`}
                  />
                </td>
                <td className="py-2 pr-3 whitespace-nowrap">
                  {formatDateBR(r.date)}
                </td>
                <td className="py-2 pr-3">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${r.type === "income"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                      }`}
                  >
                    {r.type === "income" ? "Receita" : "Despesa"}
                  </span>
                </td>
                <td
                  className={`py-2 pr-3 font-semibold ${r.type === "income" ? "text-emerald-600" : "text-red-600"
                    }`}
                >
                  {formatBRL(r.amount)}
                </td>
                <td className="py-2 pr-3">{r.category || "-"}</td>
                <td className="py-2 pr-3 max-w-xs truncate">
                  {r.description || "-"}
                </td>
                <td className="py-2 pr-3">{r.client ? r.client.name : "-"}</td>
                <td className="py-2">
                  <FinanceEditModal
                    row={{
                      id: r.id,
                      amount: r.amount,
                      description: r.description,
                      category: r.category,
                      date: r.date.toISOString(),
                      type: r.type as "income" | "expense",
                      clientId: r.clientId || null,
                      clientName: r.client?.name,
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
