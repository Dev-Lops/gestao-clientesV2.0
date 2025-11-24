"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useUser } from "@/context/UserContext";
import { cn } from "@/lib/utils";
import {
  Camera,
  Check,
  Mail,
  Shield,
  Trash2,
  Upload,
  User as UserIcon,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";

export function ProfileForm({
  initialName,
  initialImage,
}: {
  initialName: string | null;
  initialImage: string | null;
}) {
  const [name, setName] = useState(initialName ?? "");
  const [image, setImage] = useState(initialImage ?? "");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, refreshUser } = useUser();

  const hasChanges =
    name.trim() !== (initialName ?? "") || image !== (initialImage ?? "");

  // Função para salvar alterações do perfil
  const onSave = async () => {
    if (!hasChanges) {
      toast.info("Nenhuma alteração para salvar");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name?.trim() || null,
          image: image?.trim() || null,
        }),
        credentials: 'include'
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Falha ao atualizar perfil");
      }
      toast.success("Perfil atualizado com sucesso!");
      await refreshUser?.();
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message || "Erro ao salvar perfil");
    } finally {
      setLoading(false);
    }
  };

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação de tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo: 5MB");
      return;
    }

    // Validação de tipo
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(10);
      setImageError(false);

      console.log("Iniciando upload de avatar:", file.name, file.size, "bytes");

      // Criar FormData para enviar ao backend
      const formData = new FormData();
      formData.append("file", file);

      setUploadProgress(30);

      // Upload usando fetch com progresso simulado mais suave
      const uploadPromise = fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
        credentials: 'include'
      });

      // Simular progresso enquanto upload acontece
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev < 85) return prev + 5;
          return prev;
        });
      }, 200);

      const response = await uploadPromise;
      clearInterval(progressInterval);

      console.log("Resposta do servidor:", response.status);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error("Erro no upload:", error);
        throw new Error(error.error || `Erro ${response.status}`);
      }

      const result = await response.json();
      console.log("Upload concluído:", result);

      setUploadProgress(100);

      // Pequeno delay para mostrar 100% antes de limpar
      await new Promise((resolve) => setTimeout(resolve, 400));

      setImage(result.url);

      // Auto-salvar a imagem no perfil do usuário
      try {
        const saveRes = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: result.url,
          }),
          credentials: 'include'
        });

        if (saveRes.ok) {
          await refreshUser?.();
          toast.success("Foto atualizada com sucesso!");
        } else {
          toast.warning("Foto enviada, mas não foi salva. Clique em 'Salvar alterações'");
        }
      } catch (saveErr) {
        console.error("Erro ao salvar imagem no perfil:", saveErr);
        toast.warning("Foto enviada, mas não foi salva. Clique em 'Salvar alterações'");
      }
    } catch (err) {
      console.error("Erro completo no upload:", err);
      console.error(err);
      toast.error(
        (err as Error).message || "Falha ao enviar a imagem"
      );
      setImageError(true);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      // Reset input via ref to avoid "Cannot set properties of null" error
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative max-w-4xl mx-auto">
      {/* Background decorativo */}
      <div className="absolute -inset-4 bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl blur-2xl opacity-10" />

      <Card className="relative bg-white/90 backdrop-blur-sm dark:bg-slate-900/90 border-slate-200/50 dark:border-slate-700/50 shadow-2xl overflow-hidden">
        {/* Header com gradiente */}
        <div className="relative h-32 bg-linear-to-r from-blue-600 via-purple-600 to-pink-600">
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-linear-to-t from-white dark:from-slate-900" />
        </div>

        <CardContent className="relative -mt-20 px-6 sm:px-8 pb-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSave();
            }}
            className="space-y-8"
            aria-label="Formulário de perfil do usuário"
          >
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-6">
              <div className="relative group">
                {/* Avatar container com estados */}
                <div
                  className={cn(
                    "relative w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl transition-all duration-300",
                    uploading && "ring-4 ring-blue-500 ring-offset-2"
                  )}
                >
                  {uploading ? (
                    // Estado de upload
                    <div className="absolute inset-0 bg-linear-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                      <div className="text-center">
                        <Spinner size="lg" className="mb-2" />
                        <p className="text-xs font-medium text-white">
                          {uploadProgress}%
                        </p>
                      </div>
                    </div>
                  ) : image && !imageError ? (
                    // Imagem carregada
                    <>
                      {imageLoading && (
                        <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center z-10">
                          <Spinner size="lg" />
                        </div>
                      )}
                      <Image
                        src={image}
                        alt="Foto de perfil"
                        fill
                        sizes="128px"
                        className="object-cover"
                        onLoad={() => setImageLoading(false)}
                        onError={() => {
                          setImageError(true);
                          setImageLoading(false);
                        }}
                        onLoadStart={() => setImageLoading(true)}
                      />
                    </>
                  ) : (
                    // Fallback - Avatar com iniciais
                    <div className="absolute inset-0 bg-linear-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center">
                      <span className="text-4xl font-bold text-white">
                        {getInitials(name || initialName)}
                      </span>
                    </div>
                  )}

                  {/* Overlay de hover */}
                  {!uploading && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Camera className="h-8 w-8 text-white" />
                    </div>
                  )}
                </div>

                {/* Botão de upload flutuante */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || loading}
                  className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-linear-to-br from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group"
                  aria-label="Alterar foto de perfil"
                >
                  {uploading ? (
                    <Spinner size="sm" />
                  ) : (
                    <Upload className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  )}
                </button>

                <input
                  ref={fileInputRef}
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onPickFile}
                  disabled={uploading || loading}
                  aria-label="Selecionar foto de perfil"
                />
              </div>

              {/* Ações da foto */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || loading}
                  className="gap-2"
                >
                  <Camera className="h-4 w-4" />
                  Alterar foto
                </Button>
                {image && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setImage("");
                      setImageError(false);
                    }}
                    disabled={uploading || loading}
                    className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remover
                  </Button>
                )}
              </div>

              {imageError && (
                <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-lg">
                  <X className="h-4 w-4" />
                  <span>Imagem não suportada ou corrompida</span>
                </div>
              )}

              {uploading && (
                <div className="w-full max-w-xs">
                  <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-blue-600 to-purple-600 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-center mt-2 text-slate-600 dark:text-slate-400">
                    Enviando foto...
                  </p>
                </div>
              )}
            </div>

            {/* Informações do perfil */}
            <div className="grid gap-6 max-w-2xl mx-auto">
              {/* Nome */}
              <div className="space-y-3">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  <span>Nome completo</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Digite seu nome completo"
                  autoComplete="name"
                  disabled={loading || uploading}
                  className="h-12 text-base"
                  aria-required="true"
                />
              </div>

              {/* Email (read-only) */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  <span>Email</span>
                </Label>
                <div className="relative">
                  <Input
                    value={user?.email ?? ""}
                    disabled
                    className="h-12 text-base bg-slate-50 dark:bg-slate-800/50"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Shield className="h-4 w-4 text-emerald-600" />
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  Email verificado e protegido
                </p>
              </div>

              {/* Info card */}
              <div className="bg-linear-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200/50 dark:border-blue-800/50 rounded-xl p-4">
                <div className="flex gap-3">
                  <div className="shrink-0">
                    <div className="w-10 h-10 rounded-lg bg-linear-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                      Sua foto está segura
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Todas as fotos de perfil são armazenadas com segurança no
                      seu serviço de storage configurado (R2/S3) e não aparecem na galeria de mídias dos
                      clientes. Máximo: 5MB.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {hasChanges ? (
                  <span className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <span className="inline-block w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
                    Você tem alterações não salvas
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <Check className="h-4 w-4" />
                    Perfil atualizado
                  </span>
                )}
              </p>

              <div className="flex gap-3">
                {hasChanges && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setName(initialName ?? "");
                      setImage(initialImage ?? "");
                      setImageError(false);
                    }}
                    disabled={loading || uploading}
                    className="min-w-[120px]"
                  >
                    Cancelar
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={loading || uploading || !hasChanges}
                  className="min-w-40 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Salvar alterações
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
