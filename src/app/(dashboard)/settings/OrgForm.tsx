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
      } catch {}
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
      className="space-y-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="org_name">Nome da organização</Label>
          <Input
            id="org_name"
            value={form.name}
            onChange={set("name")}
            placeholder="Minha Empresa LTDA"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="cnpj">CNPJ</Label>
          <Input
            id="cnpj"
            value={form.cnpj}
            onChange={set("cnpj", maskCNPJ)}
            placeholder="00.000.000/0000-00"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            value={form.phone}
            onChange={set("phone", maskPhoneBR)}
            placeholder="(11) 99999-9999"
          />
        </div>
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            value={form.website}
            onChange={set("website")}
            placeholder="https://minhaempresa.com"
          />
        </div>

        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="address1">Endereço</Label>
          <Input
            id="address1"
            value={form.addressLine1}
            onChange={set("addressLine1")}
            placeholder="Rua, número"
          />
        </div>
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="address2">Complemento</Label>
          <Input
            id="address2"
            value={form.addressLine2}
            onChange={set("addressLine2")}
            placeholder="Sala, bloco (opcional)"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="city">Cidade</Label>
          <Input id="city" value={form.city} onChange={set("city")} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="state">Estado</Label>
          <Input id="state" value={form.state} onChange={set("state")} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="postal">CEP</Label>
          <Input
            id="postal"
            value={form.postalCode}
            onChange={set("postalCode", maskCEP)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="country">País</Label>
          <Input id="country" value={form.country} onChange={set("country")} />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={loading} className="rounded-full">
          {loading ? "Salvando..." : "Salvar organização"}
        </Button>
      </div>
    </form>
  );
}
