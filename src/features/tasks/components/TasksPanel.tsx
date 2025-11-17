"use client";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { TaskFilters } from "@/features/tasks/components/TaskFilters";
import { TaskList } from "@/features/tasks/components/TaskList";
import { TaskModal } from "@/features/tasks/components/TaskModal";
import { TaskStats as StatsCards } from "@/features/tasks/components/TaskStats";
import { useTasks } from "@/features/tasks/hooks/useTasks";
import { Task, TaskPriority, TaskStatus } from "@/features/tasks/types";
import { formatDateInput, parseDateInput, toLocalISOString } from "@/lib/utils";
import { AlertCircle, Plus } from "lucide-react";
import { useState } from "react";

interface TasksPanelProps { clientId: string; initialTasks?: Task[] }

export function TasksPanel({ clientId, initialTasks = [] }: TasksPanelProps) {
  const { tasks, filtered, stats, isLoading, mutate, search, setSearch, statusFilter, setStatusFilter, error } = useTasks({ clientId, initial: initialTasks })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [form, setForm] = useState({ title: "", description: "", status: "todo" as TaskStatus, priority: "medium" as TaskPriority, assignee: "", dueDate: "" })

  const resetForm = () => { setForm({ title: "", description: "", status: "todo", priority: "medium", assignee: "", dueDate: "" }); setEditing(null) }
  const handleEdit = (task: Task) => { setEditing(task); setForm({ title: task.title, description: task.description || "", status: task.status, priority: task.priority, assignee: task.assignee || "", dueDate: task.dueDate || "" }); setIsModalOpen(true) }

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir tarefa?")) return
    const prev = tasks
    mutate(prev.filter(t => t.id !== id), false)
    try {
      const res = await fetch(`/api/clients/${clientId}/tasks?taskId=${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Falha ao excluir tarefa")
      mutate()
    } catch { mutate(prev, false) }
  }

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    const prev = tasks
    mutate(prev.map(t => t.id === id ? { ...t, status } : t), false)
    try {
      const res = await fetch(`/api/clients/${clientId}/tasks?taskId=${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) })
      if (!res.ok) throw new Error("Falha ao atualizar status")
      mutate()
    } catch { mutate(prev, false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { ...form, dueDate: form.dueDate ? toLocalISOString(parseDateInput(form.dueDate)) : null }
    if (editing) {
      const prev = tasks
      mutate(prev.map(t => t.id === editing.id ? { ...t, ...form } : t), false)
      try {
        const res = await fetch(`/api/clients/${clientId}/tasks?taskId=${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        if (!res.ok) throw new Error("Falha ao atualizar tarefa")
        const updated = await res.json()
        mutate(prev.map(t => t.id === editing.id ? { ...t, title: updated.title, description: updated.description ?? undefined, status: updated.status, priority: updated.priority, assignee: updated.assignee ?? undefined, dueDate: updated.dueDate ? formatDateInput(updated.dueDate) : undefined } : t), false)
      } catch { mutate(prev, false) }
    } else {
      const prev = tasks
      const tempId = `temp-${Date.now()}`
      const optimistic: Task = { id: tempId, title: form.title, description: form.description || undefined, status: form.status, priority: form.priority, assignee: form.assignee || undefined, dueDate: form.dueDate || undefined, createdAt: new Date() }
      mutate([optimistic, ...prev], false)
      try {
        const res = await fetch(`/api/clients/${clientId}/tasks`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
        if (!res.ok) throw new Error("Falha ao criar tarefa")
        const created = await res.json()
        mutate([{ id: created.id, title: created.title, description: created.description ?? undefined, status: created.status, priority: created.priority, assignee: created.assignee ?? undefined, dueDate: created.dueDate ? formatDateInput(created.dueDate) : undefined, createdAt: new Date(created.createdAt) }, ...prev], false)
      } catch { mutate(prev, false) }
    }
    setIsModalOpen(false); resetForm()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" variant="primary" />
          <p className="text-sm text-slate-600 dark:text-slate-400">Carregando tarefas...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6" role="alert" aria-live="polite">
        <div className="flex items-start gap-3 rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-red-800 dark:text-red-300">Erro ao carregar tarefas</p>
            <p className="text-xs text-red-700 dark:text-red-400">
              {error.message} {error.status ? `(status ${error.status})` : ''}
            </p>
            {(error.body && typeof error.body === 'object') ? (
              <pre className="mt-2 max-h-40 overflow-auto text-xs text-red-600 dark:text-red-400 bg-red-100/70 dark:bg-red-900/30 p-2 rounded">
                {JSON.stringify(error.body as Record<string, unknown>, null, 2)}
              </pre>
            ) : null}
            <Button size="sm" variant="outline" onClick={() => mutate()} className="mt-2">Tentar novamente</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Tarefas</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Gerencie as tarefas deste cliente</p>
        </div>
        <Button className="gap-2 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0" onClick={() => { resetForm(); setIsModalOpen(true) }}>
          <Plus className="h-4 w-4" /> Nova Tarefa
        </Button>
      </div>
      <StatsCards stats={stats} />
      <TaskFilters statusFilter={statusFilter} setStatusFilter={setStatusFilter} search={search} setSearch={setSearch} />
      <TaskList tasks={filtered} onEdit={handleEdit} onDelete={handleDelete} onStatusChange={handleStatusChange} />
      <TaskModal open={isModalOpen} onClose={() => setIsModalOpen(false)} editing={editing} form={form} setForm={setForm} onSubmit={handleSubmit} />
    </div>
  )
}