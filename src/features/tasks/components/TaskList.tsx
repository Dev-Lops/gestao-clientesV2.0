"use client";
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDays, Edit, Flag, ListTodo, Trash2 } from 'lucide-react';
import { Task, TaskPriority, TaskStatus } from '../types';

interface TaskListProps {
  tasks: Task[];
  onEdit: (t: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
}

export function TaskList({ tasks, onEdit, onDelete, onStatusChange }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-10 text-slate-500 dark:text-slate-400">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-linear-to-tr from-slate-400 to-slate-300 rounded-full blur-lg opacity-20" />
          <ListTodo className="relative h-10 w-10 mx-auto mb-3 opacity-50" />
        </div>
        <p>Nenhuma tarefa encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map(task => {
        const priorityColors: Record<TaskPriority, string> = {
          high: 'border-l-red-500 bg-red-50/50 dark:bg-red-950/20',
          medium: 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20',
          low: 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
        };
        return (
          <div
            key={task.id}
            className={`p-4 border-l-4 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${priorityColors[task.priority]} border border-slate-200/50 dark:border-slate-700/50`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 text-xs mb-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md font-medium ${task.priority === 'high'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : task.priority === 'medium'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                    <Flag className="h-3 w-3" /> {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                  </span>
                  {task.dueDate && (
                    <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400">
                      <CalendarDays className="h-3 w-3" /> {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
                <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-1">{task.title}</h4>
                {task.assignee && <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Responsável: {task.assignee}</p>}
                {task.description && <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{task.description}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Select
                  value={task.status}
                  onValueChange={(value) => onStatusChange(task.id, value as TaskStatus)}
                >
                  <SelectTrigger className="border rounded-md px-2 py-1 text-xs bg-white dark:bg-slate-800 dark:border-slate-600 h-auto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">A Fazer</SelectItem>
                    <SelectItem value="in-progress">Em Progresso</SelectItem>
                    <SelectItem value="done">Concluída</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30" onClick={() => onEdit(task)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30" onClick={() => onDelete(task.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
