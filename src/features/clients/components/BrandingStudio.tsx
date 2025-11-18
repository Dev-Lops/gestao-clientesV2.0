"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useState } from "react";
// React Query migration: removed SWR
import AssetCard from "./AssetCard";
import CanvasPreview from "./CanvasPreview";
import Uploader from "./Uploader";

interface BrandingItem {
  id: string;
  title: string;
  type: string;
  description?: string | null;
  fileUrl?: string | null;
  content?: string | null;
  thumbUrl?: string | null;
  palette?: string[] | null;
  createdAt?: string | null;
}

interface MediaUploadResult {
  url?: string;
  thumbUrl?: string;
  title?: string;
  fileName?: string;
  colors?: string[] | null;
}

interface BrandingStudioProps {
  clientId: string;
}

export default function BrandingStudio({ clientId }: BrandingStudioProps) {
  const queryClient = useQueryClient();
  const brandingQueryKey = ["branding", clientId];
  const { data } = useQuery<BrandingItem[]>({
    queryKey: brandingQueryKey,
    queryFn: async () => {
      const r = await fetch(`/api/clients/${clientId}/branding`, { credentials: "include" });
      if (!r.ok) throw new Error("Falha ao carregar branding");
      return r.json();
    },
    staleTime: 30_000,
  });
  const items = data ?? [];
  const updateBranding = (updater: (prev: BrandingItem[]) => BrandingItem[]) => {
    queryClient.setQueryData<BrandingItem[]>(brandingQueryKey, (prev = []) => updater(prev));
  };
  const invalidateBranding = () => queryClient.invalidateQueries({ queryKey: brandingQueryKey });
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("newest");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<BrandingItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<BrandingItem | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerItem, setViewerItem] = useState<BrandingItem | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "asset",
    fileUrl: "",
    content: "",
    thumbUrl: undefined as string | undefined,
    palette: undefined as string[] | undefined,
  });

  async function createBrandingFromMedia(media: { url?: string; thumbUrl?: string; title?: string; colors?: string[] | null }) {
    try {
      const body = {
        title: media.title ?? "Arquivo",
        type: "asset",
        description: null,
        fileUrl: media.url ?? null,
        content: null,
        thumbUrl: media.thumbUrl ?? null,
        palette: media.colors ?? null,
      };
      const res = await fetch(`/api/clients/${clientId}/branding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) return null;
      const created = await res.json();
      invalidateBranding();
      return created;
    } catch {
      return null;
    }
  }

  function openCreateModal() {
    setEditing(null);
    setForm({ title: "", description: "", type: "asset", fileUrl: "", content: "", thumbUrl: undefined, palette: undefined });
    setIsModalOpen(true);
  }

  function openEditModal(item: BrandingItem) {
    setEditing(item);
    setForm({ title: item.title ?? "", description: item.description ?? "", type: item.type ?? "asset", fileUrl: item.fileUrl ?? "", content: item.content ?? "", thumbUrl: item.thumbUrl ?? undefined, palette: item.palette ?? undefined });
    setIsModalOpen(true);
  }

  function openViewer(item: BrandingItem) {
    setViewerItem(item);
    setViewerOpen(true);
  }

  function closeViewer() {
    setViewerOpen(false);
    setViewerItem(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir item de branding?")) return;
    try {
      const res = await fetch(`/api/clients/${clientId}/branding?brandingId=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      invalidateBranding();
      setSelected((s) => (s && s.id === id ? null : s));
    } catch {
      // noop
    }
  }

  async function handleModalSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      try {
        const res = await fetch(`/api/clients/${clientId}/branding?brandingId=${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          invalidateBranding();
          setIsModalOpen(false);
          setEditing(null);
        }
      } catch {
        // noop
      }
    } else {
      try {
        const res = await fetch(`/api/clients/${clientId}/branding`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          invalidateBranding();
          setIsModalOpen(false);
        }
      } catch {
        // noop
      }
    }
  }

  // helper: upload a single file to media upload endpoint and return parsed result
  async function uploadFileToMedia(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("title", file.name);
    const res = await fetch(`/api/clients/${clientId}/media/upload`, { method: "POST", body: fd });
    if (!res.ok) return null;
    const obj = await res.json();
    return obj as MediaUploadResult;
  }

  async function saveSelected(updated: Partial<BrandingItem>) {
    if (!selected) return;
    try {
      const res = await fetch(`/api/clients/${clientId}/branding?brandingId=${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error("Failed");
      invalidateBranding();
      setSelected(null);
    } catch {
      // noop
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function bulkDelete() {
    if (!confirm(`Excluir ${selectedIds.size} itens?`)) return;
    try {
      for (const id of Array.from(selectedIds)) {
        await fetch(`/api/clients/${clientId}/branding?brandingId=${id}`, { method: "DELETE" });
      }
      invalidateBranding();
      clearSelection();
    } catch {
      // noop
    }
  }

  const filtered = items.filter((it) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (it.title && it.title.toLowerCase().includes(q)) || (it.type && it.type.toLowerCase().includes(q));
  }).sort((a, b) => {
    if (sortBy === 'name') return (a.title || '').localeCompare(b.title || '');
    const ta = new Date(a.createdAt ?? 0).getTime();
    const tb = new Date(b.createdAt ?? 0).getTime();
    if (sortBy === 'newest') return tb - ta;
    return ta - tb;
  });

  return (
    <div className="min-h-[70vh]">
      <div className="flex items-center justify-between p-4 border-b studio-border">
        <div>
          <h1 className="text-xl font-bold">Branding Studio</h1>
          <p className="text-sm text-slate-500">Crie e gerencie a identidade visual do cliente</p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="bg-linear-to-r from-blue-600 to-purple-600 text-white">Publicar Versão</Button>
          <Button onClick={openCreateModal} variant="outline">Criar Item</Button>
        </div>
      </div>

      {/* Toolbar: search, view toggle, sort, bulk actions */}
      <div className="flex items-center gap-3 p-3">
        <input aria-label="Pesquisar" placeholder="Pesquisar assets" className="flex-1 p-2 border rounded" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select aria-label="Ordenar" value={sortBy} onChange={(e) => setSortBy(e.target.value as "newest" | "oldest" | "name")} className="p-2 border rounded">
          <option value="newest">Mais recentes</option>
          <option value="oldest">Mais antigos</option>
          <option value="name">Nome</option>
        </select>
        <div className="flex items-center gap-2">
          <button aria-label="Ver como grade" onClick={() => setViewMode('grid')} className={`p-2 border rounded ${viewMode === 'grid' ? 'bg-slate-100' : ''}`}>Grade</button>
          <button aria-label="Ver como lista" onClick={() => setViewMode('list')} className={`p-2 border rounded ${viewMode === 'list' ? 'bg-slate-100' : ''}`}>Lista</button>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {selectedIds.size > 0 && (
            <>
              <div className="text-sm">{selectedIds.size} selecionado(s)</div>
              <Button variant="ghost" onClick={bulkDelete}>Excluir selecionados</Button>
              <Button variant="outline" onClick={clearSelection}>Limpar seleção</Button>
            </>
          )}
          {selectedIds.size === 0 && (
            <Button variant="ghost" onClick={() => setSelectedIds(new Set(filtered.map(i => i.id)))}>Selecionar todos</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 p-4">
        <aside className="col-span-3">
          <Card className="p-3 studio-bg studio-shadow studio-radius">
            <CardHeader>
              <CardTitle>Inspector</CardTitle>
            </CardHeader>
            <CardContent>
              {selected ? (
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium">Título</label>
                    <input aria-label="Título" placeholder="Título" className="w-full p-2 border rounded" defaultValue={selected.title} onChange={(e) => setSelected({ ...selected, title: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Descrição</label>
                    <input aria-label="Descrição" placeholder="Descrição" className="w-full p-2 border rounded" defaultValue={selected.description ?? ""} onChange={(e) => setSelected({ ...selected, description: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Notas / Conteúdo</label>
                    <textarea aria-label="Notas" placeholder="Notas" className="w-full p-2 border rounded" rows={4} defaultValue={selected.content ?? ""} onChange={(e) => setSelected({ ...selected, content: e.target.value })} />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setSelected(null)}>Cancelar</Button>
                    <Button onClick={() => saveSelected({ title: selected.title, description: selected.description, content: selected.content })}>Salvar</Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Selecione um asset para editar metadados</p>
              )}
            </CardContent>
          </Card>

          <div className="mt-4">
            <Uploader clientId={clientId} onUploaded={async (m: MediaUploadResult) => {
              await createBrandingFromMedia({ url: m.url, thumbUrl: m.thumbUrl, title: m.title ?? m.fileName, colors: m.colors ?? null });
            }} />
          </div>
        </aside>

        <main className="col-span-6">
          <CanvasPreview />
        </main>

        <aside className="col-span-3">
          <div className="space-y-3">
            <Card className="studio-bg studio-shadow">
              <CardHeader>
                <CardTitle>Assets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {filtered.map((it) => (
                    <div
                      key={it.id}
                      onClick={() => setSelected(it)}
                      onDoubleClick={() => openViewer(it)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={async (e) => {
                        e.preventDefault();
                        const f = e.dataTransfer?.files?.[0];
                        if (!f) return;
                        const media = await uploadFileToMedia(f);
                        if (media?.url) {
                          await fetch(`/api/clients/${clientId}/branding?brandingId=${it.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ fileUrl: media.url, thumbUrl: media.thumbUrl ?? undefined, palette: media.colors ?? undefined }),
                          });
                          invalidateBranding();
                        }
                      }}
                    >
                      <AssetCard title={it.title} thumb={it.thumbUrl ?? it.fileUrl ?? undefined} palette={it.palette ?? undefined} selected={selectedIds.has(it.id)} onToggleSelect={() => toggleSelect(it.id)} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>

      {/* viewer modal */}
      {viewerOpen && viewerItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={closeViewer}>
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto m-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white truncate">{viewerItem.title}</h3>
                  {viewerItem.description && <p className="text-sm text-slate-500 mt-1">{viewerItem.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {viewerItem.fileUrl && (<a href={viewerItem.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"><span>Baixar</span></a>)}
                  <Button size="sm" onClick={() => { openEditModal(viewerItem); closeViewer(); }}>Editar</Button>
                  <Button variant="ghost" size="sm" onClick={() => closeViewer()}>Fechar</Button>
                </div>
              </div>
              <div className="w-full bg-slate-50 dark:bg-slate-800 rounded-md p-4">
                {viewerItem.fileUrl && viewerItem.fileUrl.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)$/) ? (
                  <Image src={viewerItem.fileUrl} alt={viewerItem.title} width={1200} height={720} className="w-full h-auto object-contain rounded" sizes="100vw" />
                ) : viewerItem.fileUrl && viewerItem.fileUrl.match(/\.(mp4|mov|avi|webm|mkv|flv|mpeg)$/) ? (
                  <video src={viewerItem.fileUrl} controls className="w-full h-auto rounded" />
                ) : viewerItem.fileUrl ? (
                  <iframe title={viewerItem.title} src={viewerItem.fileUrl} className="w-full h-[70vh] border rounded" />
                ) : (
                  <div className="text-sm text-slate-600">Sem arquivo para visualização.</div>
                )}
              </div>
              {viewerItem.palette && viewerItem.palette.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {viewerItem.palette.map((c) => (
                    <svg key={c} className="w-6 h-6 rounded" viewBox="0 0 16 16" role="img" aria-label={c}>
                      <title>{c}</title>
                      <rect width="16" height="16" fill={c} rx="3" ry="3" />
                    </svg>
                  ))}
                </div>
              )}
              {viewerItem.content && (<div className="text-sm text-slate-600">{viewerItem.content}</div>)}
              <div className="flex justify-end gap-2">
                <Button variant="destructive" onClick={() => { if (viewerItem) handleDelete(viewerItem.id); closeViewer(); }}>Excluir</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* create/edit modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto m-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">{editing ? 'Editar Item' : 'Novo Item de Branding'}</h2>
                <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>Fechar</Button>
              </div>
              <form onSubmit={handleModalSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium">Tipo</label>
                  <select aria-label="Tipo" title="Tipo" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full p-2 border rounded">
                    <option value="logo">Logotipo</option>
                    <option value="color-palette">Paleta de Cores</option>
                    <option value="typography">Tipografia</option>
                    <option value="manual">Manual</option>
                    <option value="template">Template</option>
                    <option value="asset">Asset</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium">Título</label>
                  <input aria-label="Título" title="Título" placeholder="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full p-2 border rounded" required />
                </div>
                <div>
                  <label className="block text-xs font-medium">Descrição</label>
                  <input aria-label="Descrição" title="Descrição" placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="block text-xs font-medium">Arquivo (URL)</label>
                  <input value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} className="w-full p-2 border rounded" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-xs font-medium">Enviar Arquivo</label>
                  <input aria-label="Enviar arquivo" title="Enviar arquivo" type="file" onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const m = await uploadFileToMedia(f);
                    if (m) setForm({ ...form, fileUrl: m.url ?? '', thumbUrl: m.thumbUrl ?? undefined, palette: m.colors ?? undefined });
                  }} />
                </div>
                <div>
                  <label className="block text-xs font-medium">Notas / Conteúdo</label>
                  <textarea aria-label="Notas" title="Notas" placeholder="Notas" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="w-full p-2 border rounded" rows={4} />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                  <Button type="submit">{editing ? 'Atualizar' : 'Criar'}</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
