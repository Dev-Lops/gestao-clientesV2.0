"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  createDashboardNote,
  deleteDashboardNote,
  updateDashboardNote,
} from "@/modules/dashboard/actions/dashboardNotes";
import { AlertCircle, Edit, Loader2, Plus, StickyNote, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

const colorOptions = [
  { value: "yellow", label: "Amarelo", bg: "bg-yellow-100", border: "border-yellow-300", text: "text-yellow-900" },
  { value: "blue", label: "Azul", bg: "bg-blue-100", border: "border-blue-300", text: "text-blue-900" },
  { value: "green", label: "Verde", bg: "bg-green-100", border: "border-green-300", text: "text-green-900" },
  { value: "pink", label: "Rosa", bg: "bg-pink-100", border: "border-pink-300", text: "text-pink-900" },
  { value: "purple", label: "Roxo", bg: "bg-purple-100", border: "border-purple-300", text: "text-purple-900" },
];

interface DashboardNotesProps {
  initialNotes?: Note[];
}

export function DashboardNotes({ initialNotes = [] }: DashboardNotesProps) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    color: "yellow",
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string>("");

  // Sync local state with server data
  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  const handleOpenDialog = (note?: Note) => {
    setValidationError("");
    if (note) {
      setEditingNote(note);
      setFormData({
        title: note.title || "",
        content: note.content || "",
        color: note.color || "yellow",
      });
    } else {
      setEditingNote(null);
      setFormData({
        title: "",
        content: "",
        color: "yellow",
      });
    }
    setDialogOpen(true);
  };

  const validateForm = () => {
    const trimmedTitle = formData.title.trim();
    const trimmedContent = formData.content.trim();

    if (!trimmedContent) {
      setValidationError("O conteúdo da nota é obrigatório");
      return false;
    }

    if (trimmedContent.length > 1000) {
      setValidationError("O conteúdo não pode ter mais de 1000 caracteres");
      return false;
    }

    if (trimmedTitle.length > 100) {
      setValidationError("O título não pode ter mais de 100 caracteres");
      return false;
    }

    setValidationError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading(
      editingNote ? "Atualizando nota..." : "Criando nota..."
    );

    try {
      const trimmedData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        color: formData.color,
      };

      if (editingNote) {
        const updatedNote = await updateDashboardNote(editingNote.id, trimmedData);
        toast.success("Nota atualizada com sucesso!", { id: toastId });

        // Update local state optimistically
        setNotes(prev =>
          prev.map(n => n.id === updatedNote.id ? {
            ...n,
            title: updatedNote.title,
            content: updatedNote.content,
            color: updatedNote.color || 'yellow',
            updatedAt: updatedNote.updatedAt
          } : n)
        );
      } else {
        const newNote = await createDashboardNote(trimmedData);
        toast.success("Nota criada com sucesso!", { id: toastId });

        // Update local state optimistically
        setNotes(prev => [...prev, {
          id: newNote.id,
          title: newNote.title,
          content: newNote.content,
          color: newNote.color || 'yellow',
          position: newNote.position,
          createdAt: newNote.createdAt,
          updatedAt: newNote.updatedAt
        }]);
      }

      setDialogOpen(false);
      setFormData({ title: "", content: "", color: "yellow" });
      setEditingNote(null);

      // Refresh to ensure sync with server
      router.refresh();
    } catch (error) {
      console.error("Erro ao salvar nota:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error(`Erro ao salvar nota: ${errorMessage}`, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir esta nota?")) return;

    setDeleting(id);
    const toastId = toast.loading("Excluindo nota...");

    try {
      await deleteDashboardNote(id);
      toast.success("Nota excluída com sucesso!", { id: toastId });

      // Update local state optimistically
      setNotes(prev => prev.filter(n => n.id !== id));

      // Refresh to ensure sync with server
      router.refresh();
    } catch (error) {
      console.error("Erro ao excluir nota:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error(`Erro ao excluir nota: ${errorMessage}`, { id: toastId });
    } finally {
      setDeleting(null);
    }
  };

  const getColorClasses = (color: string) => {
    const colorOption = colorOptions.find((c) => c.value === color);
    return colorOption || colorOptions[0];
  };

  return (
    <>
      <Card variant="elevated" hover className="h-full flex flex-col border border-slate-200/80 dark:border-slate-800/70">
        <CardHeader className="shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-300 ring-1 ring-amber-100 dark:ring-amber-500/30">
                <StickyNote className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg">Notas Rápidas</CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400">Organize lembretes curtos e ideias em um só lugar</p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => handleOpenDialog()}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nova</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          {notes.length === 0 ? (
            <div className="text-center py-8">
              <StickyNote className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                Nenhuma nota criada
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                Organize suas ideias e lembretes aqui
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {notes.map((note) => {
                const colorClasses = getColorClasses(note.color);
                const displayTitle = (note.title || '').trim().length > 0
                  ? (note.title || '').trim()
                  : (() => {
                    const firstLine = (note.content || '').split('\n')[0].trim()
                    return firstLine.length > 0 ? firstLine.slice(0, 60) : 'Sem título'
                  })()
                const isDeleting = deleting === note.id;

                return (
                  <div
                    key={note.id}
                    className={`${colorClasses.bg} ${colorClasses.border} ${colorClasses.text} border rounded-lg p-4 shadow-sm hover:shadow-md transition-all relative group glass-surface ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    {isDeleting && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 rounded-lg">
                        <Loader2 className="h-6 w-6 animate-spin text-slate-600" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenDialog(note)}
                        className="h-7 w-7 p-0 hover:bg-white/50"
                        disabled={isDeleting}
                        aria-label="Editar nota"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(note.id)}
                        className="h-7 w-7 p-0 hover:bg-white/50 hover:text-red-600"
                        disabled={isDeleting}
                        aria-label="Excluir nota"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <h4 className="font-bold text-sm mb-2 pr-16 wrap-break-word">
                      {displayTitle}
                    </h4>
                    <p className="text-xs whitespace-pre-wrap wrap-break-word">
                      {note.content}
                    </p>
                    <p className="text-[10px] mt-3 opacity-60">
                      {new Date(note.updatedAt).toLocaleDateString("pt-BR", {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StickyNote className="h-5 w-5 text-yellow-600" />
              {editingNote ? "Editar Nota" : "Nova Nota"}
            </DialogTitle>
            <DialogDescription>
              {editingNote
                ? "Atualize o conteúdo da sua nota"
                : "Crie uma nota rápida para organizar suas ideias"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {validationError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">
                Título <span className="text-xs text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  setValidationError("");
                }}
                placeholder="Ex: Ideias, Tarefas, Lembretes..."
                maxLength={100}
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground">
                {formData.title.length}/100 caracteres
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Cor</Label>
              <Select
                value={formData.color}
                onValueChange={(value) =>
                  setFormData({ ...formData, color: value })
                }
                disabled={submitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded ${option.bg} ${option.border} border`} />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">
                Conteúdo <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => {
                  setFormData({ ...formData, content: e.target.value });
                  setValidationError("");
                }}
                placeholder="Digite o conteúdo da nota..."
                rows={6}
                maxLength={1000}
                disabled={submitting}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {formData.content.length}/1000 caracteres
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setValidationError("");
                }}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting || !formData.content.trim()}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingNote ? "Atualizar" : "Criar Nota"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
