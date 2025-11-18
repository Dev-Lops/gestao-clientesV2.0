
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatDateInput, parseDateInput, toLocalISOString } from "@/lib/utils";
import { Installment } from "@/types/tables";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  CreditCard,
  Plus,
  Trash2,
  X
} from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/* Tipos auxiliares                                                    */
/* ------------------------------------------------------------------ */

type InstallmentStatus = "PENDING" | "CONFIRMED" | "LATE";

interface InstallmentManagerProps {
  clientId: string;
  canEdit: boolean;
}

interface CreateInstallmentFormState {
  installmentCount: string;
  startDate: string;
}

interface EditFormState {
  status: InstallmentStatus;
  paidAt: string;
  notes: string;
  dueDate: string;
  amount: string;
}

interface ModalCreateProps {
  submitting: boolean;
  formData: CreateInstallmentFormState;
  setFormData: Dispatch<SetStateAction<CreateInstallmentFormState>>;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

interface ModalEditProps {
  submitting: boolean;
  editForm: EditFormState;
  setEditForm: Dispatch<SetStateAction<EditFormState>>;
  installment: Installment;
  onClose: () => void;
  onSubmit: () => void;
}

/* ------------------------------------------------------------------ */
/* Funções remotas (fetch + React Query)                              */
/* ------------------------------------------------------------------ */

async function fetchInstallments(clientId: string): Promise<Installment[]> {
  const res = await fetch(`/api/clients/${clientId}/installments`);
  if (!res.ok) {
    throw new Error("Falha ao carregar parcelas");
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

interface CreateInstallmentsPayload {
  clientId: string;
  installmentCount: number;
  startDate: string; // valor do input date (yyyy-MM-dd)
}

async function createInstallmentsRequest(payload: CreateInstallmentsPayload) {
  const { clientId, installmentCount, startDate } = payload;

  // Envia string "YYYY-MM-DD" e deixa servidor fazer parsing local
  const res = await fetch(`/api/clients/${clientId}/installments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      installmentCount,
      startDate,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.error ?? "Falha ao criar parcelas");
  }
}

interface UpdateInstallmentPayload {
  clientId: string;
  installmentId: string | number;
  status: InstallmentStatus;
  paidAt: string; // input date (yyyy-MM-dd) ou vazio
  notes: string;
  dueDate: string; // yyyy-MM-dd
  amount: string; // numeric string
}

async function updateInstallmentRequest(payload: UpdateInstallmentPayload) {
  const { clientId, installmentId, status, paidAt, notes, dueDate, amount } = payload;

  const paidAtToSave = paidAt
    ? toLocalISOString(parseDateInput(paidAt))
    : null;
  const dueDateToSave = dueDate || undefined;
  const amountNumber = amount ? Number(amount) : undefined;

  const res = await fetch(
    `/api/clients/${clientId}/installments?installmentId=${installmentId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        paidAt: paidAtToSave,
        notes,
        dueDate: dueDateToSave,
        amount: amountNumber,
      }),
    },
  );

  if (!res.ok) {
    throw new Error("Falha ao atualizar parcela");
  }
}

interface DeleteAllPayload {
  clientId: string;
}

async function deleteAllInstallmentsRequest(payload: DeleteAllPayload) {
  const { clientId } = payload;

  const res = await fetch(`/api/clients/${clientId}/installments`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error("Falha ao remover parcelas");
  }
}


export function InstallmentManager({ clientId, canEdit }: InstallmentManagerProps) {
  // Função para apagar parcela individual
  async function deleteInstallmentRequest({ clientId, installmentId }: { clientId: string; installmentId: string | number }) {
    const res = await fetch(`/api/clients/${clientId}/installments?installmentId=${installmentId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      throw new Error("Falha ao apagar parcela");
    }
  }

  const deleteOneMutation = useMutation({
    mutationFn: deleteInstallmentRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["installments", clientId] });
      toast.success("Parcela apagada com sucesso!");
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Erro ao apagar parcela"),
  });

  function handleDeleteInstallment(installmentId: string | number) {
    if (!window.confirm("Tem certeza que deseja apagar esta parcela?")) return;
    deleteOneMutation.mutate({ clientId, installmentId });
  }
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInstallment, setEditingInstallment] = useState<Installment | null>(null);
  const [formData, setFormData] = useState<CreateInstallmentFormState>({ installmentCount: "", startDate: "" });
  const [editForm, setEditForm] = useState<EditFormState>({ status: "PENDING", paidAt: "", notes: "", dueDate: "", amount: "" });

  const { data: installments = [], isLoading, isError, error } = useQuery({
    queryKey: ["installments", clientId],
    queryFn: () => fetchInstallments(clientId),
  });

  const createMutation = useMutation({
    mutationFn: createInstallmentsRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["installments", clientId] });
      toast.success("Parcelas criadas com sucesso!");
      setFormData({ installmentCount: "", startDate: "" });
      setIsModalOpen(false);
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Erro ao criar parcelas"),
  });

  const updateMutation = useMutation({
    mutationFn: updateInstallmentRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["installments", clientId] });
      toast.success("Parcela atualizada!");
      setEditingInstallment(null);
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Erro ao atualizar parcela"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAllInstallmentsRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["installments", clientId] });
      toast.success("Parcelas removidas com sucesso!");
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Erro ao remover parcelas"),
  });

  // Handlers
  const handleCreateInstallments = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const count = Number(formData.installmentCount);
    if (!count || count <= 0) return toast.error("Informe um número válido de parcelas");
    createMutation.mutate({ clientId, installmentCount: count, startDate: formData.startDate });
  };

  const handleUpdateInstallment = () => {
    if (!editingInstallment) return;
    updateMutation.mutate({
      clientId,
      installmentId: editingInstallment.id,
      status: editForm.status,
      paidAt: editForm.paidAt,
      notes: editForm.notes,
      dueDate: editForm.dueDate,
      amount: editForm.amount,
    });
  };

  const handleDeleteAll = () => {
    if (!window.confirm("Tem certeza que deseja remover todas as parcelas? Esta ação não pode ser desfeita.")) return;
    deleteMutation.mutate({ clientId });
  };

  // Helper para formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Render
  if (isLoading)
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Spinner size="lg" variant="primary" />
        </CardContent>
      </Card>
    );

  if (isError)
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-red-600">
          {error?.message ?? "Erro ao carregar parcelas"}
        </CardContent>
      </Card>
    );

  return (
    <div className="space-y-3">
      {/* Título com ícone */}
      <div className="flex items-center gap-2">
        <CreditCard className="w-4 h-4 text-purple-600" />
        <span className="text-sm font-semibold text-purple-700">Pagamento Parcelado</span>
      </div>

      {/* Conteúdo do gerenciador */}
      {installments.length > 0 ? (
        <div className="space-y-3">
          <div className="text-sm text-slate-600">
            Gerencie as parcelas do cliente
          </div>
          <div className="flex justify-between items-center">
            {canEdit && (
              <Button
                onClick={handleDeleteAll}
                variant="outline"
                size="sm"
                className="text-xs"
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                {deleteMutation.isPending ? "Removendo..." : "Remover Todas"}
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {installments.slice(0, 3).map(installment => (
              <div key={installment.id} className="text-xs text-slate-600">
                Parcela {installment.number}: {formatCurrency(installment.amount)} - {formatDate(installment.dueDate)}
              </div>
            ))}
            {installments.length > 3 && (
              <div className="text-xs text-blue-600 cursor-pointer hover:underline">
                Ver todas ({installments.length})
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-center py-8">
            <div className="inline-flex p-3 bg-slate-100 dark:bg-slate-800 rounded-full mb-3">
              <CreditCard className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Não há faturas ou parcelas cadastradas</p>
            {canEdit && (
              <Button onClick={() => setIsModalOpen(true)} size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Criar Parcelas
              </Button>
            )}
          </div>
        </div>
      )}
      {isModalOpen && (
        <ModalCreate
          submitting={createMutation.isPending}
          formData={formData}
          setFormData={setFormData}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateInstallments}
        />
      )}
      {editingInstallment && (
        <ModalEdit
          submitting={updateMutation.isPending}
          editForm={editForm}
          setEditForm={setEditForm}
          installment={editingInstallment}
          onClose={() => setEditingInstallment(null)}
          onSubmit={handleUpdateInstallment}
        />
      )}

      {/* Listagem completa com edição */}
      {installments.length > 0 && (
        <div className="space-y-2 pt-4">
          {installments.map(inst => (
            <InstallmentCard
              key={inst.id}
              installment={inst}
              canEdit={canEdit}
              onEdit={() => {
                setEditingInstallment(inst)
                setEditForm({
                  status: inst.status as InstallmentStatus,
                  paidAt: inst.paidAt ? formatDateInput(inst.paidAt) : "",
                  notes: inst.notes || "",
                  dueDate: formatDateInput(inst.dueDate),
                  amount: inst.amount.toString(),
                })
              }}
              onDelete={() => handleDeleteInstallment(inst.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function InstallmentCard({ installment, canEdit, onEdit, onDelete }: { installment: Installment; canEdit: boolean; onEdit: () => void; onDelete: () => void }) {
  const getStatusColor = (status: InstallmentStatus) =>
    status === "CONFIRMED"
      ? "text-green-600 bg-green-50 dark:bg-green-950/30"
      : status === "LATE"
        ? "text-red-600 bg-red-50 dark:bg-red-950/30"
        : "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30";
  const getStatusLabel = (status: InstallmentStatus) =>
    status === "CONFIRMED" ? "Pago" : status === "LATE" ? "Atrasado" : "Pendente";
  return (
    <div className="bg-white/70 dark:bg-slate-800/70 rounded-lg p-2.5 backdrop-blur-sm border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">Parcela {installment.number}</span>
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium ${getStatusColor(installment.status as InstallmentStatus)}`}>
              {getStatusLabel(installment.status as InstallmentStatus)}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
            <span className="font-medium text-slate-900 dark:text-white">R$ {installment.amount.toFixed(2)}</span>
            <span className="text-[11px]">Venc: {formatDate(installment.dueDate)}</span>
            {installment.paidAt && (
              <span className="text-green-600 text-[11px]">
                Pago {formatDate(installment.paidAt)}
              </span>
            )}
          </div>
        </div>
        {canEdit && (
          <div className="flex gap-0.5 shrink-0">
            <Button onClick={onEdit} variant="ghost" size="sm" className="h-6 px-1.5 text-[11px]">
              Editar
            </Button>
            <Button onClick={onDelete} variant="ghost" size="sm" className="h-6 px-1.5 text-[11px] text-red-600 hover:text-red-700 hover:bg-red-50">
              Apagar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Componentes auxiliares                                              */
/* ------------------------------------------------------------------ */

function ModalCreate({
  submitting,
  formData,
  setFormData,
  onClose,
  onSubmit,
}: ModalCreateProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Criar Parcelas</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="installmentCount">Número de Parcelas</Label>
              <Input
                id="installmentCount"
                type="number"
                min="1"
                value={formData.installmentCount}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    installmentCount: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800 text-xs text-slate-600 dark:text-slate-400">
              💡 <strong>Info:</strong> O valor de cada parcela será calculado
              automaticamente dividindo o valor do contrato pelo número de
              parcelas.
            </div>

            <div>
              <Label htmlFor="startDate">Data da Primeira Parcela</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitting ? <Spinner size="sm" /> : "Criar Parcelas"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function ModalEdit({
  submitting,
  editForm,
  setEditForm,
  installment,
  onClose,
  onSubmit,
}: ModalEditProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Editar Parcela {installment.number}</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(value) =>
                  setEditForm((prev) => ({
                    ...prev,
                    status: value as InstallmentStatus,
                  }))
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
              <Label htmlFor="dueDate">Vencimento</Label>
              <Input
                id="dueDate"
                type="date"
                value={editForm.dueDate}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    dueDate: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={editForm.amount}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    amount: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="paidAt">Data Pagamento</Label>
              <Input
                id="paidAt"
                type="date"
                value={editForm.paidAt}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    paidAt: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={editForm.notes}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={onSubmit}
              className="flex-1"
              disabled={submitting}
            >
              {submitting ? <Spinner size="sm" /> : "Salvar"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
