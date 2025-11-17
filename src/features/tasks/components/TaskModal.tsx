"use client";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';
import { Task, TaskPriority, TaskStatus } from '../types';

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  editing: Task | null;
  form: {
    title: string; description: string; status: TaskStatus; priority: TaskPriority; assignee: string; dueDate: string;
  };
  setForm: (f: TaskModalProps['form']) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function TaskModal({ open, onClose, editing, form, setForm, onSubmit }: TaskModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-auto m-4" onClick={(e) => e.stopPropagation()}>
        <div className="relative p-6 bg-linear-to-r from-blue-600 to-purple-600">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">{editing ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
              <p className="text-sm text-blue-100 mt-1">Defina título, prioridade, prazo e descrição.</p>
            </div>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-slate-700 dark:text-slate-300">Título</Label>
            <Input id="title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Criar landing page" className="bg-white/50 dark:bg-slate-800/50" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-700 dark:text-slate-300">Descrição (opcional)</Label>
            <Textarea id="description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-white/50 dark:bg-slate-800/50" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assignee" className="text-slate-700 dark:text-slate-300">Responsável (opcional)</Label>
            <Input id="assignee" value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} placeholder="Nome do responsável" className="bg-white/50 dark:bg-slate-800/50" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="status" className="text-slate-700 dark:text-slate-300">Status</Label>
              <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value as TaskStatus })}>
                <SelectTrigger className="bg-white/50 dark:bg-slate-800/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">A Fazer</SelectItem>
                  <SelectItem value="in-progress">Em Progresso</SelectItem>
                  <SelectItem value="done">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-slate-700 dark:text-slate-300">Prioridade</Label>
              <Select value={form.priority} onValueChange={(value) => setForm({ ...form, priority: value as TaskPriority })}>
                <SelectTrigger className="bg-white/50 dark:bg-slate-800/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate" className="text-slate-700 dark:text-slate-300">Prazo</Label>
              <Input id="dueDate" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="bg-white/50 dark:bg-slate-800/50" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0">{editing ? 'Atualizar' : 'Salvar'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
