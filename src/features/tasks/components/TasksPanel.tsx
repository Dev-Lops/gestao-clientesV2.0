"use client";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { TaskFilters } from "@/features/tasks/components/TaskFilters";
import { TaskModal } from "@/features/tasks/components/TaskModal";
import { TaskStats as StatsCards } from "@/features/tasks/components/TaskStats";
import { useTasks } from "@/features/tasks/hooks/useTasks";
import { Task, TaskPriority, TaskStatus } from "@/features/tasks/types";
import { parseDateInput, toLocalISOString } from "@/lib/utils";
import type { DragEndEvent, DragStartEvent, UniqueIdentifier } from '@dnd-kit/core';
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
import { AlertCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (id: string) => void;
}

function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const { setNodeRef, listeners, attributes, isDragging } = useSortable({ id: task.id });
  // Color by status
  const statusColors = {
    'todo': 'bg-linear-to-br from-white via-yellow-50 to-yellow-100 border-yellow-200 dark:from-slate-900 dark:via-yellow-950 dark:to-yellow-900 dark:border-yellow-900',
    'in-progress': 'bg-linear-to-br from-white via-blue-50 to-blue-100 border-blue-200 dark:from-slate-900 dark:via-blue-950 dark:to-blue-900 dark:border-blue-900',
    'done': 'bg-linear-to-br from-white via-emerald-50 to-emerald-100 border-emerald-200 dark:from-slate-900 dark:via-emerald-950 dark:to-emerald-900 dark:border-emerald-900',
  };
  const textColors = {
    'todo': 'text-yellow-800 dark:text-yellow-200',
    'in-progress': 'text-blue-800 dark:text-blue-200',
    'done': 'text-emerald-800 dark:text-emerald-200',
  };
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`rounded-2xl px-5 py-4 mb-5 shadow-lg hover:shadow-xl transition-all duration-200 cursor-move flex flex-col gap-3 border-2 ${statusColors[task.status]}${isDragging ? ' opacity-70 scale-95 ring-4 ring-blue-400' : ''}`}
      style={{ zIndex: isDragging ? 50 : undefined }}
    >
      <div className="flex items-center gap-3 mb-2">
        <span className={`inline-block w-2 h-2 rounded-full ${task.status === 'todo' ? 'bg-yellow-400' : task.status === 'in-progress' ? 'bg-blue-400' : 'bg-emerald-400'}`} />
        <h4 className={`font-bold text-base flex-1 line-clamp-2 ${textColors[task.status]}`}>{task.title}</h4>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Editar tarefa"
            className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900 transition"
            onClick={e => { e.stopPropagation(); onEdit?.(task); }}
          >
            <Pencil className="w-4 h-4 text-blue-500" />
          </button>
          <button
            type="button"
            aria-label="Excluir tarefa"
            className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900 transition"
            onClick={e => { e.stopPropagation(); onDelete?.(task.id); }}
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>
      {task.description && <p className="text-xs text-slate-600 dark:text-slate-300 mb-2 line-clamp-2">{task.description}</p>}
      <div className="flex items-center gap-3 flex-wrap mt-2">
        <span className={`text-xs px-3 py-1 rounded font-semibold shadow ${task.status === 'todo' ? 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-200' : task.status === 'in-progress' ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-200' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-200'}`}>{task.priority}</span>
        {task.dueDate && <span className={`text-xs flex items-center gap-2 ${textColors[task.status]}`}><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" className="inline mr-1"><circle cx="7" cy="7" r="6" /></svg>{task.dueDate}</span>}
      </div>
    </div>
  );
}

interface KanbanColumnProps {
  column: { id: TaskStatus; title: string; color: string };
  tasks: Task[];
  handleEdit: (task: Task) => void;
  handleDelete: (id: string) => void;
}

function KanbanColumn({ column, tasks, handleEdit, handleDelete }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  // Color by column phase
  const columnColors = {
    'todo': 'bg-linear-to-br from-yellow-50 via-white to-yellow-100 dark:from-yellow-950 dark:via-slate-900 dark:to-yellow-900',
    'in-progress': 'bg-linear-to-br from-blue-100 via-white to-blue-200 dark:from-blue-950 dark:via-slate-900 dark:to-blue-900',
    'done': 'bg-linear-to-br from-emerald-50 via-white to-emerald-100 dark:from-emerald-950 dark:via-slate-900 dark:to-emerald-900',
  };
  const borderColors = {
    'todo': 'border-yellow-200 dark:border-yellow-900',
    'in-progress': 'border-blue-200 dark:border-blue-900',
    'done': 'border-emerald-200 dark:border-emerald-900',
  };
  const headerColors = {
    'todo': 'text-yellow-900 dark:text-yellow-100',
    'in-progress': 'text-blue-900 dark:text-blue-100',
    'done': 'text-emerald-900 dark:text-emerald-100',
  };
  return (
    <div ref={setNodeRef} className="flex-1 min-w-[260px] max-w-[340px] px-2 md:px-4">
      <div className={`h-full rounded-3xl shadow-2xl border-2 p-6 md:p-8 transition-all duration-200 ${columnColors[column.id]} ${borderColors[column.id]}${isOver ? ' ring-4 ring-blue-400 scale-[1.03] bg-blue-200 dark:bg-blue-950/60' : ''}`}>
        <div className={`flex items-center justify-between mb-6 pb-3 border-b font-extrabold text-xl tracking-tight drop-shadow ${headerColors[column.id]} border-blue-200 dark:border-blue-900`}>
          <h3>{column.title}</h3>
          <span className={`text-xs rounded-full px-4 py-2 font-bold shadow ${headerColors[column.id]} bg-opacity-10`}>{tasks.length}</span>
        </div>
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-5">
            {tasks.length === 0 ? (
              <p className={`text-xs text-center py-10 italic ${headerColors[column.id]} opacity-70`}>Nenhuma tarefa nesta coluna</p>
            ) : (
              tasks.map((task: Task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

interface TasksPanelProps { clientId: string; initialTasks?: Task[] }

export function TasksPanel({ clientId, initialTasks = [] }: TasksPanelProps) {
  const { tasks, filtered, stats, isLoading, refetch, invalidate, search, setSearch, statusFilter, setStatusFilter, error } = useTasks({ clientId, initial: initialTasks })

  // Kanban columns
  const columns = [
    { id: 'todo' as TaskStatus, title: 'A Fazer', color: 'bg-slate-100 dark:bg-slate-800' },
    { id: 'in-progress' as TaskStatus, title: 'Em Progresso', color: 'bg-blue-100 dark:bg-blue-950/30' },
    { id: 'done' as TaskStatus, title: 'Concluído', color: 'bg-emerald-100 dark:bg-emerald-950/30' },
  ];

  // Drag and drop logic
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  // Dnd-kit sensors
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const filteredKanbanTasks = columns.map(col => ({
    ...col,
    tasks: filtered.filter(t => t.status === col.id)
  }));

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [form, setForm] = useState({ title: "", description: "", status: "todo" as TaskStatus, priority: "medium" as TaskPriority, assignee: "", dueDate: "" })

  const resetForm = () => { setForm({ title: "", description: "", status: "todo", priority: "medium", assignee: "", dueDate: "" }); setEditing(null) }
  const handleEdit = (task: Task) => { setEditing(task); setForm({ title: task.title, description: task.description || "", status: task.status, priority: task.priority, assignee: task.assignee || "", dueDate: task.dueDate || "" }); setIsModalOpen(true) }

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir tarefa?")) return
    try {
      const res = await fetch(`/api/clients/${clientId}/tasks?taskId=${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Falha ao excluir tarefa")
      await invalidate()
    } catch (err) {
      console.error(err)
    }
  }

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    try {
      const res = await fetch(`/api/clients/${clientId}/tasks?taskId=${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) })
      if (!res.ok) throw new Error("Falha ao atualizar status")
      await invalidate()
    } catch (err) {
      console.error(err)
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
      } catch (err) {
        console.error(err);
      }
    } else {
      try {
        const res = await fetch(`/api/clients/${clientId}/tasks`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error("Falha ao criar tarefa");
        await invalidate();
      } catch (err) {
        console.error(err);
      }
    }
    setIsModalOpen(false); resetForm();
  }


  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id);
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const activeTask = tasks.find((t: Task) => t.id === active.id);
    if (!activeTask) return;
    const overColumn = columns.find((c) => c.id === over.id);
    const newStatus = overColumn ? overColumn.id : activeTask.status;
    if (columns.some((c) => c.id === newStatus) && activeTask.status !== newStatus) {
      await handleStatusChange(activeTask.id, newStatus as TaskStatus);
    }
  };

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

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
            <Button size="sm" variant="outline" onClick={() => refetch()} className="mt-2">Tentar novamente</Button>
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
        <div className="flex gap-10 md:gap-14 overflow-x-auto pb-8 pt-4">
          {filteredKanbanTasks.map(col => (
            <KanbanColumn
              key={col.id}
              column={col}
              tasks={col.tasks}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? (
            <div className="scale-110 drop-shadow-2xl px-6 py-4">
              <TaskCard task={activeTask} onEdit={() => { }} onDelete={() => { }} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      <TaskModal open={isModalOpen} onClose={() => setIsModalOpen(false)} editing={editing} form={form} setForm={setForm} onSubmit={handleSubmit} />
    </div>
  )
}