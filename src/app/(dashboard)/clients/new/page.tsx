"use client";

import AppShell from "@/components/layout/AppShell";
import PageContainer from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageLayout } from "@/components/layout/PageLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
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
import { Save, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";

const { ZodError } = z;

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{title}</h3>
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

      const normalizedValue = display.contractValue
        ? normalizeCurrencyToDot(display.contractValue)
        : formData.contractValue;

      const payload = {
        ...formData,
        contractStart: contractStartToSave,
        contractEnd: contractEndToSave,
        phone: display.phone || formData.phone,
        contractValue: normalizedValue,
        paymentDay: formData.paymentDay ? Number(formData.paymentDay) : undefined,
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
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          placeholder="cliente@exemplo.com"
                          disabled={loading}
                        />
                      </FormField>

                      <FormField
                        label="Telefone"
                        error={fieldErrors.phone}
                      >
                        <Input
                          type="text"
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
                      </FormField>
                    </div>

                    <FormSection title="Configurações">
                      <div className="grid gap-6 sm:grid-cols-2">
                        <FormField label="Status">
                          <Select
                            value={formData.status}
                            onValueChange={(value) =>
                              setFormData({ ...formData, status: value })
                            }
                            disabled={loading}
                          >
                            <SelectTrigger>
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
                        </FormField>

                        <FormField label="Plano">
                          <Select
                            value={formData.plan}
                            onValueChange={(value) =>
                              setFormData({ ...formData, plan: value })
                            }
                            disabled={loading}
                          >
                            <SelectTrigger>
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
                          <SelectTrigger>
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
                      </FormField>
                    </FormSection>

                    <FormSection title="Informações de Contrato">
                      <div className="grid gap-6 sm:grid-cols-2">
                        <FormField label="Início do Contrato">
                          <Input
                            type="date"
                            value={formData.contractStart}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                contractStart: e.target.value,
                              })
                            }
                            disabled={loading}
                          />
                        </FormField>

                        <FormField
                          label="Término do Contrato"
                          description="Deixe vazio para contrato indeterminado"
                        >
                          <Input
                            type="date"
                            value={formData.contractEnd}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                contractEnd: e.target.value,
                              })
                            }
                            disabled={loading}
                          />
                        </FormField>
                      </div>
                    </FormSection>

                    <FormSection title="Informações Financeiras">
                      <div className="grid gap-6 sm:grid-cols-2">
                        <FormField
                          label="Dia de Pagamento"
                          description="Dia do mês (1-31)"
                          error={fieldErrors.paymentDay}
                        >
                          <Input
                            type="number"
                            min="1"
                            max="31"
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
                        </FormField>

                        <FormField
                          label="Valor Mensal (R$)"
                          error={fieldErrors.contractValue}
                        >
                          <Input
                            type="text"
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
                          />
                        </FormField>
                      </div>
                    </FormSection>

                    {error && (
                      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm">
                        {error}
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
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
