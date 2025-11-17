"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { AppRole, can } from "@/lib/permissions";
import { fetcher } from "@/lib/swr";
import {
  ArrowLeft,
  ChevronRight,
  Download,
  Edit,
  Eye,
  File,
  FileImage,
  FileText,
  Film,
  Folder,
  FolderPlus,
  Home,
  Image as ImageIcon,
  Play,
  Tag,
  Trash2,
  Upload,
  X
} from "lucide-react";
import Image from "next/image";
import { DragEvent, useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";

type MediaType = "image" | "video" | "document";

interface MediaItem {
  id: string;
  type: MediaType;
  title: string;
  url: string | null;
  thumbUrl?: string | null;
  description?: string | null;
  fileKey?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  folderId?: string | null;
  folder?: { id: string; name: string } | null;
  tags?: string[];
  metadata?: Record<string, unknown> | null;
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

interface UploadProgress {
  fileName: string;
  progress: number;
  total: number;
}

export function MediaManager({ clientId }: MediaManagerProps) {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderHistory, setFolderHistory] = useState<(string | null)[]>([null]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [editingFolder, setEditingFolder] = useState<MediaFolder | null>(null);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  // const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const [dragOverRoot, setDragOverRoot] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [folderForm, setFolderForm] = useState({ name: "", description: "" });
  const [uploadForm, setUploadForm] = useState({
    files: [] as File[],
    title: "",
    description: "",
    tags: [] as string[],
    tagInput: "",
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

  // Navegação com histórico
  const navigateToFolder = useCallback((folderId: string | null) => {
    setCurrentFolderId(folderId);
    setFolderHistory((prev) => [...prev, folderId]);
  }, []);

  const navigateBack = useCallback(() => {
    if (folderHistory.length > 1) {
      const newHistory = [...folderHistory];
      newHistory.pop(); // Remove o atual
      const previousFolder = newHistory[newHistory.length - 1];
      setFolderHistory(newHistory);
      setCurrentFolderId(previousFolder);
    }
  }, [folderHistory]);

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

  const visibleFolders = allFolders.filter(
    (f) => f.parentId === currentFolderId,
  );

  const filtered = items.filter((i) => {
    if (search) {
      const searchLower = search.toLowerCase();
      const matchTitle = i.title.toLowerCase().includes(searchLower);
      const matchDesc = i.description?.toLowerCase().includes(searchLower);
      const matchTags = i.tags?.some((tag) =>
        tag.toLowerCase().includes(searchLower),
      );
      return matchTitle || matchDesc || matchTags;
    }
    return true;
  });

  const resetFolderForm = () => {
    setFolderForm({ name: "", description: "" });
    setEditingFolder(null);
  };

  const resetUploadForm = () => {
    setUploadForm({
      files: [],
      title: "",
      description: "",
      tags: [],
      tagInput: "",
    });
    setEditingItem(null);
    setUploadProgress([]);
  };

  // Drag and drop para upload - com contador para evitar flickering
  const dragCounterRef = useRef(0);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes('Files')) {
      setDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setDragOver(false);

      if (!canCreate) return;

      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) {
        setUploadForm((prev) => ({
          ...prev,
          files: droppedFiles,
          title: droppedFiles.length === 1 ? droppedFiles[0].name : "",
        }));
        setIsUploadModalOpen(true);
      }
    },
    [canCreate],
  );

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;
    try {
      const url = editingFolder
        ? `/api/clients/${clientId}/media/folders?folderId=${editingFolder.id}`
        : `/api/clients/${clientId}/media/folders`;

      const res = await fetch(url, {
        method: editingFolder ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...folderForm, parentId: currentFolderId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Falha ao salvar pasta");
      }

      const saved = await res.json();

      if (editingFolder) {
        await mutateFolders(
          (prev) =>
            (prev ?? []).map((f) => (f.id === saved.id ? saved : f)),
          { revalidate: false },
        );
        toast.success("Pasta atualizada!");
      } else {
        // Revalidar a lista completa para evitar duplicação
        await mutateFolders();
        toast.success("Pasta criada!");
      }
      setIsFolderModalOpen(false);
      resetFolderForm();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Erro ao salvar pasta");
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate || uploadForm.files.length === 0) return;
    setUploading(true);

    try {
      const uploadPromises = uploadForm.files.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append(
          "title",
          uploadForm.files.length === 1 ? uploadForm.title || file.name : file.name,
        );
        formData.append("description", uploadForm.description);
        if (currentFolderId) formData.append("folderId", currentFolderId);
        if (uploadForm.tags.length > 0) {
          formData.append("tags", JSON.stringify(uploadForm.tags));
        }

        // Simular progresso (XMLHttpRequest para acompanhar upload real)
        return new Promise<MediaItem>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              setUploadProgress((prev) => {
                const updated = [...prev];
                const existing = updated.findIndex(
                  (p) => p.fileName === file.name,
                );
                if (existing >= 0) {
                  updated[existing] = {
                    fileName: file.name,
                    progress: e.loaded,
                    total: e.total,
                  };
                } else {
                  updated.push({
                    fileName: file.name,
                    progress: e.loaded,
                    total: e.total,
                  });
                }
                return updated;
              });
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              reject(new Error("Upload falhou"));
            }
          });

          xhr.addEventListener("error", () => reject(new Error("Erro de rede")));

          xhr.open("POST", `/api/clients/${clientId}/media/upload`);
          xhr.send(formData);
        });
      });

      const uploaded = await Promise.all(uploadPromises);
      await mutateMedia([...uploaded, ...items], { revalidate: false });
      toast.success(
        `${uploaded.length} arquivo${uploaded.length > 1 ? "s" : ""} enviado${uploaded.length > 1 ? "s" : ""}!`,
      );
      setIsUploadModalOpen(false);
      resetUploadForm();
    } catch (err: unknown) {
      const error = err as { message?: string; response?: { data?: { error?: string; details?: string } } };
      const errorMsg = error.response?.data?.error || error.message || "Erro no upload";
      const details = error.response?.data?.details;
      toast.error(details ? `${errorMsg}: ${details}` : errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleEditItem = (item: MediaItem) => {
    if (!canUpdate) return;
    setEditingItem(item);
    setUploadForm({
      files: [],
      title: item.title,
      description: item.description || "",
      tags: item.tags || [],
      tagInput: "",
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
            tags: uploadForm.tags,
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

  const handleEditFolder = (folder: MediaFolder) => {
    if (!canUpdate) return;
    setEditingFolder(folder);
    setFolderForm({
      name: folder.name,
      description: folder.description || "",
    });
    setIsFolderModalOpen(true);
  };

  // Drag and drop para mover itens
  const handleDragStartItem = (e: DragEvent<HTMLDivElement>, itemId: string) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("itemId", itemId);
    e.dataTransfer.setData("type", "media");
  };

  const handleDragStartFolder = (e: DragEvent<HTMLDivElement>, folderId: string) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("folderId", folderId);
    e.dataTransfer.setData("type", "folder");
  };

  const handleDropOnFolder = async (
    e: DragEvent<HTMLDivElement> | DragEvent<HTMLButtonElement>,
    targetFolderId: string | null,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolder(null);

    if (!canUpdate) return;

    const type = e.dataTransfer.getData("type");
    if (type === "media") {
      const itemId = e.dataTransfer.getData("itemId");
      if (!itemId) return;

      try {
        const res = await fetch(
          `/api/clients/${clientId}/media?mediaId=${itemId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ folderId: targetFolderId }),
          },
        );
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Falha ao mover");
        }
        await mutateMedia();
        toast.success(targetFolderId ? "Arquivo movido!" : "Arquivo movido para a raiz!");
      } catch (err: unknown) {
        toast.error((err as Error).message || "Erro ao mover arquivo");
      }
    } else if (type === "folder") {
      const folderId = e.dataTransfer.getData("folderId");
      if (!folderId || folderId === targetFolderId) return;

      try {
        const res = await fetch(
          `/api/clients/${clientId}/media/folders?folderId=${folderId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ parentId: targetFolderId }),
          },
        );
        if (!res.ok) throw new Error("Falha ao mover pasta");
        await mutateFolders();
        toast.success(targetFolderId ? "Pasta movida!" : "Pasta movida para a raiz!");
      } catch {
        toast.error("Erro ao mover pasta");
      }
    }
  };

  const handleAddTag = () => {
    if (uploadForm.tagInput.trim() && !uploadForm.tags.includes(uploadForm.tagInput.trim())) {
      setUploadForm((prev) => ({
        ...prev,
        tags: [...prev.tags, prev.tagInput.trim()],
        tagInput: "",
      }));
    }
  };

  const handleRemoveTag = (tag: string) => {
    setUploadForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
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
      <div
        className="relative bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-900"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
          <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000" />
        </div>

        {/* Drag overlay */}
        {dragOver && canCreate && (
          <div className="absolute inset-0 z-40 bg-blue-500/20 backdrop-blur-sm border-4 border-dashed border-blue-500 rounded-lg flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <Upload className="h-16 w-16 mx-auto mb-4 text-blue-600" />
              <p className="text-xl font-semibold text-blue-900 dark:text-blue-100">
                Solte os arquivos aqui para upload
              </p>
            </div>
          </div>
        )}

        <div className="relative space-y-6 p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {folderHistory.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={navigateBack}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
              )}
              <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                  Mídias
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Upload e organização de arquivos do cliente
                </p>
              </div>
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

          {/* Breadcrumb com drop zone */}
          <div className="flex items-center gap-2 text-sm">
            {breadcrumb.map((crumb, idx) => (
              <div key={crumb.id || "root"} className="flex items-center gap-2">
                {idx > 0 && <ChevronRight className="h-4 w-4 text-slate-400" />}
                <button
                  onClick={() => navigateToFolder(crumb.id)}
                  onDragOver={(e) => {
                    if (canUpdate) {
                      e.preventDefault();
                      e.stopPropagation();
                      const type = e.dataTransfer.types;
                      if (type.includes('itemid') || type.includes('folderid')) {
                        if (idx === 0 && currentFolderId !== null) {
                          setDragOverRoot(true);
                        } else if (crumb.id !== currentFolderId) {
                          setDragOverFolder(crumb.id);
                        }
                      }
                    }
                  }}
                  onDragLeave={(e) => {
                    e.stopPropagation();
                    setDragOverRoot(false);
                    setDragOverFolder(null);
                  }}
                  onDrop={(e) => {
                    if (canUpdate) {
                      setDragOverRoot(false);
                      handleDropOnFolder(e, crumb.id);
                    }
                  }}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-all ${(idx === 0 && dragOverRoot) || (dragOverFolder === crumb.id)
                    ? "bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500 scale-105 shadow-md"
                    : "hover:bg-white/50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                >
                  {idx === 0 ? (
                    <Home className="h-4 w-4" />
                  ) : (
                    <Folder className="h-4 w-4" />
                  )}
                  {crumb.name}
                  {idx === 0 && currentFolderId !== null && canUpdate && (
                    <span className="ml-1 text-xs text-slate-400">(arraste aqui para raiz)</span>
                  )}
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
                  placeholder="Buscar por nome, descrição ou tags..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="md:w-96 bg-white/50 dark:bg-slate-800/50"
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
                          draggable={canUpdate}
                          onDragStart={(e) => handleDragStartFolder(e, folder.id)}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (dragOverFolder !== folder.id) {
                              setDragOverFolder(folder.id);
                            }
                          }}
                          onDragLeave={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = e.clientX;
                            const y = e.clientY;
                            if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
                              setDragOverFolder(null);
                            }
                          }}
                          onDrop={(e) => handleDropOnFolder(e, folder.id)}
                          className={`group relative border rounded-lg p-4 transition-all cursor-pointer ${dragOverFolder === folder.id
                            ? "bg-blue-100 dark:bg-blue-900/30 border-blue-500 border-2 scale-105 shadow-lg"
                            : "bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700"
                            }`}
                          onClick={() => navigateToFolder(folder.id)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Folder className="h-5 w-5 text-amber-600" />
                                <span className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
                                  {folder.name}
                                </span>
                              </div>
                              {folder.description && (
                                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                                  {folder.description}
                                </p>
                              )}
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {folder._count?.media || 0} arquivo(s),{" "}
                                {folder._count?.children || 0} pasta(s)
                              </p>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {canUpdate && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  aria-label={`Editar pasta ${folder.name}`}
                                  title="Editar pasta"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditFolder(folder);
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
                                  aria-label={`Excluir pasta ${folder.name}`}
                                  title="Excluir pasta"
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
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Arquivos */}
                {(mediaLoading || foldersLoading) && (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <Spinner size="lg" variant="primary" />
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
                          draggable={canUpdate}
                          onDragStart={(e) => handleDragStartItem(e, item.id)}
                          className="group relative border rounded-lg overflow-hidden bg-white hover:bg-slate-50 transition-all hover:shadow-md"
                        >
                          {/* Preview thumbnail */}
                          {item.type === "image" && (item.thumbUrl || item.url) && (
                            <div
                              className="w-full h-32 bg-slate-100 cursor-pointer relative"
                              onClick={() => setPreviewItem(item)}
                            >
                              <Image
                                src={item.thumbUrl || item.url || ""}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          )}
                          {item.type === "video" && (
                            <div
                              className="w-full h-32 bg-slate-900 cursor-pointer flex items-center justify-center relative"
                              onClick={() => setPreviewItem(item)}
                            >
                              <Play className="h-12 w-12 text-white" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                            </div>
                          )}

                          <div className="p-3">
                            <div className="flex items-start justify-between gap-2 mb-2">
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
                              </div>
                              <div className="flex gap-1">
                                {canUpdate && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                    aria-label={`Editar ${item.title}`}
                                    title="Editar arquivo"
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
                                    aria-label={`Excluir ${item.title}`}
                                    title="Excluir arquivo"
                                    onClick={() => handleDeleteItem(item.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>

                            {item.description && (
                              <p className="text-xs text-slate-600 mb-2 line-clamp-2">
                                {item.description}
                              </p>
                            )}

                            {item.tags && item.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {item.tags.slice(0, 3).map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                                {item.tags.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{item.tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}

                            <div className="flex items-center justify-between text-xs text-slate-500">
                              {item.fileSize && (
                                <span>{(item.fileSize / 1024).toFixed(1)} KB</span>
                              )}
                              {item.url && (
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Download className="h-3 w-3" />
                                  Download
                                </a>
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

          {/* Modal Nova/Editar Pasta */}
          {isFolderModalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
              role="dialog"
              aria-modal="true"
              onClick={() => setIsFolderModalOpen(false)}
            >
              <div
                className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-md m-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 id="folder-modal-title" className="text-xl font-semibold">
                      {editingFolder ? "Editar Pasta" : "Nova Pasta"}
                    </h2>
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
                      <Button type="submit">
                        {editingFolder ? "Salvar" : "Criar"}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Modal Upload/Editar */}
          {isUploadModalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto"
              role="dialog"
              aria-modal="true"
              onClick={() => !uploading && setIsUploadModalOpen(false)}
            >
              <div
                className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-2xl m-4 my-8"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <h2 id="upload-modal-title" className="text-xl font-semibold">
                      {editingItem
                        ? "Editar Mídia"
                        : uploadForm.files.length > 1
                          ? `Upload de ${uploadForm.files.length} Arquivos`
                          : "Upload de Arquivo"}
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={uploading}
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
                        <Label htmlFor="file-upload">
                          Arquivos {uploadForm.files.length > 0 && `(${uploadForm.files.length})`}
                        </Label>
                        <input
                          ref={fileInputRef}
                          id="file-upload"
                          type="file"
                          multiple
                          required
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            setUploadForm({
                              ...uploadForm,
                              files,
                              title: files.length === 1 ? files[0].name : "",
                            });
                          }}
                          accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                          className="hidden"
                          aria-label="Selecionar arquivos para upload"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Selecionar Arquivos
                        </Button>
                        {uploadForm.files.length > 0 && (
                          <div className="space-y-1 max-h-32 overflow-y-auto border rounded-lg p-2">
                            {uploadForm.files.map((file, idx) => (
                              <div
                                key={idx}
                                className="text-xs text-slate-600 flex justify-between items-center py-1"
                              >
                                <span className="truncate flex-1">
                                  {file.name}
                                </span>
                                <span className="text-slate-400 ml-2">
                                  {(file.size / 1024).toFixed(1)} KB
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {uploadForm.files.length === 1 && !editingItem && (
                      <div className="space-y-2">
                        <Label htmlFor="title">Título</Label>
                        <Input
                          id="title"
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
                    )}

                    {editingItem && (
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
                    )}

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

                    <div className="space-y-2">
                      <Label htmlFor="tags">Tags</Label>
                      <div className="flex gap-2">
                        <Input
                          id="tags"
                          value={uploadForm.tagInput}
                          onChange={(e) =>
                            setUploadForm({
                              ...uploadForm,
                              tagInput: e.target.value,
                            })
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddTag();
                            }
                          }}
                          placeholder="Adicionar tag..."
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleAddTag}
                        >
                          <Tag className="h-4 w-4" />
                        </Button>
                      </div>
                      {uploadForm.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {uploadForm.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="cursor-pointer"
                              onClick={() => handleRemoveTag(tag)}
                            >
                              {tag}
                              <X className="h-3 w-3 ml-1" />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {uploading && uploadProgress.length > 0 && (
                      <div className="space-y-2">
                        <Label>Progresso do Upload</Label>
                        {uploadProgress.map((prog) => (
                          <div key={prog.fileName} className="space-y-1">
                            <div className="flex justify-between text-xs text-slate-600">
                              <span className="truncate">{prog.fileName}</span>
                              <span>
                                {((prog.progress / prog.total) * 100).toFixed(0)}%
                              </span>
                            </div>
                            <Progress
                              value={(prog.progress / prog.total) * 100}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={uploading}
                        onClick={() => setIsUploadModalOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={
                          uploading || (!editingItem && uploadForm.files.length === 0)
                        }
                      >
                        {uploading && (
                          <Spinner size="sm" />
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

          {/* Modal Preview - Fullscreen melhorado */}
          {previewItem && (
            <div
              className="fixed inset-0 z-50 bg-black"
              role="dialog"
              aria-modal="true"
              aria-labelledby="preview-title"
            >
              {/* Header com controles */}
              <div className="absolute top-0 left-0 right-0 z-20 bg-linear-to-b from-black/80 to-transparent p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 id="preview-title" className="font-semibold text-lg text-white truncate">
                      {previewItem.title}
                    </h3>
                    {previewItem.description && (
                      <p className="text-sm text-slate-300 truncate">
                        {previewItem.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    {previewItem.url && (
                      <a
                        href={previewItem.url}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </a>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="bg-white/10 hover:bg-white/20 text-white"
                      onClick={() => setPreviewItem(null)}
                      aria-label="Fechar preview"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Conteúdo principal - clicável para fechar */}
              <div
                className="absolute inset-0 flex items-center justify-center p-4 pt-24 pb-20"
                onClick={() => setPreviewItem(null)}
              >
                <div
                  className="relative w-full h-full flex items-center justify-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  {previewItem.type === "image" && previewItem.url && (
                    <Image
                      src={previewItem.url}
                      alt={previewItem.title}
                      className="max-w-full max-h-full object-contain rounded-lg shadow-2xl cursor-zoom-in"
                      onClick={() => {
                        // Abre em nova aba para zoom total
                        window.open(previewItem.url!, '_blank');
                      }}
                    />
                  )}

                  {previewItem.type === "video" && previewItem.url && (
                    <video
                      src={previewItem.url}
                      controls
                      className="max-w-full max-h-full rounded-lg shadow-2xl"
                      autoPlay
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}

                  {previewItem.type === "document" && previewItem.url && (
                    <div className="bg-slate-900 rounded-lg p-8 text-center max-w-md">
                      <FileText className="h-20 w-20 mx-auto mb-4 text-slate-400" />
                      <p className="text-white mb-4">Preview não disponível para este tipo de arquivo</p>
                      <a
                        href={previewItem.url}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        Baixar Arquivo
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer com metadata */}
              <div className="absolute bottom-0 left-0 right-0 z-20 bg-linear-to-t from-black/80 to-transparent p-4">
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
                  {previewItem.fileSize && (
                    <span className="flex items-center gap-1">
                      <File className="h-4 w-4" />
                      {(previewItem.fileSize / 1024 / 1024).toFixed(2)} MB
                    </span>
                  )}
                  {previewItem.mimeType && (
                    <span className="flex items-center gap-1">
                      {iconFor(previewItem.type)}
                      {previewItem.mimeType}
                    </span>
                  )}
                  {previewItem.tags && previewItem.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {previewItem.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="bg-white/20 text-white border-0">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
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
