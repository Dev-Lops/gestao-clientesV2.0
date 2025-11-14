"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/context/UserContext";
import { firebaseApp } from "@/lib/firebase";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
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

  const onSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, image }),
      });
      if (!res.ok) throw new Error("Falha ao salvar");
      // Recarrega usuário do Firebase para refletir displayName no Navbar
      try {
        await refreshUser();
      } catch {}
      toast.success("Perfil atualizado com sucesso");
    } catch {
      toast.error("Não foi possível atualizar o perfil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
      className="space-y-6"
    >
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="image">URL da foto</Label>
          <Input
            id="image"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://..."
          />
          <div className="flex items-center gap-3">
            <input
              id="file"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPickFile}
              aria-label="Selecionar foto de perfil"
            />
            <Label htmlFor="file" className="inline-flex">
              <Button
                type="button"
                variant="secondary"
                className="rounded-full"
                disabled={uploading}
              >
                {uploading ? "Enviando..." : "Enviar foto"}
              </Button>
            </Label>
            {image && (
              <Button
                type="button"
                variant="ghost"
                className="rounded-full text-red-600"
                onClick={() => setImage("")}
              >
                Remover
              </Button>
            )}
            {image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt="Prévia da foto de perfil"
                className="h-10 w-10 rounded-full object-cover border"
              />
            )}
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={loading} className="rounded-full">
          {loading ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}
