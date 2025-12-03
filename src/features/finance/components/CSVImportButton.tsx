"use client";

import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ImportResult {
  total: number;
  incomes: {
    reconciled: number;
    imported: number;
    skipped: number;
  };
  expenses: {
    imported: number;
    skipped: number;
  };
  errors: string[];
}

export function CSVImportButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Por favor, selecione um arquivo CSV");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/billing/import-csv", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Falha ao importar CSV");
      }

      const result: ImportResult = await response.json();

      const totalIncomes =
        result.incomes.reconciled +
        result.incomes.imported +
        result.incomes.skipped;
      const totalExpenses = result.expenses.imported + result.expenses.skipped;

      if (result.errors.length > 0) {
        toast.warning(`Importação concluída com ${result.errors.length} erros`, {
          description: `${result.incomes.reconciled} conciliados, ${result.incomes.imported} receitas, ${result.expenses.imported} despesas`,
        });
      } else {
        toast.success("CSV importado com sucesso!", {
          description: `${result.incomes.reconciled} conciliados | ${result.incomes.imported} receitas | ${result.expenses.imported} despesas`,
        });
      }

      // Recarregar página após 1 segundo
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Error importing CSV:", error);
      toast.error("Erro ao importar CSV");
    } finally {
      setIsLoading(false);
      event.target.value = ""; // Reset input
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        className="hidden"
        id="csv-upload"
        disabled={isLoading}
      />
      <label htmlFor="csv-upload">
        <Button asChild variant="outline" disabled={isLoading}>
          <span className="cursor-pointer">
            <Upload className="h-4 w-4 mr-2" />
            {isLoading ? "Importando..." : "Importar CSV"}
          </span>
        </Button>
      </label>
    </div>
  );
}
