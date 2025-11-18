
"use client";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { TaskFilters } from "@/features/tasks/components/TaskFilters";
import { TaskModal } from "@/features/tasks/components/TaskModal";
import { TaskStats as StatsCards } from "@/features/tasks/components/TaskStats";
import { useTasks } from "@/features/tasks/hooks/useTasks";
import { Task, TaskPriority, TaskStatus } from "@/features/tasks/types";
import { parseDateInput, toLocalISOString } from "@/lib/utils";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { AlertCircle, Plus } from "lucide-react";
import { useState } from "react";

// Card com drag-and-drop
function TaskCard({ task }: { task: Task }) {
  const { setNodeRef, listeners, attributes, isDragging } = useSortable({ id: task.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`bg-white dark:bg-slate-900 border rounded-xl p-3 mb-2 shadow-md hover:shadow-lg transition cursor-move${isDragging ? ' opacity-60 scale-95 ring-2 ring-blue-400' : ''}`}
      style={{ zIndex: isDragging ? 50 : undefined }}
    >
      <h4 className="font-semibold text-base mb-2 line-clamp-2 text-blue-700 dark:text-blue-300">{task.title}</h4>
      {task.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{task.description}</p>}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800">{task.priority}</span>
        {task.dueDate && <span className="text-xs text-muted-foreground flex items-center gap-1">{task.dueDate}</span>}
      </div>
    </div>
  );
}

interface TasksPanelProps { clientId: string; initialTasks?: Task[] }

export function TasksPanel({ clientId, initialTasks = [] }: TasksPanelProps) {
  // useTasks precisa ser chamado antes de usar 'filtered'
  const { tasks, filtered, stats, isLoading, refetch, invalidate, search, setSearch, statusFilter, setStatusFilter, error } = useTasks({ clientId, initial: initialTasks })

  // Kanban columns
  const columns = [
    { id: 'todo', title: 'A Fazer', color: 'bg-slate-100 dark:bg-slate-800' },
    { id: 'in-progress', title: 'Em Progresso', color: 'bg-blue-100 dark:bg-blue-950/30' },
    { id: 'done', title: 'Concluído', color: 'bg-emerald-100 dark:bg-emerald-950/30' },
  ];

  // Drag and drop logic
  const [activeId, setActiveId] = useState<string | null>(null);
  // Dnd-kit sensors
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const filteredKanbanTasks = columns.map(col => ({
    ...col,
    tasks: filtered.filter((t: Task) => t.status === col.id)
  }));

  const handleDragStart = (event: import('@dnd-kit/core').DragStartEvent) => setActiveId(String(event.active.id));
  const handleDragEnd = async (event: import('@dnd-kit/core').DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const activeTask = tasks.find((t: Task) => t.id === active.id);
    if (!activeTask) return;
    const overColumn = columns.find((c) => c.id === over.id);
    const newStatus = overColumn ? (overColumn.id as TaskStatus) : activeTask.status;
    if (columns.some((c) => c.id === newStatus) && activeTask.status !== newStatus) {
      await handleStatusChange(activeTask.id, newStatus);
    }
  };
  const activeTask = activeId ? tasks.find((t: Task) => t.id === activeId) : null;

  type ColumnType = { id: string; title: string; color: string };
  function KanbanColumn({ column, tasks }: { column: ColumnType; tasks: Task[] }) {
    const { setNodeRef, isOver } = useDroppable({ id: column.id });
    return (
      <div ref={setNodeRef} className="flex-1 min-w-[280px]">
        <div className={`h-full rounded-xl shadow-lg border ${column.color} p-3 transition-all duration-200${isOver ? ' ring-4 ring-blue-400 bg-blue-50 dark:bg-blue-950/40' : ''}`}>
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-lg text-blue-800 dark:text-blue-200 tracking-tight">{column.title}</h3>
            <span className="text-xs bg-slate-200 dark:bg-slate-700 rounded px-2 py-1 font-semibold">{tasks.length}</span>
          </div>
          <SortableContext items={tasks.map((t: Task) => t.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {tasks.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">Nenhuma tarefa nesta coluna</p>
              ) : (
                tasks.map((task: Task) => <TaskCard key={task.id} task={task} />)
              )}
            </div>
          </SortableContext>
        </div>
      </div>
    );
  }

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [form, setForm] = useState({ title: "", description: "", status: "todo" as TaskStatus, priority: "medium" as TaskPriority, assignee: "", dueDate: "" })

  const resetForm = () => { setForm({ title: "", description: "", status: "todo", priority: "medium", assignee: "", dueDate: "" }); setEditing(null) }
  // Removed unused handleEdit and handleDelete functions

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    try {
      const res = await fetch(`/api/clients/${clientId}/tasks?taskId=${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) })
      if (!res.ok) throw new Error("Falha ao atualizar status")
      await invalidate()
    } catch {
      await invalidate()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { ...form, clientId, dueDate: form.dueDate ? toLocalISOString(parseDateInput(form.dueDate)) : null };
    if (editing) {
      try {
        const res = await fetch(`/api/clients/${clientId}/tasks?taskId=${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error("Falha ao atualizar tarefa");
        await invalidate();
      } catch {
        await invalidate();
      }
    } else {
      try {
        const res = await fetch(`/api/clients/${clientId}/tasks`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error("Falha ao criar tarefa");
        await invalidate();
      } catch {
        await invalidate();
      }
    }
    setIsModalOpen(false); resetForm();
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
            <Button size="sm" variant="outline" onClick={() => invalidate()} className="mt-2">Tentar novamente</Button>
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
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-4">
          {filteredKanbanTasks.map(col => <KanbanColumn key={col.id} column={col} tasks={col.tasks} />)}
        </div>
        <DragOverlay>
          {activeTask ? (
            <div className="scale-105">
              <TaskCard task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      <TaskModal open={isModalOpen} onClose={() => setIsModalOpen(false)} editing={editing} form={form} setForm={setForm} onSubmit={handleSubmit} />
    </div>
  )
}