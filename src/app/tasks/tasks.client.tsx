"use client";
import AppShell from '@/components/layout/AppShell';
import PageContainer from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageLayout } from '@/components/layout/PageLayout';
import { Badge } from '@/components/ui/badge';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TASK_PRIORITY_LABELS } from '@/types/enums';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Calendar, Filter, GripVertical, ListTodo, Plus, Search, User } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import './tasks.client.css';

interface Task {
  id: string
  title: string
  status: 'todo' | 'in-progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  clientName: string
  clientId: string
  dueDate?: string | null
  description?: string | null
}

interface Column { id: string; title: string; status: 'todo' | 'in-progress' | 'done'; color: string }

const columns: Column[] = [
  { id: 'todo', title: 'A Fazer', status: 'todo', color: 'bg-slate-100 dark:bg-slate-800' },
  { id: 'in-progress', title: 'Em Progresso', status: 'in-progress', color: 'bg-blue-100 dark:bg-blue-950/30' },
  { id: 'done', title: 'Concluído', status: 'done', color: 'bg-emerald-100 dark:bg-emerald-950/30' },
]


function TaskCard({ task }: { task: Task }) {
  const {
    setNodeRef,
    transform,
    isDragging,
    attributes,
    listeners,
  } = useSortable({ id: task.id });

  // Map transform to CSS variables for drag-and-drop
  const dragVars: Record<string, string> = {};
  if (transform) {
    if (transform.x) dragVars['--drag-x'] = transform.x + 'px';
    if (transform.y) dragVars['--drag-y'] = transform.y + 'px';
    if (transform.scaleX) dragVars['--drag-scale-x'] = String(transform.scaleX);
    if (transform.scaleY) dragVars['--drag-scale-y'] = String(transform.scaleY);
  }
  return (
    <div
      ref={setNodeRef}
      style={dragVars}
      className={`task-card relative bg-white dark:bg-slate-900 border rounded-lg p-3 mb-3 shadow-sm hover:shadow-md transition-[box-shadow,opacity] cursor-move will-change-transform data-[dragging=true]:opacity-50${isDragging ? ' dragging' : ''}`}
      data-dragging={isDragging ? 'true' : 'false'}
    >
      <div className="flex items-start gap-2">
        <button type="button" {...attributes} {...listeners} className="mt-1 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500" aria-label="Arrastar tarefa">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm mb-2 line-clamp-2">{task.title}</h4>
          {task.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{task.description}</p>}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={task.priority === 'high' ? 'high' : task.priority === 'medium' ? 'medium' : 'low'}>
              {TASK_PRIORITY_LABELS[task.priority]}
            </Badge>
            <Link href={`/clients/${task.clientId}`} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              <User className="h-3 w-3" />
              {task.clientName}
            </Link>
            {task.dueDate && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(task.dueDate).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// priority colors now provided by PriorityBadge component

function KanbanColumn({ column, tasks }: { column: Column; tasks: Task[] }) {
  return (
    <div className="flex-1 min-w-[280px]">
      <Card className={`h-full ${column.color}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">{column.title}</h3>
            <Badge variant="secondary" className="text-xs">{tasks.length}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">Nenhuma tarefa nesta coluna</p>
            ) : (
              tasks.map(task => <TaskCard key={task.id} task={task} />)
            )}
          </SortableContext>
        </CardContent>
      </Card>
    </div>
  )
}

export default function TasksClient({ initialTasks, updateTaskStatusAction }: { initialTasks: Task[]; updateTaskStatusAction: (id: string, status: string) => Promise<Task> }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const filteredTasks = useMemo(() => {
    let result = tasks
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(t => t.title.toLowerCase().includes(q) || t.clientName.toLowerCase().includes(q))
    }
    if (priorityFilter) result = result.filter(t => t.priority === priorityFilter)
    return result
  }, [searchQuery, priorityFilter, tasks])

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string)
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return
    const activeTask = tasks.find(t => t.id === active.id)
    if (!activeTask) return
    const overColumn = columns.find(c => filteredTasks.filter(t => t.status === c.status).some(t => t.id === over.id))
    const overColumnId = overColumn?.status || (over.id as string)
    if (columns.some(c => c.id === overColumnId)) {
      const newStatus = overColumnId as 'todo' | 'in-progress' | 'done'
      if (activeTask.status !== newStatus) {
        setTasks(prev => prev.map(t => t.id === activeTask.id ? { ...t, status: newStatus } : t))
        try {
          const updated = await updateTaskStatusAction(activeTask.id, newStatus)
          setTasks(prev => prev.map(t => t.id === activeTask.id ? { ...t, status: updated.status } : t))
        } catch {
          setTasks(prev => prev.map(t => t.id === activeTask.id ? { ...t, status: activeTask.status } : t))
        }
      }
    }
  }
  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null

  return (
    <AppShell>
      <PageContainer className="space-y-6">
        <Breadcrumbs items={[{ label: 'Kanban de Tarefas', icon: ListTodo }]} />
        <PageLayout centered={false}>
          <PageHeader title="Kanban de Tarefas" description="Gerencie e organize suas tarefas com drag-and-drop" icon={ListTodo} iconColor="bg-purple-600" actions={<Link href="/clients"><Button size="lg" className="rounded-full bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 shadow-lg gap-2"><Plus className="w-5 h-5" />Nova Tarefa</Button></Link>} />
          <Card className="p-4 border-2 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><Filter className="h-4 w-4" />Filtros:</div>
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por título ou cliente..." className="pl-9" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
              <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} aria-label="Filtrar por prioridade">
                <option value="">Todas as prioridades</option>
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
              </select>
              {(searchQuery || priorityFilter) && <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setPriorityFilter('') }}>Limpar</Button>}
            </div>
          </Card>
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {columns.map(column => <KanbanColumn key={column.id} column={column} tasks={filteredTasks.filter(t => t.status === column.status)} />)}
            </div>
            <DragOverlay>{activeTask ? <TaskCard task={activeTask} /> : null}</DragOverlay>
          </DndContext>
        </PageLayout>
      </PageContainer>
    </AppShell>
  )
}
