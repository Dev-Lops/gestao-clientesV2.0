"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/context/UserContext";
import { firebaseApp } from "@/lib/firebase";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import Image from "next/image";
import { useState } from "react";
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
  const { refreshUser } = useUser();

  // Função para salvar alterações do perfil
  const onSave = async () => {
    try {
      setLoading(true);
      // Aqui você pode adicionar a lógica para salvar o nome e a imagem no backend ou contexto
      // Exemplo:
      // await updateUserProfile({ name, image });
      toast.success("Perfil atualizado com sucesso!");
      refreshUser?.();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar perfil");
    } finally {
      setLoading(false);
    }
  };

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!firebaseApp) {
      toast.error(
        "Armazenamento não configurado. Verifique variáveis de ambiente do Firebase.",
      );
      return;
    }
    try {
      setUploading(true);
      const storage = getStorage(firebaseApp);
      const ext = file.name.split(".").pop() || "jpg";
      const fileRef = ref(
        storage,
        `avatars/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`,
      );
      await uploadBytes(fileRef, file, { contentType: file.type });
      const url = await getDownloadURL(fileRef);
      setImage(url);
      toast.success("Foto enviada com sucesso");
    } catch (err) {
      console.error(err);
      toast.error("Falha ao enviar a imagem");
    } finally {
      setUploading(false);
      // reset input value so the same file can be chosen again if needed
      e.currentTarget.value = "";
    }
  };
  // Ref para input de arquivo
  const fileInputRef = useState<HTMLInputElement | null>(null);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setLoading(true);
        onSave();
      }}
      className="space-y-8 max-w-lg mx-auto bg-white dark:bg-slate-900 p-8 rounded-xl shadow-lg"
      aria-label="Formulário de perfil do usuário"
    >
      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
            autoComplete="name"
            aria-required="true"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="file">Foto de perfil</Label>
          <div className="flex items-center gap-4">
            <input
              id="file"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPickFile}
              aria-label="Selecionar foto de perfil"
              ref={el => fileInputRef[1](el)}
            />
            <Button
              type="button"
              variant="secondary"
              className="rounded-full"
              disabled={uploading}
              aria-label="Enviar foto de perfil"
              onClick={() => {
                if (fileInputRef[0]) fileInputRef[0].click();
              }}
            >
              {uploading ? "Enviando..." : "Enviar foto"}
            </Button>
            {image && (
              <Button
                type="button"
                variant="ghost"
                className="rounded-full text-red-600"
                onClick={() => setImage("")}
                aria-label="Remover foto de perfil"
              >
                Remover
              </Button>
            )}
            {image && (
              <Image src={image} alt="Prévia da foto de perfil" width={48} height={48} className="rounded-full object-cover border" sizes="48px" />
            )}
          </div>
          <span className="text-xs text-slate-500">A foto será enviada e usada como avatar.</span>
        </div>
      </div>
      <div className="flex justify-end mt-4">
        <Button type="submit" disabled={loading} className="rounded-full min-w-40 flex items-center justify-center gap-2">
          {loading ? (
            <svg className="animate-spin h-4 w-4 text-blue-600 mr-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : null}
          {loading ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}
