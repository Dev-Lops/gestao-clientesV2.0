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
import { formatDateInput, parseDateInput, toLocalISOString } from "@/lib/utils";
import { Installment } from "@/types/tables";
import {
  CalendarDays,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Plus,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface InstallmentManagerProps {
  clientId: string;
  canEdit: boolean;
}

export function InstallmentManager({
  clientId,
  canEdit,
}: InstallmentManagerProps) {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    installmentCount: "",
    startDate: "",
  });
  const [editingInstallment, setEditingInstallment] =
    useState<Installment | null>(null);
  const [editForm, setEditForm] = useState({
    status: "PENDING" as "PENDING" | "CONFIRMED" | "LATE",
    paidAt: "",
    notes: "",
  });

  useEffect(() => {
    loadInstallments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const loadInstallments = async () => {
    try {
      const res = await fetch(`/api/clients/${clientId}/installments`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Falha ao carregar parcelas");
      }
      const data = await res.json();
      setInstallments(data);
    } catch (error) {
      console.error("Erro ao carregar parcelas:", error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao carregar parcelas",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const count = parseInt(formData.installmentCount);

    if (isNaN(count) || count <= 0) {
      toast.error("Número de parcelas inválido");
      return;
    }

    if (!formData.startDate) {
      toast.error("Data de início é obrigatória");
      return;
    }

    setSubmitting(true);

    try {
      const startDateToSave = toLocalISOString(
        parseDateInput(formData.startDate),
      );

      const res = await fetch(`/api/clients/${clientId}/installments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          installmentCount: count,
          startDate: startDateToSave,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Falha ao criar parcelas");
      }

      toast.success("Parcelas criadas com sucesso!");
      setIsModalOpen(false);
      setFormData({ installmentCount: "", startDate: "" });
      loadInstallments();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao criar parcelas",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateInstallment = async () => {
    if (!editingInstallment) return;

    setSubmitting(true);

    try {
      const paidAtToSave = editForm.paidAt
        ? toLocalISOString(parseDateInput(editForm.paidAt))
        : null;

      const res = await fetch(
        `/api/clients/${clientId}/installments?installmentId=${editingInstallment.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: editForm.status,
            paidAt: paidAtToSave,
            notes: editForm.notes,
          }),
        },
      );

      if (!res.ok) throw new Error("Falha ao atualizar parcela");

      toast.success("Parcela atualizada!");
      setEditingInstallment(null);
      loadInstallments();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao atualizar parcela",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAll = async () => {
    if (
      !confirm(
        "Tem certeza que deseja remover todas as parcelas? Esta ação não pode ser desfeita.",
      )
    )
      return;

    setSubmitting(true);

    try {
      const res = await fetch(`/api/clients/${clientId}/installments`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Falha ao remover parcelas");

      toast.success("Parcelas removidas com sucesso!");
      loadInstallments();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao remover parcelas",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "text-green-600 bg-green-50 dark:bg-green-950/30";
      case "LATE":
        return "text-red-600 bg-red-50 dark:bg-red-950/30";
      default:
        return "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "Pago";
      case "LATE":
        return "Atrasado";
      default:
        return "Pendente";
    }
  };

  const totalValue = installments.reduce((sum, inst) => sum + inst.amount, 0);
  const paidValue = installments
    .filter((i) => i.status === "CONFIRMED")
    .reduce((sum, inst) => sum + inst.amount, 0);
  const pendingCount = installments.filter(
    (i) => i.status === "PENDING",
  ).length;
  const lateCount = installments.filter((i) => i.status === "LATE").length;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none" />

        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Pagamento Parcelado</CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Gerencie as parcelas do cliente
                </p>
              </div>
            </div>
            {canEdit && installments.length === 0 && (
              <Button
                onClick={() => setIsModalOpen(true)}
                size="sm"
                className="gap-2 rounded-full"
              >
                <Plus className="w-4 h-4" />
                Criar Parcelas
              </Button>
            )}
            {canEdit && installments.length > 0 && (
              <Button
                onClick={handleDeleteAll}
                variant="outline"
                size="sm"
                className="gap-2 rounded-full text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <Trash2 className="w-4 h-4" />
                Remover Todas
              </Button>
            )}
          </div>
        </CardHeader>

        {installments.length > 0 && (
          <CardContent className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">
                    Total
                  </p>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  R$ {totalValue.toFixed(2)}
                </p>
              </div>

              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">
                    Pago
                  </p>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  R$ {paidValue.toFixed(2)}
                </p>
              </div>

              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-1">
                  <CalendarDays className="w-4 h-4 text-yellow-600" />
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">
                    Pendentes
                  </p>
                </div>
                <p className="text-2xl font-bold text-yellow-600">
                  {pendingCount}
                </p>
              </div>

              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">
                    Atrasados
                  </p>
                </div>
                <p className="text-2xl font-bold text-red-600">{lateCount}</p>
              </div>
            </div>

            {/* Lista de Parcelas */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Parcelas ({installments.length})
              </h3>
              <div className="space-y-2">
                {installments.map((installment) => (
                  <div
                    key={installment.id}
                    className="bg-white/70 dark:bg-slate-800/70 rounded-xl p-4 backdrop-blur-sm border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-lg font-bold text-slate-900 dark:text-white">
                            Parcela {installment.number}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(installment.status)}`}
                          >
                            {getStatusLabel(installment.status)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-slate-600 dark:text-slate-400">
                              Valor
                            </p>
                            <p className="font-semibold text-slate-900 dark:text-white">
                              R$ {installment.amount.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-600 dark:text-slate-400">
                              Vencimento
                            </p>
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {new Date(installment.dueDate).toLocaleDateString(
                                "pt-BR",
                              )}
                            </p>
                          </div>
                          {installment.paidAt && (
                            <div>
                              <p className="text-slate-600 dark:text-slate-400">
                                Data Pagamento
                              </p>
                              <p className="font-semibold text-green-600">
                                {new Date(
                                  installment.paidAt,
                                ).toLocaleDateString("pt-BR")}
                              </p>
                            </div>
                          )}
                          {installment.notes && (
                            <div className="col-span-2">
                              <p className="text-slate-600 dark:text-slate-400">
                                Observações
                              </p>
                              <p className="text-slate-900 dark:text-white">
                                {installment.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      {canEdit && (
                        <Button
                          onClick={() => {
                            setEditingInstallment(installment);
                            setEditForm({
                              status: installment.status,
                              paidAt: installment.paidAt
                                ? formatDateInput(new Date(installment.paidAt))
                                : "",
                              notes: installment.notes || "",
                            });
                          }}
                          variant="outline"
                          size="sm"
                          className="ml-4"
                        >
                          Editar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        )}

        {installments.length === 0 && (
          <CardContent>
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Nenhuma parcela configurada
              </p>
              {canEdit && (
                <Button
                  onClick={() => setIsModalOpen(true)}
                  className="gap-2 rounded-full"
                >
                  <Plus className="w-4 h-4" />
                  Criar Parcelas
                </Button>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Modal Criar Parcelas */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Criar Parcelas</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-full"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="installmentCount">Número de Parcelas</Label>
                  <Input
                    id="installmentCount"
                    type="number"
                    min="1"
                    value={formData.installmentCount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        installmentCount: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    💡 <strong>Info:</strong> O valor de cada parcela será
                    calculado automaticamente dividindo o{" "}
                    <strong>valor do contrato</strong> pelo número de parcelas.
                  </p>
                </div>

                <div>
                  <Label htmlFor="startDate">Data da Primeira Parcela</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1"
                    disabled={submitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={submitting}
                  >
                    {submitting ? <LoadingSpinner /> : "Criar Parcelas"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Editar Parcela */}
      {editingInstallment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Editar Parcela {editingInstallment.number}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingInstallment(null)}
                  className="rounded-full"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value) =>
                    setEditForm({
                      ...editForm,
                      status: value as "PENDING" | "CONFIRMED" | "LATE",
                    })
                  }
                >
                  <SelectTrigger className="border-border focus:border-blue-500 focus:ring-blue-500 bg-background transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pendente</SelectItem>
                    <SelectItem value="CONFIRMED">Pago</SelectItem>
                    <SelectItem value="LATE">Atrasado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="paidAt">Data do Pagamento</Label>
                <Input
                  id="paidAt"
                  type="date"
                  value={editForm.paidAt}
                  onChange={(e) =>
                    setEditForm({ ...editForm, paidAt: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={editForm.notes}
                  onChange={(e) =>
                    setEditForm({ ...editForm, notes: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingInstallment(null)}
                  className="flex-1"
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleUpdateInstallment}
                  className="flex-1"
                  disabled={submitting}
                >
                  {submitting ? <LoadingSpinner /> : "Salvar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
