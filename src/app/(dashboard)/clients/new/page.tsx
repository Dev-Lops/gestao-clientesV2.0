"use client";

import AppShell from "@/components/layout/AppShell";
import PageContainer from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageLayout } from "@/components/layout/PageLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormActions, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseDateInput } from "@/lib/utils";
import { createClientSchema } from "@/lib/validations";
import { BadgeCheck, Calendar, CreditCard, DollarSign, Hash, Layers, Mail, Phone, Save, Share2, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";

const { ZodError } = z;

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold tracking-tight flex items-center gap-2">
          {title}
        </h3>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

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
    isInstallment: false,
    installmentCount: "",
    installmentValue: "",
    installmentPaymentDays: [] as number[],
  });
  const [display, setDisplay] = useState({
    phone: "",
    contractValue: "",
    installmentValue: "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({});

    try {
      const contractStartToSave = formData.contractStart
        ? parseDateInput(formData.contractStart).toISOString()
        : undefined;
      const contractEndToSave = formData.contractEnd
        ? parseDateInput(formData.contractEnd).toISOString()
        : undefined;

      const normalizedValueStr = display.contractValue
        ? normalizeCurrencyToDot(display.contractValue)
        : formData.contractValue;
      const normalizedValue = normalizedValueStr
        ? Number(normalizedValueStr)
        : undefined;

      const normalizedInstallmentStr = display.installmentValue
        ? normalizeCurrencyToDot(display.installmentValue)
        : formData.installmentValue;
      const normalizedInstallment = normalizedInstallmentStr
        ? Number(normalizedInstallmentStr)
        : undefined;

      const payload = {
        ...formData,
        plan: formData.plan || undefined,
        mainChannel: formData.mainChannel || undefined,
        contractStart: contractStartToSave,
        contractEnd: contractEndToSave,
        phone: display.phone || formData.phone,
        contractValue: normalizedValue,
        paymentDay: formData.paymentDay ? Number(formData.paymentDay) : undefined,
        isInstallment: formData.isInstallment,
        installmentCount: formData.installmentCount ? Number(formData.installmentCount) : undefined,
        installmentValue: normalizedInstallment,
        installmentPaymentDays: formData.installmentPaymentDays.length > 0 ? formData.installmentPaymentDays : undefined,
      };

      // Validate with Zod
      createClientSchema.parse(payload);

      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao criar cliente");
      }

      router.push("/clients");
      router.refresh();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors: Record<string, string> = {};
        err.issues.forEach((error: z.ZodIssue) => {
          if (error.path[0]) {
            errors[error.path[0] as string] = error.message;
          }
        });
        setFieldErrors(errors);
        setError("Por favor, corrija os erros no formulário");
      } else {
        setError(err instanceof Error ? err.message : "Erro ao criar cliente");
      }
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
                    <FormField
                      label="Nome"
                      error={fieldErrors.name}
                      required
                    >
                      <Input
                        aria-invalid={!!fieldErrors.name}
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="Nome completo ou empresa"
                        disabled={loading}
                      />
                    </FormField>

                    <div className="grid gap-6 sm:grid-cols-2">
                      <FormField
                        label="Email"
                        error={fieldErrors.email}
                      >
                        <div className="relative">
                          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            <Mail className="w-4 h-4" />
                          </div>
                          <Input
                            aria-invalid={!!fieldErrors.email}
                            type="email"
                            className="pl-9"
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({ ...formData, email: e.target.value })
                            }
                            placeholder="cliente@exemplo.com"
                            disabled={loading}
                          />
                        </div>
                      </FormField>

                      <FormField
                        label="Telefone"
                        error={fieldErrors.phone}
                      >
                        <div className="relative">
                          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            <Phone className="w-4 h-4" />
                          </div>
                          <Input
                            aria-invalid={!!fieldErrors.phone}
                            type="text"
                            className="pl-9"
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
                          />
                        </div>
                      </FormField>
                    </div>

                    <FormSection title="Configurações" description="Defina status, plano e canal principal">
                      <div className="grid gap-6 sm:grid-cols-2">
                        <FormField label="Status">
                          <Select
                            value={formData.status}
                            onValueChange={(value) =>
                              setFormData({ ...formData, status: value })
                            }
                            disabled={loading}
                          >
                            <div className="relative">
                              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                <BadgeCheck className="w-4 h-4" />
                              </div>
                              <SelectTrigger className="w-full pl-9">
                                <SelectValue placeholder="Selecione um status" />
                              </SelectTrigger>
                            </div>
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
                        </FormField>

                        <FormField label="Plano">
                          <Select
                            value={formData.plan}
                            onValueChange={(value) =>
                              setFormData({ ...formData, plan: value })
                            }
                            disabled={loading}
                          >
                            <div className="relative">
                              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                <Layers className="w-4 h-4" />
                              </div>
                              <SelectTrigger className="w-full pl-9">
                                <SelectValue placeholder="Selecione um plano" />
                              </SelectTrigger>
                            </div>
                            <SelectContent>
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
                        </FormField>
                      </div>

                      <FormField label="Canal Principal">
                        <Select
                          value={formData.mainChannel}
                          onValueChange={(value) =>
                            setFormData({ ...formData, mainChannel: value })
                          }
                          disabled={loading}
                        >
                          <div className="relative">
                            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              <Share2 className="w-4 h-4" />
                            </div>
                            <SelectTrigger className="w-full pl-9">
                              <SelectValue placeholder="Selecione um canal" />
                            </SelectTrigger>
                          </div>
                          <SelectContent>
                            <SelectItem value="INSTAGRAM">Instagram</SelectItem>
                            <SelectItem value="FACEBOOK">Facebook</SelectItem>
                            <SelectItem value="TIKTOK">TikTok</SelectItem>
                            <SelectItem value="YOUTUBE">YouTube</SelectItem>
                            <SelectItem value="LINKEDIN">LinkedIn</SelectItem>
                            <SelectItem value="TWITTER">Twitter</SelectItem>
                            <SelectItem value="OUTRO">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormField>
                    </FormSection>

                    <FormSection title="Informações de Contrato" description="Período de vigência e condições do acordo">
                      <div className="grid gap-6 sm:grid-cols-2 items-start">
                        <FormField label="Início do Contrato">
                          <div className="relative">
                            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                            </div>
                            <Input
                              type="date"
                              className="pl-9"
                              value={formData.contractStart}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  contractStart: e.target.value,
                                })
                              }
                              disabled={loading}
                            />
                          </div>
                        </FormField>

                        <FormField
                          label="Término do Contrato"
                        >
                          <div className="relative">
                            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                            </div>
                            <Input
                              type="date"
                              className="pl-9"
                              value={formData.contractEnd}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  contractEnd: e.target.value,
                                })
                              }
                              disabled={loading}
                            />
                          </div>
                        </FormField>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Deixe o campo de término vazio para contrato indeterminado.
                      </p>
                    </FormSection>

                    <FormSection title="Informações Financeiras" description="Detalhes de pagamento e valor mensal">
                      <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/30">
                        <input
                          type="checkbox"
                          id="isInstallment"
                          checked={formData.isInstallment}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              isInstallment: e.target.checked,
                              installmentCount: e.target.checked ? formData.installmentCount : "",
                              installmentValue: e.target.checked ? formData.installmentValue : "",
                              installmentPaymentDays: e.target.checked ? formData.installmentPaymentDays : [],
                            });
                            if (!e.target.checked) {
                              setDisplay((d) => ({ ...d, installmentValue: "" }));
                            }
                          }}
                          disabled={loading}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="isInstallment" className="flex items-center gap-2 cursor-pointer">
                          <CreditCard className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Pagamento Parcelado</span>
                        </label>
                      </div>

                      <div className="grid gap-6 sm:grid-cols-2">
                        {!formData.isInstallment && (
                          <FormField
                            label="Dia de Pagamento"
                            description="Dia do mês (1-31)"
                            error={fieldErrors.paymentDay}
                          >
                            <div className="relative">
                              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                <Hash className="w-4 h-4" />
                              </div>
                              <Input
                                type="number"
                                min="1"
                                max="31"
                                className="pl-9"
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
                              />
                            </div>
                          </FormField>
                        )}

                        <FormField
                          label="Valor Mensal"
                          description="Use vírgula para centavos. Ex: 1.500,00"
                          error={fieldErrors.contractValue}
                          className={formData.isInstallment ? "sm:col-span-2" : ""}
                        >
                          <div className="relative">
                            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              <DollarSign className="w-4 h-4" />
                            </div>
                            <Input
                              type="text"
                              aria-invalid={!!fieldErrors.contractValue}
                              className="pl-9"
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
                              placeholder="1.500,00"
                              disabled={loading}
                            />
                          </div>
                        </FormField>
                      </div>

                      {formData.isInstallment && (
                        <div className="space-y-6 p-4 rounded-lg border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                          <FormField
                            label="Dias de Pagamento no Mês"
                            description="Selecione os dias em que as parcelas serão cobradas"
                            error={fieldErrors.installmentPaymentDays}
                          >
                            <div className="grid grid-cols-7 gap-2">
                              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                <button
                                  key={day}
                                  type="button"
                                  onClick={() => {
                                    const currentDays = formData.installmentPaymentDays;
                                    const newDays = currentDays.includes(day)
                                      ? currentDays.filter((d) => d !== day)
                                      : [...currentDays, day].sort((a, b) => a - b);
                                    setFormData({
                                      ...formData,
                                      installmentPaymentDays: newDays,
                                    });
                                  }}
                                  disabled={loading}
                                  className={`
                                    h-10 rounded-md text-sm font-medium transition-all
                                    ${formData.installmentPaymentDays.includes(day)
                                      ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                                      : "bg-white dark:bg-slate-800 border hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                                    }
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                  `}
                                >
                                  {day}
                                </button>
                              ))}
                            </div>
                            {formData.installmentPaymentDays.length > 0 && (
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                                Dias selecionados: {formData.installmentPaymentDays.join(", ")}
                              </p>
                            )}
                          </FormField>

                          <div className="grid gap-6 sm:grid-cols-2">
                            <FormField
                              label="Número de Parcelas"
                              description="Quantidade de parcelas (1-12)"
                              error={fieldErrors.installmentCount}
                            >
                              <div className="relative">
                                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                  <Hash className="w-4 h-4" />
                                </div>
                                <Input
                                  type="number"
                                  min="1"
                                  max="12"
                                  className="pl-9"
                                  aria-invalid={!!fieldErrors.installmentCount}
                                  value={formData.installmentCount}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      installmentCount: e.target.value,
                                    })
                                  }
                                  placeholder="Ex: 3, 6, 12..."
                                  disabled={loading}
                                />
                              </div>
                            </FormField>

                            <FormField
                              label="Valor da Parcela"
                              description="Valor de cada parcela"
                              error={fieldErrors.installmentValue}
                            >
                              <div className="relative">
                                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                  <DollarSign className="w-4 h-4" />
                                </div>
                                <Input
                                  type="text"
                                  aria-invalid={!!fieldErrors.installmentValue}
                                  className="pl-9"
                                  value={display.installmentValue}
                                  onChange={(e) => {
                                    const masked = formatCurrencyBRLMask(
                                      e.target.value,
                                    );
                                    setDisplay((d) => ({
                                      ...d,
                                      installmentValue: masked,
                                    }));
                                    setFormData((f) => ({
                                      ...f,
                                      installmentValue: normalizeCurrencyToDot(masked),
                                    }));
                                  }}
                                  placeholder="500,00"
                                  disabled={loading}
                                />
                              </div>
                            </FormField>
                          </div>
                        </div>
                      )}
                    </FormSection>

                    {error && (
                      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm">
                        {error}
                      </div>
                    )}

                    <FormActions className="sticky bottom-0 bg-background/70 backdrop-blur supports-backdrop-filter:bg-background/50 rounded-b-2xl">
                      <Button
                        type="submit"
                        disabled={loading}
                        isLoading={loading}
                        loadingText="Criando..."
                        className="rounded-full bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/30 gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Criar Cliente
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
                    </FormActions>
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
