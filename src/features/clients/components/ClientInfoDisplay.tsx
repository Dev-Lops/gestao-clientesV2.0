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
import { formatDateInput, parseDateInput, toLocalISOString } from "@/lib/utils";
import { ClientStatus } from "@/types/client";
import { AppClient } from "@/types/tables";
import { Edit2, Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ClientInfoDisplayProps {
  client: AppClient;
  canEdit: boolean;
}

export function ClientInfoDisplay({ client, canEdit }: ClientInfoDisplayProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [connectingInstagram, setConnectingInstagram] = useState(false);

  // Verificar se retornou do OAuth do Instagram
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const instagramSuccess = params.get("instagram_success");
    const instagramError = params.get("instagram_error");
    const instagramWarning = params.get("instagram_warning");

    if (instagramSuccess === "true") {
      toast.success("Instagram conectado com sucesso!");
      if (instagramWarning) {
        toast.warning(instagramWarning);
      }
      // Limpar query params da URL
      window.history.replaceState({}, "", window.location.pathname);
      // Recarregar página para mostrar dados atualizados
      window.location.reload();
    } else if (instagramError) {
      toast.error(instagramError);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const [formData, setFormData] = useState({
    name: client.name,
    email: client.email || "",
    phone: client.phone || "",
    status: client.status,
    plan: client.plan || "",
    mainChannel: client.main_channel || "",
    instagramUserId: client.instagram_user_id || "",
    instagramUsername: client.instagram_username || "",
    contractStart: client.contract_start
      ? formatDateInput(client.contract_start)
      : "",
    contractEnd: client.contract_end
      ? formatDateInput(client.contract_end)
      : "",
    paymentDay: client.payment_day?.toString() || "",
    contractValue: client.contract_value?.toString() || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const contractStartToSave = formData.contractStart
        ? toLocalISOString(parseDateInput(formData.contractStart))
        : null;
      const contractEndToSave = formData.contractEnd
        ? toLocalISOString(parseDateInput(formData.contractEnd))
        : null;

      const response = await fetch(`/api/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          contractStart: contractStartToSave,
          contractEnd: contractEndToSave,
          paymentDay: formData.paymentDay
            ? parseInt(formData.paymentDay)
            : null,
          contractValue: formData.contractValue
            ? parseFloat(formData.contractValue)
            : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao atualizar cliente");
      }

      toast.success("Cliente atualizado com sucesso!");
      setIsEditing(false);
      window.location.reload(); // Reload to show updated data
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao atualizar cliente",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data
    setFormData({
      name: client.name,
      email: client.email || "",
      phone: client.phone || "",
      status: client.status,
      plan: client.plan || "",
      mainChannel: client.main_channel || "",
      instagramUserId: client.instagram_user_id || "",
      instagramUsername: client.instagram_username || "",
      contractStart: client.contract_start
        ? formatDateInput(client.contract_start)
        : "",
      contractEnd: client.contract_end
        ? formatDateInput(client.contract_end)
        : "",
      paymentDay: client.payment_day?.toString() || "",
      contractValue: client.contract_value?.toString() || "",
    });
  };

  const handleConnectInstagram = async () => {
    setConnectingInstagram(true);
    try {
      // Solicitar URL de autorização do Instagram
      const response = await fetch(
        `/api/instagram/connect?clientId=${client.id}`,
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao conectar Instagram");
      }

      const { authUrl } = await response.json();

      // Abrir popup ou redirecionar para autorização do Instagram
      window.location.href = authUrl;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao conectar Instagram",
      );
      setConnectingInstagram(false);
    }
  };

  if (!isEditing) {
    return (
      <div className="relative">
        <div className="absolute -inset-1 bg-linear-to-r from-blue-600 to-purple-600 rounded-3xl blur opacity-20" />
        <Card className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Informações do Cliente</CardTitle>
              {canEdit && (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  size="sm"
                  className="rounded-full gap-2 backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                >
                  <Edit2 className="w-4 h-4" />
                  Editar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Email
                </p>
                <p className="text-sm text-slate-900 dark:text-white">
                  {client.email || "Não informado"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Telefone
                </p>
                <p className="text-sm text-slate-900 dark:text-white">
                  {client.phone || "Não informado"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Plano
                </p>
                <p className="text-sm text-slate-900 dark:text-white">
                  {client.plan || "Não definido"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Canal Principal
                </p>
                <p className="text-sm text-slate-900 dark:text-white">
                  {client.main_channel || "Não definido"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute -inset-1 bg-linear-to-r from-blue-600 to-purple-600 rounded-3xl blur opacity-20" />
      <Card className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-2xl">Editar Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b border-slate-200 dark:border-slate-700 pb-2">
                Informações Básicas
              </h3>
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nome <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  disabled={loading}
                  className="border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    disabled={loading}
                    className="border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-slate-800"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    disabled={loading}
                    className="border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        status: value as ClientStatus,
                      })
                    }
                    disabled={loading}
                  >
                    <SelectTrigger className="border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-slate-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Novo</SelectItem>
                      <SelectItem value="onboarding">Em Onboarding</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="paused">Pausado</SelectItem>
                      <SelectItem value="closed">Encerrado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plan">Plano</Label>
                  <Select
                    value={formData.plan || "__NONE__"}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        plan: value === "__NONE__" ? "" : value,
                      })
                    }
                    disabled={loading}
                  >
                    <SelectTrigger className="border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-slate-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__NONE__">Selecione</SelectItem>
                      <SelectItem value="GESTAO">Gestão</SelectItem>
                      <SelectItem value="ESTRUTURA">Estrutura</SelectItem>
                      <SelectItem value="FREELANCER">Freelancer</SelectItem>
                      <SelectItem value="PARCERIA">Parceria</SelectItem>
                      <SelectItem value="CONSULTORIA">Consultoria</SelectItem>
                      <SelectItem value="OUTRO">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mainChannel">Canal Principal</Label>
                  <Select
                    value={formData.mainChannel || "__NONE__"}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        mainChannel: value === "__NONE__" ? "" : value,
                      })
                    }
                    disabled={loading}
                  >
                    <SelectTrigger className="border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-slate-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__NONE__">Selecione</SelectItem>
                      <SelectItem value="INSTAGRAM">Instagram</SelectItem>
                      <SelectItem value="FACEBOOK">Facebook</SelectItem>
                      <SelectItem value="TIKTOK">TikTok</SelectItem>
                      <SelectItem value="YOUTUBE">YouTube</SelectItem>
                      <SelectItem value="LINKEDIN">LinkedIn</SelectItem>
                      <SelectItem value="TWITTER">Twitter</SelectItem>
                      <SelectItem value="OUTRO">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Instagram Info */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Instagram</h4>
                  <Button
                    type="button"
                    onClick={handleConnectInstagram}
                    disabled={loading || connectingInstagram}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    {connectingInstagram
                      ? "Conectando..."
                      : "Conectar Instagram"}
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="instagramUserId">Instagram User ID</Label>
                    <Input
                      id="instagramUserId"
                      type="text"
                      value={formData.instagramUserId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          instagramUserId: e.target.value,
                        })
                      }
                      disabled={true}
                      placeholder="Automático após conectar"
                      className="border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500 bg-slate-50 dark:bg-slate-900"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Preenchido automaticamente após conectar
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagramUsername">
                      Instagram Username
                    </Label>
                    <Input
                      id="instagramUsername"
                      type="text"
                      value={formData.instagramUsername}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          instagramUsername: e.target.value,
                        })
                      }
                      disabled={true}
                      placeholder="Automático após conectar"
                      className="border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500 bg-slate-50 dark:bg-slate-900"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Preenchido automaticamente após conectar
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contract Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b border-slate-200 dark:border-slate-700 pb-2">
                Informações de Contrato
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contractStart">Início do Contrato</Label>
                  <Input
                    id="contractStart"
                    type="date"
                    value={formData.contractStart}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contractStart: e.target.value,
                      })
                    }
                    disabled={loading}
                    className="border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-slate-800"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contractEnd">Término do Contrato</Label>
                  <Input
                    id="contractEnd"
                    type="date"
                    value={formData.contractEnd}
                    onChange={(e) =>
                      setFormData({ ...formData, contractEnd: e.target.value })
                    }
                    disabled={loading}
                    className="border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-slate-800"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Deixe vazio para indeterminado
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="paymentDay">Dia de Pagamento</Label>
                  <Input
                    id="paymentDay"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.paymentDay}
                    onChange={(e) =>
                      setFormData({ ...formData, paymentDay: e.target.value })
                    }
                    placeholder="Ex: 5, 10, 15..."
                    disabled={loading}
                    className="border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-slate-800"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Dia do mês (1-31)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contractValue">Valor Mensal (R$)</Label>
                  <Input
                    id="contractValue"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.contractValue}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contractValue: e.target.value,
                      })
                    }
                    placeholder="Ex: 1500.00"
                    disabled={loading}
                    className="border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button
                type="submit"
                disabled={loading}
                className="rounded-full bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/30 gap-2"
              >
                {loading ? (
                  "Salvando..."
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar Alterações
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
                className="rounded-full backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700 gap-2"
              >
                <X className="w-4 h-4" />
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
