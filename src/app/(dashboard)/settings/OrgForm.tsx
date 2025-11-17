"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function onlyDigits(v: string) {
  return v.replace(/\D/g, "");
}
function maskCNPJ(v: string) {
  v = onlyDigits(v).slice(0, 14);
  return v
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}
function maskCEP(v: string) {
  v = onlyDigits(v).slice(0, 8);
  return v.replace(/(\d{5})(\d)/, "$1-$2");
}
function maskPhoneBR(v: string) {
  v = onlyDigits(v).slice(0, 11);
  if (v.length <= 10) return v.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  return v.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}

export function OrgForm() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    cnpj: "",
    phone: "",
    website: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    description: "",
  });

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch("/api/org");
        if (res.ok) {
          const o = await res.json();
          setForm((prev) => ({
            ...prev,
            name: o.name ?? "",
            cnpj: o.cnpj ?? "",
            phone: o.phone ?? "",
            website: o.website ?? "",
            addressLine1: o.addressLine1 ?? "",
            addressLine2: o.addressLine2 ?? "",
            city: o.city ?? "",
            state: o.state ?? "",
            postalCode: o.postalCode ?? "",
            country: o.country ?? "",
            description: o.description ?? "",
          }));
        }
      } catch { }
    };
    run();
  }, []);

  const onSave = async () => {
    // validações simples
    const cnpjDigits = onlyDigits(form.cnpj);
    if (cnpjDigits && cnpjDigits.length !== 14) {
      toast.error("CNPJ inválido");
      return;
    }
    const cepDigits = onlyDigits(form.postalCode);
    if (cepDigits && cepDigits.length !== 8) {
      toast.error("CEP inválido");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/org", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Falha ao salvar");
      toast.success("Organização atualizada com sucesso");
    } catch {
      toast.error("Não foi possível atualizar os dados da organização");
    } finally {
      setLoading(false);
    }
  };

  const set =
    (k: keyof typeof form, mask?: (v: string) => string) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = mask ? mask(e.target.value) : e.target.value;
        setForm({ ...form, [k]: value });
      };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
      className="space-y-8 max-w-2xl mx-auto bg-white dark:bg-slate-900 p-8 rounded-xl shadow-lg"
      aria-label="Formulário de dados da organização"
    >
      <fieldset disabled={loading} className="space-y-6 border-0">
        <legend className="sr-only">Dados da organização</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="org_name">Nome da organização</Label>
            <Input
              id="org_name"
              value={form.name}
              onChange={set("name")}
              placeholder="Minha Empresa LTDA"
              autoComplete="organization"
              aria-required="true"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input
              id="cnpj"
              value={form.cnpj}
              onChange={set("cnpj", maskCNPJ)}
              placeholder="00.000.000/0000-00"
              inputMode="numeric"
              aria-describedby="cnpj-desc"
            />
            <span id="cnpj-desc" className="text-xs text-slate-500">Somente números válidos</span>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={set("phone", maskPhoneBR)}
              placeholder="(11) 99999-9999"
              inputMode="tel"
              aria-describedby="phone-desc"
            />
            <span id="phone-desc" className="text-xs text-slate-500">DDD + número</span>
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={form.website}
              onChange={set("website")}
              placeholder="https://minhaempresa.com"
              autoComplete="url"
              type="url"
            />
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="address1">Endereço</Label>
            <Input
              id="address1"
              value={form.addressLine1}
              onChange={set("addressLine1")}
              placeholder="Rua, número"
              autoComplete="address-line1"
            />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="address2">Complemento</Label>
            <Input
              id="address2"
              value={form.addressLine2}
              onChange={set("addressLine2")}
              placeholder="Sala, bloco (opcional)"
              autoComplete="address-line2"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="city">Cidade</Label>
            <Input id="city" value={form.city} onChange={set("city")} autoComplete="address-level2" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="state">Estado</Label>
            <Input id="state" value={form.state} onChange={set("state")} autoComplete="address-level1" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="postal">CEP</Label>
            <Input
              id="postal"
              value={form.postalCode}
              onChange={set("postalCode", maskCEP)}
              inputMode="numeric"
              aria-describedby="cep-desc"
            />
            <span id="cep-desc" className="text-xs text-slate-500">Formato: 00000-000</span>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="country">País</Label>
            <Input id="country" value={form.country} onChange={set("country")} autoComplete="country" />
          </div>
        </div>
      </fieldset>
      <div className="flex justify-end mt-4">
        <Button type="submit" disabled={loading} className="rounded-full min-w-[180px] flex items-center justify-center gap-2">
          {loading && (
            <svg className="animate-spin h-4 w-4 text-blue-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          )}
          {loading ? "Salvando..." : "Salvar organização"}
        </Button>
      </div>
    </form>
  );
}
