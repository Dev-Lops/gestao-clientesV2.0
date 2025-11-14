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
import { Textarea } from "@/components/ui/textarea";
import { AppRole, can } from "@/lib/permissions";
import { fetcher } from "@/lib/swr";
import {
  Download,
  Edit,
  FileImage,
  FileText,
  Folder,
  Layout,
  Palette,
  Plus,
  Trash2,
  Type,
  X,
} from "lucide-react";
import { useState } from "react";
import useSWR from "swr";

type BrandingType =
  | "logo"
  | "color-palette"
  | "typography"
  | "manual"
  | "template"
  | "asset";

interface Branding {
  id: string;
  title: string;
  type: BrandingType;
  description?: string;
  fileUrl?: string;
  content?: string;
  createdAt: Date;
}

interface BrandingManagerProps {
  clientId: string;
  initialBranding?: Branding[];
}

export function BrandingManager({
  clientId,
  initialBranding = [],
}: BrandingManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Branding | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerItem, setViewerItem] = useState<Branding | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "logo" as BrandingType,
    fileUrl: "",
    content: "",
  });

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      type: "logo",
      fileUrl: "",
      content: "",
    });
    setEditing(null);
  };

  const openViewer = (item: Branding) => {
    setViewerItem(item);
    setViewerOpen(true);
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setViewerItem(null);
  };

  const getMediaTypeFromUrl = (url?: string | null) => {
    if (!url) return "document" as const;
    const lower = url.split("?")[0].toLowerCase();
    if (lower.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)$/)) return "image";
    if (lower.match(/\.(mp4|mov|avi|webm|mkv|flv|mpeg)$/)) return "video";
    if (lower.match(/\.(pdf)$/)) return "document";
    return "document";
  };

  async function handleFileUpload(file: File) {
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", file.name);
      const res = await fetch(`/api/clients/${clientId}/media/upload`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error || "Upload falhou");
      }
      const media = await res.json();
      // media.url is expected
      if (media?.url) {
        setForm((f) => ({ ...f, fileUrl: media.url }));
      }
      return media;
    } catch (e: unknown) {
      console.error("Upload error:", e);
      const msg = e instanceof Error ? e.message : String(e);
      setUploadError(msg);
      return null;
    } finally {
      setUploading(false);
    }
  }
  // SWR: session (for role) and branding list
  const { data: session } = useSWR<{
    user: unknown;
    orgId: string | null;
    role: AppRole | null;
  }>("/api/session", fetcher);
  const { data, error, isLoading, mutate } = useSWR<Branding[]>(
    `/api/clients/${clientId}/branding`,
    fetcher,
    { fallbackData: initialBranding },
  );

  const items = data ?? [];
  const role = session?.role ?? null;
  const canCreate = role ? can(role, "create", "branding") : false;
  const canUpdate = role ? can(role, "update", "branding") : false;
  const canDelete = role ? can(role, "delete", "branding") : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      try {
        const res = await fetch(
          `/api/clients/${clientId}/branding?brandingId=${editing.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          },
        );
        if (!res.ok) throw new Error("Falha ao atualizar item");
        const updated = await res.json();
        await mutate(
          (prev) =>
            (prev ?? []).map((i) =>
              i.id === editing.id
                ? {
                  ...i,
                  title: String(updated.title ?? i.title),
                  type: (updated.type as BrandingType) ?? i.type,
                  description:
                    (updated.description as string | undefined) ??
                    i.description,
                  fileUrl:
                    (updated.fileUrl as string | undefined) ?? i.fileUrl,
                  content:
                    (updated.content as string | undefined) ?? i.content,
                }
                : i,
            ),
          { revalidate: false },
        );
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
        if (!res.ok) throw new Error("Falha ao criar item");
        const created = await res.json();
        const newItem: Branding = {
          id: String(created.id),
          title: String(created.title ?? form.title),
          type: (created.type as BrandingType) ?? form.type,
          description:
            (created.description as string | undefined) ??
            (form.description || undefined),
          fileUrl:
            (created.fileUrl as string | undefined) ??
            (form.fileUrl || undefined),
          content:
            (created.content as string | undefined) ??
            (form.content || undefined),
          createdAt: new Date(
            String(created.createdAt ?? new Date().toISOString()),
          ),
        };
        await mutate([newItem, ...(items ?? [])], { revalidate: false });
      } catch {
        // noop
      }
    }
    setIsModalOpen(false);
    resetForm();
  };

  const handleEdit = (item: Branding) => {
    setEditing(item);
    setForm({
      title: item.title,
      description: item.description || "",
      type: item.type,
      fileUrl: item.fileUrl || "",
      content: item.content || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir item de branding?")) return;
    try {
      const res = await fetch(
        `/api/clients/${clientId}/branding?brandingId=${id}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Falha ao excluir");
      await mutate((prev) => (prev ?? []).filter((i) => i.id !== id), {
        revalidate: false,
      });
    } catch {
      // noop
    }
  };

  const iconFor = (type: BrandingType) => {
    switch (type) {
      case "logo":
        return <FileImage className="h-5 w-5" />;
      case "color-palette":
        return <Palette className="h-5 w-5" />;
      case "typography":
        return <Type className="h-5 w-5" />;
      case "manual":
        return <FileText className="h-5 w-5" />;
      case "template":
        return <Layout className="h-5 w-5" />;
      case "asset":
        return <Folder className="h-5 w-5" />;
    }
  };

  const titleFor = (type: BrandingType) => {
    switch (type) {
      case "logo":
        return "Logotipos";
      case "color-palette":
        return "Paleta de Cores";
      case "typography":
        return "Tipografia";
      case "manual":
        return "Manual da Marca";
      case "template":
        return "Templates";
      case "asset":
        return "Assets Diversos";
    }
  };

  const types: BrandingType[] = [
    "logo",
    "color-palette",
    "typography",
    "manual",
    "template",
    "asset",
  ];

  return (
    <>
      <div className="relative bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-900">
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
          <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000" />
        </div>

        <div className="relative space-y-6 p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                Branding
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Identidade visual e materiais de marca
              </p>
            </div>
            {canCreate && (
              <Button
                className="gap-2 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                onClick={() => {
                  resetForm();
                  setIsModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Adicionar Asset
              </Button>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {types.map((type) => {
              const list = items.filter((i) => i.type === type);
              return (
                <Card key={type}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      {iconFor(type)}
                      {titleFor(type)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {list.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        Nenhum item
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {list.map((item) => (
                          <div
                            key={item.id}
                            className="p-3 border rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div
                                className="flex-1 min-w-0 cursor-pointer"
                                onClick={() => openViewer(item)}
                              >
                                <h4 className="font-medium text-sm text-slate-900 truncate">
                                  {item.title}
                                </h4>
                                {item.description && (
                                  <p className="text-xs text-slate-600 mt-1">
                                    {item.description}
                                  </p>
                                )}
                                {item.content && (
                                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                    {item.content}
                                  </p>
                                )}
                                {item.fileUrl && (
                                  <a
                                    href={item.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline mt-2 inline-flex items-center gap-1"
                                    aria-label={`Baixar ${item.title}`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Download className="h-3 w-3" /> Baixar
                                  </a>
                                )}
                              </div>
                              <div className="flex gap-1">
                                {canUpdate && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEdit(item);
                                    }}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                )}
                                {canDelete && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(item.id);
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Loading and error states */}
          {isLoading && (
            <div className="text-sm text-slate-500">Carregando branding…</div>
          )}
          {error && (
            <div className="text-sm text-red-600">
              Falha ao carregar branding
            </div>
          )}

          {isModalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
              onClick={() => setIsModalOpen(false)}
            >
              <div
                className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto m-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold">
                        {editing ? "Editar Item" : "Novo Item de Branding"}
                      </h2>
                      <p className="text-sm text-slate-500 mt-1">
                        Adicione logotipos, cores, tipografia, manuais e outros
                        assets.
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsModalOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Tipo</Label>
                      <Select
                        value={form.type}
                        onValueChange={(value) =>
                          setForm({ ...form, type: value as BrandingType })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="logo">Logotipo</SelectItem>
                          <SelectItem value="color-palette">
                            Paleta de Cores
                          </SelectItem>
                          <SelectItem value="typography">Tipografia</SelectItem>
                          <SelectItem value="manual">Manual</SelectItem>
                          <SelectItem value="template">Template</SelectItem>
                          <SelectItem value="asset">Asset</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="title">Título</Label>
                      <Input
                        id="title"
                        value={form.title}
                        onChange={(e) =>
                          setForm({ ...form, title: e.target.value })
                        }
                        required
                        placeholder="Ex: Logo Principal"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição (opcional)</Label>
                      <Input
                        id="description"
                        value={form.description}
                        onChange={(e) =>
                          setForm({ ...form, description: e.target.value })
                        }
                        placeholder="Breve descrição"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fileUrl">URL do Arquivo (opcional)</Label>
                      <Input
                        id="fileUrl"
                        type="url"
                        value={form.fileUrl}
                        onChange={(e) =>
                          setForm({ ...form, fileUrl: e.target.value })
                        }
                        placeholder="https://..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="file">Enviar Arquivo (opcional)</Label>
                      <input
                        id="file"
                        title="Enviar arquivo"
                        aria-label="Enviar arquivo"
                        type="file"
                        accept="image/*,video/*,application/pdf"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          await handleFileUpload(f);
                        }}
                        className="block w-full text-sm text-slate-700"
                      />
                      {uploading && (
                        <div className="text-sm text-slate-500">Enviando...</div>
                      )}
                      {uploadError && (
                        <div className="text-sm text-red-600">{uploadError}</div>
                      )}
                      {form.fileUrl && (
                        <div className="text-xs text-slate-600 mt-1">
                          Arquivo associado: <a href={form.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Ver / Baixar</a>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="content">Detalhes/Notas (opcional)</Label>
                      <Textarea
                        id="content"
                        rows={4}
                        value={form.content}
                        onChange={(e) =>
                          setForm({ ...form, content: e.target.value })
                        }
                        placeholder="Cores: #FF0000, #00FF00..."
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsModalOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={editing ? !canUpdate : !canCreate}
                        className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
                      >
                        {editing ? "Atualizar" : "Criar"}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {viewerOpen && viewerItem && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
              onClick={closeViewer}
            >
              <div
                className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto m-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white truncate">
                        {viewerItem.title}
                      </h3>
                      {viewerItem.description && (
                        <p className="text-sm text-slate-500 mt-1">
                          {viewerItem.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {viewerItem.fileUrl && (
                        <a
                          href={viewerItem.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Download className="h-4 w-4" /> Baixar
                        </a>
                      )}
                      {canUpdate && (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            closeViewer();
                            handleEdit(viewerItem);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => closeViewer()}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="w-full bg-slate-50 dark:bg-slate-800 rounded-md p-4">
                    {getMediaTypeFromUrl(viewerItem.fileUrl) === "image" && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={viewerItem.fileUrl || ""}
                        alt={viewerItem.title}
                        className="w-full h-auto object-contain rounded"
                      />
                    )}
                    {getMediaTypeFromUrl(viewerItem.fileUrl) === "video" && (
                      <video
                        src={viewerItem.fileUrl || ""}
                        controls
                        className="w-full h-auto rounded"
                      />
                    )}
                    {getMediaTypeFromUrl(viewerItem.fileUrl) === "document" && (
                      <div className="prose max-w-none">
                        {viewerItem.fileUrl ? (
                          <iframe
                            title={viewerItem.title}
                            src={viewerItem.fileUrl}
                            className="w-full h-[70vh] border rounded"
                          />
                        ) : (
                          <p className="text-sm text-slate-600">Sem arquivo para visualização.</p>
                        )}
                      </div>
                    )}
                  </div>

                  {viewerItem.content && (
                    <div className="text-sm text-slate-600">
                      {viewerItem.content}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
