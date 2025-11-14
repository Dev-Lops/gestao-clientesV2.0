"use client";

import AppShell from "@/components/layout/AppShell";
import PageContainer from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageLayout } from "@/components/layout/PageLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
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
import { parseDateInput } from "@/lib/utils";
import { Save, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    status: "new",
    plan: "",
    mainChannel: "",
    contractStart: "",
    contractEnd: "",
    paymentDay: "",
    contractValue: "",
  });
  const [display, setDisplay] = useState({
    phone: "",
    contractValue: "",
  });

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

  function validateForm() {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = "Nome é obrigatório";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = "Email inválido";
    }
    const phoneDigits = onlyDigits(display.phone);
    if (phoneDigits && phoneDigits.length < 10)
      errs.phone = "Telefone incompleto";
    if (formData.paymentDay) {
      const d = Number(formData.paymentDay);
      if (isNaN(d) || d < 1 || d > 31) errs.paymentDay = "Dia deve ser 1 a 31";
    }
    if (display.contractValue) {
      const normalized = normalizeCurrencyToDot(display.contractValue);
      if (!normalized || isNaN(Number(normalized)))
        errs.contractValue = "Valor inválido";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({});

    try {
      const contractStartToSave = formData.contractStart
        ? parseDateInput(formData.contractStart).toISOString()
        : null;
      const contractEndToSave = formData.contractEnd
        ? parseDateInput(formData.contractEnd).toISOString()
        : null;

      if (!validateForm()) {
        setLoading(false);
        return;
      }

      const normalizedValue = display.contractValue
        ? normalizeCurrencyToDot(display.contractValue)
        : formData.contractValue;

      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          contractStart: contractStartToSave,
          contractEnd: contractEndToSave,
          phone: display.phone || formData.phone,
          contractValue: normalizedValue,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao criar cliente");
      }

      router.push("/clients");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar cliente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <PageContainer>
          <PageLayout centered={false} maxWidth="3xl">
            <PageHeader
              title="Novo Cliente"
              description="Cadastre um novo cliente na sua organização"
              icon={UserPlus}
              iconColor="bg-green-600"
            />
            <div className="relative">
              {/* Glow effect (sutil e contido ao card) */}
              <div className="pointer-events-none absolute -inset-1 bg-linear-to-r from-blue-600 to-purple-600 rounded-3xl blur opacity-15" />
              <Card className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="text-2xl">
                    Informações do Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">
                        Nome <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        required
                        aria-invalid={!!fieldErrors.name}
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="Nome completo ou empresa"
                        disabled={loading}
                        className={`border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-slate-800 ${fieldErrors.name ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
                      />
                      {fieldErrors.name && (
                        <p className="text-xs text-red-600 dark:text-red-400">
                          {fieldErrors.name}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          aria-invalid={!!fieldErrors.email}
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          placeholder="cliente@exemplo.com"
                          disabled={loading}
                          className={`border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-slate-800 ${fieldErrors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
                        />
                        {fieldErrors.email && (
                          <p className="text-xs text-red-600 dark:text-red-400">
                            {fieldErrors.email}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium">
                          Telefone
                        </Label>
                        <Input
                          id="phone"
                          type="text"
                          aria-invalid={!!fieldErrors.phone}
                          value={display.phone}
                          onChange={(e) => {
                            const masked = formatPhoneBR(e.target.value);
                            setDisplay((d) => ({ ...d, phone: masked }));
                            setFormData((f) => ({
                              ...f,
                              phone: onlyDigits(masked),
                            }));
                          }}
                          placeholder="(11) 99999-9999"
                          disabled={loading}
                          className={`border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-slate-800 ${fieldErrors.phone ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
                        />
                        {fieldErrors.phone && (
                          <p className="text-xs text-red-600 dark:text-red-400">
                            {fieldErrors.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-200 dark:border-slate-700" />
                    <h3 className="text-lg font-semibold mb-2">
                      Configurações
                    </h3>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="status" className="text-sm font-medium">
                          Status
                        </Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value) =>
                            setFormData({ ...formData, status: value })
                          }
                          disabled={loading}
                        >
                          <SelectTrigger className="border-border focus:border-blue-500 focus:ring-blue-500 bg-background transition-colors">
                            <SelectValue placeholder="Selecione um status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">Novo</SelectItem>
                            <SelectItem value="onboarding">
                              Em Onboarding
                            </SelectItem>
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="paused">Pausado</SelectItem>
                            <SelectItem value="closed">Encerrado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="plan" className="text-sm font-medium">
                          Plano
                        </Label>
                        <Select
                          value={formData.plan}
                          onValueChange={(value) =>
                            setFormData({ ...formData, plan: value })
                          }
                          disabled={loading}
                        >
                          <SelectTrigger className="border-border focus:border-blue-500 focus:ring-blue-500 bg-background transition-colors">
                            <SelectValue placeholder="Selecione um plano" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Selecione um plano</SelectItem>
                            <SelectItem value="GESTAO">Gestão</SelectItem>
                            <SelectItem value="ESTRUTURA">Estrutura</SelectItem>
                            <SelectItem value="FREELANCER">
                              Freelancer
                            </SelectItem>
                            <SelectItem value="PARCERIA">Parceria</SelectItem>
                            <SelectItem value="CONSULTORIA">
                              Consultoria
                            </SelectItem>
                            <SelectItem value="OUTRO">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="mainChannel"
                        className="text-sm font-medium"
                      >
                        Canal Principal
                      </Label>
                      <Select
                        value={formData.mainChannel}
                        onValueChange={(value) =>
                          setFormData({ ...formData, mainChannel: value })
                        }
                        disabled={loading}
                      >
                        <SelectTrigger className="border-border focus:border-blue-500 focus:ring-blue-500 bg-background transition-colors">
                          <SelectValue placeholder="Selecione um canal" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Selecione um canal</SelectItem>
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

                    {/* Contract Section */}
                    <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                      <h3 className="text-lg font-semibold mb-4 bg-linear-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                        Informações de Contrato
                      </h3>

                      <div className="space-y-6">
                        <div className="grid gap-6 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label
                              htmlFor="contractStart"
                              className="text-sm font-medium"
                            >
                              Início do Contrato
                            </Label>
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
                              className="border-border focus:border-blue-500 focus:ring-blue-500 bg-background transition-colors"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label
                              htmlFor="contractEnd"
                              className="text-sm font-medium"
                            >
                              Término do Contrato
                            </Label>
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
                              disabled={loading}
                              className="border-border focus:border-blue-500 focus:ring-blue-500 bg-background transition-colors"
                            />
                            <p className="text-xs text-muted-foreground">
                              Deixe vazio para contrato indeterminado
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Financeiro */}
                    <div className="pt-6 border-t border-border">
                      <h3 className="text-lg font-semibold mb-4">
                        Informações Financeiras
                      </h3>
                      <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label
                            htmlFor="paymentDay"
                            className="text-sm font-medium"
                          >
                            Dia de Pagamento
                          </Label>
                          <Input
                            id="paymentDay"
                            type="number"
                            min="1"
                            max="31"
                            aria-invalid={!!fieldErrors.paymentDay}
                            value={formData.paymentDay}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                paymentDay: e.target.value,
                              })
                            }
                            placeholder="Ex: 5, 10, 15..."
                            disabled={loading}
                            className={`border-border focus:border-blue-500 focus:ring-blue-500 bg-background transition-colors ${fieldErrors.paymentDay ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
                          />
                          <p className="text-xs text-muted-foreground">
                            Dia do mês (1-31)
                          </p>
                          {fieldErrors.paymentDay && (
                            <p className="text-xs text-red-600 dark:text-red-400">
                              {fieldErrors.paymentDay}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="contractValue"
                            className="text-sm font-medium"
                          >
                            Valor Mensal (R$)
                          </Label>
                          <Input
                            id="contractValue"
                            type="text"
                            aria-invalid={!!fieldErrors.contractValue}
                            value={display.contractValue}
                            onChange={(e) => {
                              const masked = formatCurrencyBRLMask(
                                e.target.value,
                              );
                              setDisplay((d) => ({
                                ...d,
                                contractValue: masked,
                              }));
                              setFormData((f) => ({
                                ...f,
                                contractValue: normalizeCurrencyToDot(masked),
                              }));
                            }}
                            placeholder="Ex: R$ 1.500,00"
                            disabled={loading}
                            className={`border-border focus:border-blue-500 focus:ring-blue-500 bg-background transition-colors ${fieldErrors.contractValue ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
                          />
                          {fieldErrors.contractValue && (
                            <p className="text-xs text-red-600 dark:text-red-400">
                              {fieldErrors.contractValue}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {error && (
                      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm">
                        {error}
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="submit"
                        disabled={loading}
                        className="rounded-full bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/30 gap-2"
                      >
                        {loading ? (
                          <>
                            <LoadingSpinner size="sm" className="text-white" />
                            Criando...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Criar Cliente
                          </>
                        )}
                      </Button>
                      <Link href="/clients">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={loading}
                          className="rounded-full"
                        >
                          Cancelar
                        </Button>
                      </Link>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </PageLayout>
        </PageContainer>
      </AppShell>
    </ProtectedRoute>
  );
}
