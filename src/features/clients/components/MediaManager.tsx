"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Textarea } from "@/components/ui/textarea";
import { AppRole, can } from "@/lib/permissions";
import { fetcher } from "@/lib/swr";
import {
  ChevronRight,
  Edit,
  File,
  FileImage,
  FileText,
  Film,
  Folder,
  FolderPlus,
  Home,
  Image as ImageIcon,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";

type MediaType = "image" | "video" | "document";

interface MediaItem {
  id: string;
  type: MediaType;
  title: string;
  url: string | null;
  description?: string | null;
  fileKey?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  folderId?: string | null;
  folder?: { id: string; name: string } | null;
  createdAt: Date | string;
}

interface MediaFolder {
  id: string;
  name: string;
  description?: string | null;
  parentId?: string | null;
  _count?: { media: number; children: number };
  createdAt: Date | string;
}

interface MediaManagerProps {
  clientId: string;
}

export function MediaManager({ clientId }: MediaManagerProps) {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);

  const [folderForm, setFolderForm] = useState({ name: "", description: "" });
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    title: "",
    description: "",
  });

  // SWR session + media + folders
  const { data: session } = useSWR<{
    user: unknown;
    orgId: string | null;
    role: AppRole | null;
  }>("/api/session", fetcher);
  const {
    data: media,
    error: mediaError,
    isLoading: mediaLoading,
    mutate: mutateMedia,
  } = useSWR<MediaItem[]>(
    `/api/clients/${clientId}/media?folderId=${currentFolderId || ""}`,
    fetcher,
  );

  const {
    data: folders,
    error: foldersError,
    isLoading: foldersLoading,
    mutate: mutateFolders,
  } = useSWR<MediaFolder[]>(`/api/clients/${clientId}/media/folders`, fetcher);

  const role = session?.role ?? null;
  const canCreate = role ? can(role, "create", "media") : false;
  const canUpdate = role ? can(role, "update", "media") : false;
  const canDelete = role ? can(role, "delete", "media") : false;

  const items = media ?? [];
  const allFolders = folders ?? [];

  // Breadcrumb: mostra caminho da pasta atual
  const breadcrumb: Array<{ id: string | null; name: string }> = [
    { id: null, name: "Raiz" },
  ];
  if (currentFolderId) {
    const folder = allFolders.find((f) => f.id === currentFolderId);
    if (folder) {
      const buildPath = (
        f: MediaFolder,
      ): Array<{ id: string; name: string }> => {
        const path: Array<{ id: string; name: string }> = [
          { id: f.id, name: f.name },
        ];
        if (f.parentId) {
          const parent = allFolders.find((p) => p.id === f.parentId);
          if (parent) path.unshift(...buildPath(parent));
        }
        return path;
      };
      breadcrumb.push(...buildPath(folder));
    }
  }

  // Pastas visíveis na pasta atual
  const visibleFolders = allFolders.filter(
    (f) => f.parentId === currentFolderId,
  );

  const filtered = items.filter((i) => {
    if (search && !i.title.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const resetFolderForm = () => {
    setFolderForm({ name: "", description: "" });
  };

  const resetUploadForm = () => {
    setUploadForm({ file: null, title: "", description: "" });
    setEditingItem(null);
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;
    try {
      const res = await fetch(`/api/clients/${clientId}/media/folders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...folderForm, parentId: currentFolderId }),
      });
      if (!res.ok) throw new Error("Falha ao criar pasta");
      const created = await res.json();
      await mutateFolders((prev) => [created, ...(prev ?? [])], {
        revalidate: false,
      });
      toast.success("Pasta criada!");
      setIsFolderModalOpen(false);
      resetFolderForm();
    } catch {
      toast.error("Erro ao criar pasta");
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate || !uploadForm.file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadForm.file);
      formData.append("title", uploadForm.title || uploadForm.file.name);
      formData.append("description", uploadForm.description);
      if (currentFolderId) formData.append("folderId", currentFolderId);

      const res = await fetch(`/api/clients/${clientId}/media/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Falha no upload");
      }
      const created = await res.json();
      await mutateMedia([created, ...(items ?? [])], { revalidate: false });
      toast.success("Upload concluído!");
      setIsUploadModalOpen(false);
      resetUploadForm();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Erro no upload");
    } finally {
      setUploading(false);
    }
  };

  const handleEditItem = (item: MediaItem) => {
    if (!canUpdate) return;
    setEditingItem(item);
    setUploadForm({
      file: null,
      title: item.title,
      description: item.description || "",
    });
    setIsUploadModalOpen(true);
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUpdate || !editingItem) return;
    try {
      const res = await fetch(
        `/api/clients/${clientId}/media?mediaId=${editingItem.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: uploadForm.title,
            description: uploadForm.description,
          }),
        },
      );
      if (!res.ok) throw new Error("Falha ao atualizar");
      const updated = await res.json();
      await mutateMedia(
        (prev) =>
          (prev ?? []).map((i) =>
            i.id === editingItem.id ? { ...i, ...updated } : i,
          ),
        { revalidate: false },
      );
      toast.success("Mídia atualizada!");
      setIsUploadModalOpen(false);
      resetUploadForm();
    } catch {
      toast.error("Erro ao atualizar");
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!canDelete || !confirm("Excluir mídia?")) return;
    try {
      const res = await fetch(`/api/clients/${clientId}/media?mediaId=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Falha ao excluir");
      await mutateMedia((prev) => (prev ?? []).filter((i) => i.id !== id), {
        revalidate: false,
      });
      toast.success("Mídia excluída!");
    } catch {
      toast.error("Erro ao excluir");
    }
  };

  const handleDeleteFolder = async (id: string) => {
    if (!canDelete || !confirm("Excluir pasta (e todo conteúdo)?")) return;
    try {
      const res = await fetch(
        `/api/clients/${clientId}/media/folders?folderId=${id}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Falha ao excluir pasta");
      await mutateFolders((prev) => (prev ?? []).filter((f) => f.id !== id), {
        revalidate: false,
      });
      toast.success("Pasta excluída!");
    } catch {
      toast.error("Erro ao excluir pasta");
    }
  };

  const iconFor = (type: MediaType) => {
    switch (type) {
      case "image":
        return <FileImage className="h-4 w-4" />;
      case "video":
        return <Film className="h-4 w-4" />;
      case "document":
        return <FileText className="h-4 w-4" />;
    }
  };

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
                Mídias
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Upload e organização de arquivos do cliente
              </p>
            </div>
            <div className="flex gap-2">
              {canCreate && (
                <>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      resetFolderForm();
                      setIsFolderModalOpen(true);
                    }}
                  >
                    <FolderPlus className="h-4 w-4" /> Nova Pasta
                  </Button>
                  <Button
                    className="gap-2 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                    onClick={() => {
                      resetUploadForm();
                      setIsUploadModalOpen(true);
                    }}
                  >
                    <Upload className="h-4 w-4" /> Upload
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            {breadcrumb.map((crumb, idx) => (
              <div key={crumb.id || "root"} className="flex items-center gap-2">
                {idx > 0 && <ChevronRight className="h-4 w-4 text-slate-400" />}
                <button
                  onClick={() => setCurrentFolderId(crumb.id)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  {idx === 0 ? (
                    <Home className="h-4 w-4" />
                  ) : (
                    <Folder className="h-4 w-4" />
                  )}
                  {crumb.name}
                </button>
              </div>
            ))}
          </div>

          {/* Main Card */}
          <div className="relative">
            <div className="absolute -inset-1 bg-linear-to-r from-blue-600 to-purple-600 rounded-3xl blur opacity-20" />
            <Card className="relative bg-white/80 backdrop-blur-sm dark:bg-slate-900/80 border-slate-200/50 dark:border-slate-700/50 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
                  <div className="relative">
                    <div className="absolute inset-0 bg-linear-to-tr from-blue-600 to-purple-600 rounded-lg blur-md opacity-30" />
                    <div className="relative w-10 h-10 bg-linear-to-tr from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shrink-0">
                      <ImageIcon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <span>Biblioteca de Mídias</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="md:w-64 bg-white/50 dark:bg-slate-800/50"
                />

                {/* Pastas */}
                {visibleFolders.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-medium text-slate-500 uppercase">
                      Pastas
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                      {visibleFolders.map((folder) => (
                        <div
                          key={folder.id}
                          className="group relative border rounded-lg p-4 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                          onClick={() => setCurrentFolderId(folder.id)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Folder className="h-5 w-5 text-amber-600" />
                                <span className="font-medium text-sm text-slate-900 truncate">
                                  {folder.name}
                                </span>
                              </div>
                              {folder.description && (
                                <p className="text-xs text-slate-600 line-clamp-1">
                                  {folder.description}
                                </p>
                              )}
                              <p className="text-xs text-slate-500 mt-1">
                                {folder._count?.media || 0} arquivo(s),{" "}
                                {folder._count?.children || 0} pasta(s)
                              </p>
                            </div>
                            {canDelete && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700 opacity-0 group-hover:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteFolder(folder.id);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Arquivos */}
                {(mediaLoading || foldersLoading) && (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <LoadingSpinner size="lg" />
                      <p className="text-sm text-slate-500">
                        Carregando arquivos...
                      </p>
                    </div>
                  </div>
                )}
                {(mediaError || foldersError) && (
                  <div className="text-sm text-red-600">Falha ao carregar</div>
                )}

                {filtered.length === 0 && !mediaLoading && (
                  <div className="text-center py-12 text-slate-500">
                    <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Nenhum arquivo nesta pasta</p>
                    <p className="text-sm mt-1">
                      Faça upload de imagens, vídeos ou documentos
                    </p>
                  </div>
                )}

                {filtered.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-medium text-slate-500 uppercase">
                      Arquivos
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                      {filtered.map((item) => (
                        <div
                          key={item.id}
                          className="group relative border rounded-lg p-3 bg-white hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1 text-xs text-slate-600">
                                {iconFor(item.type)}
                                <span>
                                  {item.type === "image"
                                    ? "Imagem"
                                    : item.type === "video"
                                      ? "Vídeo"
                                      : "Documento"}
                                </span>
                              </div>
                              <h4 className="font-medium text-sm text-slate-900 truncate">
                                {item.title}
                              </h4>
                              {item.description && (
                                <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                                  {item.description}
                                </p>
                              )}
                              {item.fileSize && (
                                <p className="text-xs text-slate-500 mt-1">
                                  {(item.fileSize / 1024).toFixed(1)} KB
                                </p>
                              )}
                              {item.url && (
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Abrir
                                </a>
                              )}
                            </div>
                            <div className="flex gap-1">
                              {canUpdate && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                  onClick={() => handleEditItem(item)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              )}
                              {canDelete && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700 opacity-0 group-hover:opacity-100"
                                  onClick={() => handleDeleteItem(item.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Modal Nova Pasta */}
          {isFolderModalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
              onClick={() => setIsFolderModalOpen(false)}
            >
              <div
                className="bg-white rounded-lg shadow-xl w-full max-w-md m-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Nova Pasta</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsFolderModalOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <form onSubmit={handleCreateFolder} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="folder-name">Nome</Label>
                      <Input
                        id="folder-name"
                        required
                        value={folderForm.name}
                        onChange={(e) =>
                          setFolderForm({ ...folderForm, name: e.target.value })
                        }
                        placeholder="Ex: Campanhas 2024"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="folder-desc">Descrição (opcional)</Label>
                      <Textarea
                        id="folder-desc"
                        rows={2}
                        value={folderForm.description}
                        onChange={(e) =>
                          setFolderForm({
                            ...folderForm,
                            description: e.target.value,
                          })
                        }
                        placeholder="Breve descrição"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsFolderModalOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit">Criar</Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Modal Upload/Editar */}
          {isUploadModalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
              onClick={() => setIsUploadModalOpen(false)}
            >
              <div
                className="bg-white rounded-lg shadow-xl w-full max-w-lg m-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">
                      {editingItem ? "Editar Mídia" : "Upload de Arquivo"}
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsUploadModalOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <form
                    onSubmit={editingItem ? handleUpdateItem : handleUpload}
                    className="space-y-4"
                  >
                    {!editingItem && (
                      <div className="space-y-2">
                        <Label htmlFor="file-upload">Arquivo</Label>
                        <Input
                          id="file-upload"
                          type="file"
                          required
                          onChange={(e) =>
                            setUploadForm({
                              ...uploadForm,
                              file: e.target.files?.[0] || null,
                            })
                          }
                          accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                        />
                        {uploadForm.file && (
                          <p className="text-xs text-slate-600">
                            {uploadForm.file.name} (
                            {(uploadForm.file.size / 1024).toFixed(1)} KB)
                          </p>
                        )}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="title">Título</Label>
                      <Input
                        id="title"
                        required
                        value={uploadForm.title}
                        onChange={(e) =>
                          setUploadForm({
                            ...uploadForm,
                            title: e.target.value,
                          })
                        }
                        placeholder="Nome do arquivo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="desc">Descrição (opcional)</Label>
                      <Textarea
                        id="desc"
                        rows={3}
                        value={uploadForm.description}
                        onChange={(e) =>
                          setUploadForm({
                            ...uploadForm,
                            description: e.target.value,
                          })
                        }
                        placeholder="Breve descrição"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsUploadModalOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={
                          uploading || (!editingItem && !uploadForm.file)
                        }
                      >
                        {uploading && (
                          <LoadingSpinner size="sm" className="mr-2" />
                        )}
                        {uploading
                          ? "Enviando..."
                          : editingItem
                            ? "Salvar"
                            : "Upload"}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
