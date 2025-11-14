"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDateInput, parseDateInput } from "@/lib/utils";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  DollarSign,
  Edit,
  Filter,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface Finance {
  id: string;
  type: "income" | "expense";
  amount: number;
  description?: string | null;
  category?: string | null;
  date: Date | string;
  createdAt: Date | string;
}

interface FinanceManagerProps {
  clientId: string;
}

const CATEGORIES = {
  income: ["Pagamento", "Bônus", "Reembolso", "Outro"],
  expense: ["Anúncios", "Ferramentas", "Freelancer", "Hospedagem", "Outro"],
};

export function FinanceManagerV2({ clientId }: FinanceManagerProps) {
  const [finances, setFinances] = useState<Finance[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Finance | null>(null);
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [dateFilter, setDateFilter] = useState<string>("");

  const [formData, setFormData] = useState({
    type: "income" as Finance["type"],
    amount: "",
    description: "",
    category: "",
    date: new Date().toISOString().split("T")[0],
  });

  const loadFinances = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/clients/${clientId}/finance`);
      if (!res.ok) throw new Error("Falha ao carregar finanças");
      const data = await res.json();
      setFinances(data || []);
    } catch {
      toast.error("Erro ao carregar transações");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  // Load finances on mount / when clientId changes
  useEffect(() => {
    loadFinances();
  }, [loadFinances]);

  const resetForm = () => {
    setFormData({
      type: "income",
      amount: "",
      description: "",
      category: "",
      date: formatDateInput(new Date()),
    });
    setEditingItem(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Por favor, insira um valor válido");
      return;
    }

    setSubmitting(true);

    try {
      const dateToSave = parseDateInput(formData.date).toISOString();

      if (editingItem) {
        const res = await fetch(
          `/api/clients/${clientId}/finance?id=${editingItem.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: formData.type,
              amount,
              description: formData.description,
              category: formData.category,
              date: dateToSave,
            }),
          },
        );

        if (!res.ok) throw new Error("Falha ao atualizar transação");
        const updated = await res.json();
        setFinances((prev) =>
          prev.map((item) => (item.id === editingItem.id ? updated : item)),
        );
        toast.success("Transação atualizada!");
      } else {
        const res = await fetch(`/api/clients/${clientId}/finance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: formData.type,
            amount,
            description: formData.description,
            category: formData.category,
            date: dateToSave,
          }),
        });

        if (!res.ok) throw new Error("Falha ao criar transação");
        const created = await res.json();
        setFinances((prev) => [created, ...prev]);
        toast.success("Transação criada!");
      }

      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao salvar transação",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: Finance) => {
    setEditingItem(item);
    const date = new Date(item.date);
    setFormData({
      type: item.type,
      amount: item.amount.toString(),
      description: item.description || "",
      category: item.category || "",
      date: formatDateInput(date),
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar esta transação?")) return;

    try {
      const res = await fetch(`/api/clients/${clientId}/finance?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Falha ao deletar transação");

      setFinances((prev) => prev.filter((item) => item.id !== id));
      toast.success("Transação deletada!");
    } catch {
      toast.error("Erro ao deletar transação");
    }
  };

  const totals = useMemo(() => {
    const income = finances
      .filter((f) => f.type === "income")
      .reduce((sum, f) => sum + f.amount, 0);

    const expense = finances
      .filter((f) => f.type === "expense")
      .reduce((sum, f) => sum + f.amount, 0);

    return {
      income,
      expense,
      balance: income - expense,
    };
  }, [finances]);

  const filteredFinances = useMemo(() => {
    let result = [...finances];

    if (filter !== "all") {
      result = result.filter((f) => f.type === filter);
    }

    if (dateFilter) {
      const [year, month] = dateFilter.split("-");
      result = result.filter((f) => {
        const date = new Date(f.date);
        return (
          date.getFullYear() === parseInt(year) &&
          date.getMonth() + 1 === parseInt(month)
        );
      });
    }

    return result.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [finances, filter, dateFilter]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-muted-foreground">
            Carregando finanças...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold bg-linear-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Gestão Financeira
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Controle completo de receitas e despesas
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="gap-2 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/30"
          >
            <Plus className="h-4 w-4" />
            Nova Transação
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="relative overflow-hidden border-2 border-green-200/60 shadow-xl shadow-green-200/50 transition-colors">
            <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-green-500 to-emerald-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">
                Receita Total
              </CardTitle>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(totals.income)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Total de entradas
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-2 border-red-200/60 shadow-xl shadow-red-200/50 transition-colors">
            <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-red-500 to-rose-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">
                Despesas
              </CardTitle>
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {formatCurrency(totals.expense)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Total de saídas
              </p>
            </CardContent>
          </Card>

          <Card
            className={`relative overflow-hidden border-2 shadow-xl transition-colors ${totals.balance >= 0
                ? "border-blue-200/60 shadow-blue-200/50"
                : "border-orange-200/60 shadow-orange-200/50"
              }`}
          >
            <div
              className={`absolute top-0 left-0 w-full h-2 bg-linear-to-r ${totals.balance >= 0
                  ? "from-blue-500 to-purple-500"
                  : "from-orange-500 to-red-500"
                }`}
            />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">
                Saldo
              </CardTitle>
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center ${totals.balance >= 0 ? "bg-blue-100" : "bg-orange-100"
                  }`}
              >
                <DollarSign
                  className={`h-5 w-5 ${totals.balance >= 0 ? "text-blue-600" : "text-orange-600"
                    }`}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div
                className={`text-3xl font-bold ${totals.balance >= 0 ? "text-blue-600" : "text-orange-600"
                  }`}
              >
                {formatCurrency(totals.balance)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {totals.balance >= 0 ? "Balanço positivo" : "Balanço negativo"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="transition-colors">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  Filtros:
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("all")}
                  className="text-xs"
                >
                  Todas
                </Button>
                <Button
                  variant={filter === "income" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("income")}
                  className="text-xs gap-1"
                >
                  <ArrowUpCircle className="h-3 w-3" />
                  Receitas
                </Button>
                <Button
                  variant={filter === "expense" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("expense")}
                  className="text-xs gap-1"
                >
                  <ArrowDownCircle className="h-3 w-3" />
                  Despesas
                </Button>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="month"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-40 h-8 text-xs"
                />
                {dateFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDateFilter("")}
                    className="h-8 px-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card className="transition-colors">
          <CardHeader>
            <CardTitle>Histórico de Transações</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredFinances.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Nenhuma transação encontrada</p>
                <p className="text-sm mt-1">
                  {filter !== "all" || dateFilter
                    ? "Tente ajustar os filtros"
                    : "Comece adicionando uma transação"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredFinances.map((finance) => (
                  <div
                    key={finance.id}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all hover:shadow-md ${finance.type === "income"
                        ? "border-green-200 bg-green-50/50 hover:border-green-300"
                        : "border-red-200 bg-red-50/50 hover:border-red-300"
                      }`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className={`h-12 w-12 rounded-full flex items-center justify-center ${finance.type === "income"
                            ? "bg-green-100"
                            : "bg-red-100"
                          }`}
                      >
                        {finance.type === "income" ? (
                          <ArrowUpCircle className="h-6 w-6 text-green-600" />
                        ) : (
                          <ArrowDownCircle className="h-6 w-6 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-foreground">
                            {finance.description || "Sem descrição"}
                          </h4>
                          {finance.category && (
                            <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                              {finance.category}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(finance.date)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-xl font-bold ${finance.type === "income"
                              ? "text-green-600"
                              : "text-red-600"
                            }`}
                        >
                          {finance.type === "income" ? "+" : "-"}
                          {formatCurrency(finance.amount)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(finance)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(finance.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg bg-card transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {editingItem ? "Editar Transação" : "Nova Transação"}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        type: value as "income" | "expense",
                        category: "",
                      })
                    }
                    disabled={submitting}
                  >
                    <SelectTrigger className="border-border focus:border-blue-500 focus:ring-blue-500 bg-background transition-colors">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Receita</SelectItem>
                      <SelectItem value="expense">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">
                    Valor <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    placeholder="0.00"
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                    disabled={submitting}
                  >
                    <SelectTrigger className="border-border focus:border-blue-500 focus:ring-blue-500 bg-background transition-colors">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Selecione...</SelectItem>
                      {CATEGORIES[formData.type].map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Detalhes da transação"
                    rows={3}
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
                  <Input
                    id="date"
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    disabled={submitting}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {submitting && (
                      <LoadingSpinner size="sm" className="mr-2" />
                    )}
                    {editingItem ? "Salvar" : "Criar"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                    disabled={submitting}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
