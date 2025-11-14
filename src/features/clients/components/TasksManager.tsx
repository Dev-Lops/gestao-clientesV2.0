"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDateInput, parseDateInput, toLocalISOString } from "@/lib/utils";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Edit,
  Flag,
  ListTodo,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type TaskStatus = "todo" | "in-progress" | "done";
type TaskPriority = "low" | "medium" | "high";

interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: string;
  dueDate?: string; // ISO date string
  createdAt: Date;
}

interface TasksManagerProps {
  clientId: string;
  initialTasks?: TaskItem[];
}

export function TasksManager({
  clientId,
  initialTasks = [],
}: TasksManagerProps) {
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<TaskItem | null>(null);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "todo" as TaskStatus,
    priority: "medium" as TaskPriority,
    assignee: "",
    dueDate: "",
  });

  // Fetch tasks from API
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch(`/api/clients/${clientId}/tasks`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Falha ao carregar tarefas");
        const data: unknown = await res.json();
        if (!active) return;
        if (!Array.isArray(data)) throw new Error("Resposta inválida");
        const parsed: TaskItem[] = (data as Array<Record<string, unknown>>).map(
          (t) => ({
            id: String(t.id),
            title: String(t.title ?? ""),
            description: (t.description as string | undefined) ?? undefined,
            status: (t.status as TaskStatus) ?? "todo",
            priority: (t.priority as TaskPriority) ?? "medium",
            assignee: (t.assignee as string | undefined) ?? undefined,
            dueDate: t.dueDate ? formatDateInput(String(t.dueDate)) : undefined,
            createdAt: new Date(String(t.createdAt)),
          }),
        );
        setTasks(parsed);
      } catch {
        // fallback: keep initialTasks if provided
        if (initialTasks.length) setTasks(initialTasks);
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [clientId, initialTasks]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const todo = tasks.filter((t) => t.status === "todo").length;
    const doing = tasks.filter((t) => t.status === "in-progress").length;
    const done = tasks.filter((t) => t.status === "done").length;
    return { total, todo, doing, done };
  }, [tasks]);

  const filtered = tasks.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
      assignee: "",
      dueDate: "",
    });
    setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Converte a data do input para objeto Date correto
    const taskData = {
      ...form,
      dueDate: form.dueDate
        ? toLocalISOString(parseDateInput(form.dueDate))
        : null,
    };

    if (editing) {
      try {
        const res = await fetch(
          `/api/clients/${clientId}/tasks?taskId=${editing.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(taskData),
          },
        );
        if (!res.ok) throw new Error("Falha ao atualizar tarefa");
        const updated = await res.json();
        setTasks((prev) =>
          prev.map((t) =>
            t.id === editing.id
              ? {
                  ...t,
                  title: updated.title,
                  description: updated.description ?? undefined,
                  status: updated.status,
                  priority: updated.priority,
                  assignee: updated.assignee ?? undefined,
                  dueDate: updated.dueDate
                    ? formatDateInput(updated.dueDate)
                    : undefined,
                }
              : t,
          ),
        );
      } catch {
        // noop; could show toast
      }
    } else {
      try {
        const res = await fetch(`/api/clients/${clientId}/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error("Falha ao criar tarefa");
        const created = await res.json();
        setTasks((prev) => [
          {
            id: created.id,
            title: created.title,
            description: created.description ?? undefined,
            status: created.status,
            priority: created.priority,
            assignee: created.assignee ?? undefined,
            dueDate: created.dueDate
              ? formatDateInput(created.dueDate)
              : undefined,
            createdAt: new Date(created.createdAt),
          },
          ...prev,
        ]);
      } catch {
        // noop; could show toast
      }
    }
    setIsModalOpen(false);
    resetForm();
  };

  const handleEdit = (task: TaskItem) => {
    setEditing(task);
    setForm({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      assignee: task.assignee || "",
      dueDate: task.dueDate || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir tarefa?")) return;
    try {
      const res = await fetch(`/api/clients/${clientId}/tasks?taskId=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Falha ao excluir tarefa");
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch {
      // noop
    }
  };

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    try {
      const res = await fetch(`/api/clients/${clientId}/tasks?taskId=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Falha ao atualizar status");
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    } catch {
      // noop
    }
  };

  if (loading) {
    return (
      <div className="relative bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-900">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
          <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
        </div>

        <div className="relative flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-linear-to-tr from-blue-600 to-purple-600 rounded-xl blur-md opacity-50" />
              <div className="relative w-16 h-16 bg-linear-to-tr from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <LoadingSpinner size="lg" className="text-white" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Carregando tarefas...
            </p>
          </div>
        </div>
      </div>
    );
  }

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
                Tarefas
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Gerencie as tarefas deste cliente
              </p>
            </div>
            <Button
              className="gap-2 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> Nova Tarefa
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Total */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-linear-to-r from-slate-600 to-slate-400 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-all duration-200" />
              <div className="relative bg-white/80 backdrop-blur-sm dark:bg-slate-900/80 rounded-2xl p-5 border border-slate-200/50 dark:border-slate-700/50 hover:-translate-y-1 transition-all duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-linear-to-tr from-slate-600 to-slate-400 rounded-xl blur-md opacity-50" />
                    <div className="relative w-10 h-10 bg-linear-to-tr from-slate-600 to-slate-400 rounded-xl flex items-center justify-center shrink-0">
                      <ListTodo className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Total
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {stats.total}
                  </p>
                </div>
              </div>
            </div>

            {/* A Fazer */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-linear-to-r from-amber-600 to-yellow-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-all duration-200" />
              <div className="relative bg-amber-50/80 backdrop-blur-sm dark:bg-amber-950/30 rounded-2xl p-5 border border-amber-200/50 dark:border-amber-800/50 hover:-translate-y-1 transition-all duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-linear-to-tr from-amber-600 to-yellow-500 rounded-xl blur-md opacity-50" />
                    <div className="relative w-10 h-10 bg-linear-to-tr from-amber-600 to-yellow-500 rounded-xl flex items-center justify-center shrink-0">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                    A Fazer
                  </p>
                  <p className="text-2xl font-bold text-amber-900 dark:text-amber-300">
                    {stats.todo}
                  </p>
                </div>
              </div>
            </div>

            {/* Em Progresso */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-linear-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-all duration-200" />
              <div className="relative bg-blue-50/80 backdrop-blur-sm dark:bg-blue-950/30 rounded-2xl p-5 border border-blue-200/50 dark:border-blue-800/50 hover:-translate-y-1 transition-all duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-linear-to-tr from-blue-600 to-purple-600 rounded-xl blur-md opacity-50" />
                    <div className="relative w-10 h-10 bg-linear-to-tr from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shrink-0">
                      <Flag className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                    Em Progresso
                  </p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                    {stats.doing}
                  </p>
                </div>
              </div>
            </div>

            {/* Concluídas */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-linear-to-r from-green-600 to-emerald-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-all duration-200" />
              <div className="relative bg-green-50/80 backdrop-blur-sm dark:bg-green-950/30 rounded-2xl p-5 border border-green-200/50 dark:border-green-800/50 hover:-translate-y-1 transition-all duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-linear-to-tr from-green-600 to-emerald-500 rounded-xl blur-md opacity-50" />
                    <div className="relative w-10 h-10 bg-linear-to-tr from-green-600 to-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">
                    Concluídas
                  </p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-300">
                    {stats.done}
                  </p>
                </div>
              </div>
            </div>
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
                      <ListTodo className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <span>Lista de Tarefas</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
                  <div className="flex gap-2 flex-wrap">
                    {(["all", "todo", "in-progress", "done"] as const).map(
                      (s) => (
                        <Button
                          key={s}
                          size="sm"
                          variant={statusFilter === s ? "default" : "outline"}
                          className={
                            statusFilter === s
                              ? "bg-linear-to-r from-blue-600 to-purple-600 border-0 text-white"
                              : ""
                          }
                          onClick={() => setStatusFilter(s)}
                        >
                          {s === "all"
                            ? "Todas"
                            : s === "todo"
                              ? "A Fazer"
                              : s === "in-progress"
                                ? "Em Progresso"
                                : "Concluídas"}
                        </Button>
                      ),
                    )}
                  </div>
                  <Input
                    placeholder="Buscar..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="md:w-64 bg-white/50 dark:bg-slate-800/50"
                  />
                </div>

                {filtered.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                    <div className="relative inline-block">
                      <div className="absolute inset-0 bg-linear-to-tr from-slate-400 to-slate-300 rounded-full blur-lg opacity-20" />
                      <ListTodo className="relative h-10 w-10 mx-auto mb-3 opacity-50" />
                    </div>
                    <p>Nenhuma tarefa encontrada</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filtered.map((task) => {
                      const priorityColors = {
                        high: "border-l-red-500 bg-red-50/50 dark:bg-red-950/20",
                        medium:
                          "border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20",
                        low: "border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20",
                      };
                      return (
                        <div
                          key={task.id}
                          className={`p-4 border-l-4 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${priorityColors[task.priority]} border border-slate-200/50 dark:border-slate-700/50`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 text-xs mb-2">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md font-medium ${
                                    task.priority === "high"
                                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                      : task.priority === "medium"
                                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                  }`}
                                >
                                  <Flag className="h-3 w-3" />{" "}
                                  {task.priority === "high"
                                    ? "Alta"
                                    : task.priority === "medium"
                                      ? "Média"
                                      : "Baixa"}
                                </span>
                                {task.dueDate && (
                                  <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                    <CalendarDays className="h-3 w-3" />{" "}
                                    {new Date(
                                      task.dueDate,
                                    ).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-1">
                                {task.title}
                              </h4>
                              {task.assignee && (
                                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                                  Responsável: {task.assignee}
                                </p>
                              )}
                              {task.description && (
                                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                                  {task.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Select
                                value={task.status}
                                onValueChange={(value) =>
                                  handleStatusChange(
                                    task.id,
                                    value as TaskStatus,
                                  )
                                }
                              >
                                <SelectTrigger className="border rounded-md px-2 py-1 text-xs bg-white dark:bg-slate-800 dark:border-slate-600 h-auto">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="todo">A Fazer</SelectItem>
                                  <SelectItem value="in-progress">
                                    Em Progresso
                                  </SelectItem>
                                  <SelectItem value="done">
                                    Concluída
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                                onClick={() => handleEdit(task)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30"
                                onClick={() => handleDelete(task.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {isModalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            >
              <div
                className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-auto m-4"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Gradient header */}
                <div className="relative p-6 bg-linear-to-r from-blue-600 to-purple-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        {editing ? "Editar Tarefa" : "Nova Tarefa"}
                      </h2>
                      <p className="text-sm text-blue-100 mt-1">
                        Defina título, prioridade, prazo e descrição.
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                      onClick={() => setIsModalOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="title"
                      className="text-slate-700 dark:text-slate-300"
                    >
                      Título
                    </Label>
                    <Input
                      id="title"
                      required
                      value={form.title}
                      onChange={(e) =>
                        setForm({ ...form, title: e.target.value })
                      }
                      placeholder="Ex: Criar landing page"
                      className="bg-white/50 dark:bg-slate-800/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="description"
                      className="text-slate-700 dark:text-slate-300"
                    >
                      Descrição (opcional)
                    </Label>
                    <Textarea
                      id="description"
                      rows={3}
                      value={form.description}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                      className="bg-white/50 dark:bg-slate-800/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="assignee"
                      className="text-slate-700 dark:text-slate-300"
                    >
                      Responsável (opcional)
                    </Label>
                    <Input
                      id="assignee"
                      value={form.assignee}
                      onChange={(e) =>
                        setForm({ ...form, assignee: e.target.value })
                      }
                      placeholder="Nome do responsável"
                      className="bg-white/50 dark:bg-slate-800/50"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label
                        htmlFor="status"
                        className="text-slate-700 dark:text-slate-300"
                      >
                        Status
                      </Label>
                      <Select
                        value={form.status}
                        onValueChange={(value) =>
                          setForm({ ...form, status: value as TaskStatus })
                        }
                      >
                        <SelectTrigger className="bg-white/50 dark:bg-slate-800/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todo">A Fazer</SelectItem>
                          <SelectItem value="in-progress">
                            Em Progresso
                          </SelectItem>
                          <SelectItem value="done">Concluída</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="priority"
                        className="text-slate-700 dark:text-slate-300"
                      >
                        Prioridade
                      </Label>
                      <Select
                        value={form.priority}
                        onValueChange={(value) =>
                          setForm({ ...form, priority: value as TaskPriority })
                        }
                      >
                        <SelectTrigger className="bg-white/50 dark:bg-slate-800/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baixa</SelectItem>
                          <SelectItem value="medium">Média</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="dueDate"
                        className="text-slate-700 dark:text-slate-300"
                      >
                        Prazo
                      </Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={form.dueDate}
                        onChange={(e) =>
                          setForm({ ...form, dueDate: e.target.value })
                        }
                        className="bg-white/50 dark:bg-slate-800/50"
                      />
                    </div>
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
                      className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
                    >
                      {editing ? "Atualizar" : "Salvar"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
