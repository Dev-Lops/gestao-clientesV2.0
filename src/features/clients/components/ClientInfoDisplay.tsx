"use client";

import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { ClientStatus } from "@/types/enums";
import { AppClient } from "@/types/tables";
import {
  BadgeCheck,
  Calendar,
  CreditCard,
  DollarSign,
  Edit2,
  FileText,
  Hash,
  Layers,
  Mail,
  Phone,
  Save,
  Share2,
  X,
} from "lucide-react";
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

  // Funções auxiliares
  function onlyDigits(v: string) {
    return v.replace(/\D+/g, "");
  }

  function formatPhoneBR(v: string) {
    const digits = onlyDigits(v).slice(0, 11);
    if (digits.length <= 10) {
      return digits
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2")
        .slice(0, 14);
    }
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .slice(0, 15);
  }

  function formatCurrencyBRLMask(v: string) {
    const digits = onlyDigits(v);
    const number = Number(digits) / 100;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    }).format(isNaN(number) ? 0 : number);
  }

  function normalizeCurrencyToDot(v: string) {
    const digits = onlyDigits(v);
    if (!digits) return "";
    const cents = digits.padStart(3, "0");
    const intPart = cents.slice(0, -2);
    const frac = cents.slice(-2);
    return `${parseInt(intPart, 10)}.${frac}`;
  }

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
    isInstallment: client.is_installment || false,
    installmentCount: client.installment_count?.toString() || "",
    installmentValue: client.installment_value?.toString() || "",
    installmentPaymentDays: client.installment_payment_days || [],
  });

  const [display, setDisplay] = useState({
    phone: client.phone ? formatPhoneBR(client.phone) : "",
    contractValue: client.contract_value
      ? formatCurrencyBRLMask((client.contract_value * 100).toFixed(0))
      : "",
    installmentValue: client.installment_value
      ? formatCurrencyBRLMask((client.installment_value * 100).toFixed(0))
      : "",
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

      const normalizedValueStr = display.contractValue
        ? normalizeCurrencyToDot(display.contractValue)
        : formData.contractValue;
      const normalizedValue = normalizedValueStr
        ? Number(normalizedValueStr)
        : null;

      const normalizedInstallmentStr = display.installmentValue
        ? normalizeCurrencyToDot(display.installmentValue)
        : formData.installmentValue;
      const normalizedInstallment = normalizedInstallmentStr
        ? Number(normalizedInstallmentStr)
        : null;

      const response = await fetch(`/api/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email || null,
          phone: display.phone ? onlyDigits(display.phone) : null,
          status: formData.status,
          plan: formData.plan || null,
          mainChannel: formData.mainChannel || null,
          contractStart: contractStartToSave,
          contractEnd: contractEndToSave,
          paymentDay: formData.paymentDay
            ? parseInt(formData.paymentDay)
            : null,
          contractValue: normalizedValue,
          isInstallment: formData.isInstallment,
          installmentCount: formData.installmentCount
            ? parseInt(formData.installmentCount)
            : null,
          installmentValue: normalizedInstallment,
          installmentPaymentDays:
            formData.installmentPaymentDays.length > 0
              ? formData.installmentPaymentDays
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
      isInstallment: client.is_installment || false,
      installmentCount: client.installment_count?.toString() || "",
      installmentValue: client.installment_value?.toString() || "",
      installmentPaymentDays: client.installment_payment_days || [],
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

  return (
    <>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-base">Informações do Cliente</CardTitle>
          </div>
          {canEdit && (
            <>
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Editar
              </Button>

              <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Editar Informações do Cliente</DialogTitle>
                  </DialogHeader>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Informações Básicas */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                        <BadgeCheck className="w-4 h-4" />
                        Informações Básicas
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            Nome *
                          </Label>
                          <Input
                            id="name"
                            required
                            value={formData.name}
                            onChange={(e) =>
                              setFormData({ ...formData, name: e.target.value })
                            }
                            placeholder="Nome completo"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email" className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            E-mail
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({ ...formData, email: e.target.value })
                            }
                            placeholder="email@exemplo.com"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone" className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            Telefone
                          </Label>
                          <Input
                            id="phone"
                            value={display.phone}
                            onChange={(e) => {
                              const formatted = formatPhoneBR(e.target.value);
                              setDisplay({ ...display, phone: formatted });
                              setFormData({
                                ...formData,
                                phone: onlyDigits(formatted),
                              });
                            }}
                            placeholder="(00) 00000-0000"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Configurações */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        Configurações
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="status">Status *</Label>
                          <Select
                            value={formData.status}
                            onValueChange={(value: ClientStatus) =>
                              setFormData({ ...formData, status: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">Novo</SelectItem>
                              <SelectItem value="onboarding">Onboarding</SelectItem>
                              <SelectItem value="active">Ativo</SelectItem>
                              <SelectItem value="paused">Pausado</SelectItem>
                              <SelectItem value="closed">Encerrado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="plan">Plano</Label>
                          <Input
                            id="plan"
                            value={formData.plan}
                            onChange={(e) =>
                              setFormData({ ...formData, plan: e.target.value })
                            }
                            placeholder="Plano do cliente"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="mainChannel">Canal Principal</Label>
                          <Input
                            id="mainChannel"
                            value={formData.mainChannel}
                            onChange={(e) =>
                              setFormData({ ...formData, mainChannel: e.target.value })
                            }
                            placeholder="Instagram, WhatsApp..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Instagram */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                        <Share2 className="w-4 h-4" />
                        Instagram
                      </h3>
                      <div className="space-y-3">
                        {formData.instagramUsername ? (
                          <div className="p-3 border rounded-lg bg-green-50 dark:bg-green-950/20">
                            <p className="text-sm text-green-700 dark:text-green-400">
                              ✓ Conectado: @{formData.instagramUsername}
                            </p>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleConnectInstagram}
                            disabled={connectingInstagram}
                            className="w-full sm:w-auto"
                          >
                            {connectingInstagram
                              ? "Conectando..."
                              : "Conectar Instagram"}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Contrato */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Contrato
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="contractStart">Data de Início</Label>
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
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="contractEnd">Data de Término</Label>
                          <Input
                            id="contractEnd"
                            type="date"
                            value={formData.contractEnd}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                contractEnd: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Informações Financeiras */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Informações Financeiras
                      </h3>

                      <div className="space-y-4">
                        {/* Pagamento Parcelado Toggle */}
                        <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/50">
                          <input
                            title="checkbox"
                            type="checkbox"
                            id="isInstallment"
                            checked={formData.isInstallment}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                isInstallment: e.target.checked,
                              })
                            }
                            className="w-4 h-4"
                          />
                          <Label htmlFor="isInstallment" className="cursor-pointer font-medium">
                            Pagamento Parcelado
                          </Label>
                        </div>

                        {!formData.isInstallment ? (
                          // Pagamento Recorrente Mensal
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="paymentDay" className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                Dia de Vencimento
                              </Label>
                              <Select
                                value={formData.paymentDay}
                                onValueChange={(value) =>
                                  setFormData({ ...formData, paymentDay: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o dia" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                    <SelectItem key={day} value={day.toString()}>
                                      Dia {day}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="contractValue" className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-muted-foreground" />
                                Valor Mensal
                              </Label>
                              <Input
                                id="contractValue"
                                value={display.contractValue}
                                onChange={(e) => {
                                  const formatted = formatCurrencyBRLMask(e.target.value);
                                  setDisplay({ ...display, contractValue: formatted });
                                  setFormData({
                                    ...formData,
                                    contractValue: normalizeCurrencyToDot(formatted),
                                  });
                                }}
                                placeholder="R$ 0,00"
                              />
                            </div>
                          </div>
                        ) : (
                          // Pagamento Parcelado
                          <div className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label htmlFor="installmentCount" className="flex items-center gap-2">
                                  <Hash className="w-4 h-4 text-muted-foreground" />
                                  Número de Parcelas
                                </Label>
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
                                  placeholder="Ex: 12"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="installmentValue" className="flex items-center gap-2">
                                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                                  Valor da Parcela
                                </Label>
                                <Input
                                  id="installmentValue"
                                  value={display.installmentValue}
                                  onChange={(e) => {
                                    const formatted = formatCurrencyBRLMask(e.target.value);
                                    setDisplay({
                                      ...display,
                                      installmentValue: formatted,
                                    });
                                    setFormData({
                                      ...formData,
                                      installmentValue: normalizeCurrencyToDot(formatted),
                                    });
                                  }}
                                  placeholder="R$ 0,00"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                Dias de Vencimento das Parcelas
                              </Label>
                              <div className="grid grid-cols-7 gap-2">
                                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                                  const isSelected =
                                    formData.installmentPaymentDays.includes(day);
                                  return (
                                    <Button
                                      key={day}
                                      type="button"
                                      variant={isSelected ? "default" : "outline"}
                                      size="sm"
                                      className="h-10"
                                      onClick={() => {
                                        const current = formData.installmentPaymentDays;
                                        const updated = isSelected
                                          ? current.filter((d) => d !== day)
                                          : [...current, day].sort((a, b) => a - b);
                                        setFormData({
                                          ...formData,
                                          installmentPaymentDays: updated,
                                        });
                                      }}
                                    >
                                      {day}
                                    </Button>
                                  );
                                })}
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">
                                Selecionados:{" "}
                                {formData.installmentPaymentDays.length > 0
                                  ? formData.installmentPaymentDays.join(", ")
                                  : "Nenhum"}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={loading}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={loading}>
                        <Save className="w-4 h-4 mr-2" />
                        {loading ? "Salvando..." : "Salvar Alterações"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="space-y-4">
          {/* Informações Básicas */}
          <div>
            <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-wider">Informações Básicas</h3>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
              <div className="flex flex-col gap-1">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Email</p>
                <p className="text-sm text-slate-900 dark:text-white break-all">{client.email || "Não informado"}</p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Telefone</p>
                <p className="text-sm text-slate-900 dark:text-white">{client.phone || "Não informado"}</p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Plano</p>
                <p className="text-sm text-slate-900 dark:text-white">{client.plan || "Não definido"}</p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Canal Principal</p>
                <p className="text-sm text-slate-900 dark:text-white">{client.main_channel || "Não definido"}</p>
              </div>
            </div>
          </div>

          {/* Informações de Contrato */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
            <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-wider">Contrato</h3>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
              <div className="flex flex-col gap-1">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Valor Mensal</p>
                <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                  {client.contract_value ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(client.contract_value) : "Não definido"}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Tipo de Pagamento</p>
                <p className="text-sm text-slate-900 dark:text-white">{client.is_installment ? "Parcelado" : "Mensal"}</p>
              </div>
              {client.is_installment ? (
                <>
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Nº de Parcelas</p>
                    <p className="text-sm text-slate-900 dark:text-white">{client.installment_count || "Não definido"}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Dias de Pagamento</p>
                    <p className="text-sm text-slate-900 dark:text-white">
                      {client.installment_payment_days && client.installment_payment_days.length > 0
                        ? client.installment_payment_days.map(d => `Dia ${d}`).join(", ")
                        : client.payment_day ? `Dia ${client.payment_day}` : "Não definido"}
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Dia de Pagamento</p>
                  <p className="text-sm text-slate-900 dark:text-white">{client.payment_day ? `Dia ${client.payment_day}` : "Não definido"}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </>
  );
}