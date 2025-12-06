"use client";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAssignees } from '@/features/tasks/hooks/useAssignees';
import { Sparkles, X } from 'lucide-react';
import { Task, TaskPriority, TaskStatus } from '../types';

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  editing: Task | null;
  orgId?: string;
  form: {
    title: string; description: string; status: TaskStatus; priority: TaskPriority; assignee: string; dueDate: string;
  };
  setForm: (f: TaskModalProps['form']) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function TaskModal({ open, onClose, editing, orgId, form, setForm, onSubmit }: TaskModalProps) {
  const { assignees, loading: loadingAssignees } = useAssignees(orgId);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto border-2 border-slate-200 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
        {/* Header com gradiente */}
        <div className="relative p-6 bg-linear-to-r from-blue-600 to-purple-600 rounded-t-2xl">
          <div className="absolute inset-0 bg-linear-to-r from-blue-600 to-purple-600 opacity-90 rounded-t-2xl" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{editing ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
                <p className="text-sm text-blue-100 mt-1">Defina título, prioridade, prazo e descrição</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 shrink-0" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Título da Tarefa *</Label>
            <Input
              id="title"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: Criar landing page"
              className="border-2 border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Descrição</Label>
            <Textarea
              id="description"
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Detalhes sobre a tarefa..."
              className="border-2 border-slate-200 dark:border-slate-700 resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignee" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Responsável</Label>
            {loadingAssignees ? (
              <div className="border-2 border-slate-200 dark:border-slate-700 rounded-md p-2 text-slate-500 text-sm">
                Carregando responsáveis...
              </div>
            ) : assignees.length > 0 ? (
              <Select value={form.assignee} onValueChange={(value) => setForm({ ...form, assignee: value })}>
                <SelectTrigger className="border-2 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Selecione um responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sem atribuição</SelectItem>
                  {assignees.map((assignee) => (
                    <SelectItem key={assignee.id} value={assignee.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{assignee.name}</span>
                        <span className="text-xs text-slate-500 ml-2">
                          {assignee.role === 'OWNER' ? '👑 Owner' : '👤 Staff'}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="border-2 border-slate-200 dark:border-slate-700 rounded-md p-2 text-slate-500 text-sm">
                Nenhum responsável cadastrado
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Status *</Label>
              <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value as TaskStatus })}>
                <SelectTrigger className="border-2 border-slate-200 dark:border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">A Fazer</SelectItem>
                  <SelectItem value="in-progress">Em Progresso</SelectItem>
                  <SelectItem value="done">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Prioridade *</Label>
              <Select value={form.priority} onValueChange={(value) => setForm({ ...form, priority: value as TaskPriority })}>
                <SelectTrigger className="border-2 border-slate-200 dark:border-slate-700">
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
              <Label htmlFor="dueDate" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Prazo</Label>
              <Input
                id="dueDate"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="border-2 border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t-2 border-slate-200 dark:border-slate-700">
            <Button type="button" variant="outline" onClick={onClose} size="lg">
              Cancelar
            </Button>
            <Button type="submit" size="lg">
              {editing ? 'Atualizar Tarefa' : 'Criar Tarefa'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
