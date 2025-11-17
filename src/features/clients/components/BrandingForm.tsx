"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import React, { useState } from "react";

interface BrandingFormProps {
  clientId: string;
}

export default function BrandingForm({ clientId }: BrandingFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [colorA, setColorA] = useState("#000000");
  const [colorB, setColorB] = useState("#ffffff");
  const [colorC, setColorC] = useState("#888888");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      let fileUrl: string | null = null;
      let thumbUrl: string | null = null;

      if (logoFile) {
        const fd = new FormData();
        fd.append("file", logoFile);
        fd.append("title", logoFile.name);
        const res = await fetch(`/api/clients/${clientId}/media/upload`, { method: "POST", body: fd });
        if (res.ok) {
          const json = await res.json();
          fileUrl = json.url ?? null;
          thumbUrl = json.thumbUrl ?? null;
        }
      }

      const body = {
        title,
        description,
        type: "branding",
        fileUrl,
        thumbUrl,
        palette: [colorA, colorB, colorC],
      };

      const create = await fetch(`/api/clients/${clientId}/branding`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!create.ok) throw new Error("Erro ao salvar informações");
      alert("Informações de branding enviadas com sucesso");
      setTitle("");
      setDescription("");
      setLogoFile(null);
    } catch (err) {

      console.error(err);
      alert("Falha ao enviar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-4">Informações de Branding</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Nome da marca</label>
          <Input className="mt-1 block w-full p-2 border rounded" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div>
          <label className="block text-sm font-medium">Descrição / Observações</label>
          <Textarea className="mt-1 block w-full p-2 border rounded" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
        </div>

        <div className="flex gap-3 items-center">
          <div>
            <label className="block text-sm">Cor primária</label>
            <Input type="color" value={colorA} onChange={(e) => setColorA(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm">Cor secundária</label>
            <Input type="color" value={colorB} onChange={(e) => setColorB(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm">Cor de apoio</label>
            <Input type="color" value={colorC} onChange={(e) => setColorC(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Logo (opcional)</label>
          <Input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} />
        </div>

        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? "Enviando..." : "Enviar"}</button>
          <button type="button" onClick={() => { setTitle(""); setDescription(""); setLogoFile(null); }} className="px-4 py-2 border rounded">Limpar</button>
        </div>
      </form>
    </div>
  );
}
