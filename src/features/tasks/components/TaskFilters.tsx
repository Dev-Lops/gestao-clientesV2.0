"use client";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TaskStatus } from '../types';

interface TaskFiltersProps {
  statusFilter: TaskStatus | 'all';
  setStatusFilter: (s: TaskStatus | 'all') => void;
  search: string;
  setSearch: (s: string) => void;
}

export function TaskFilters({ statusFilter, setStatusFilter, search, setSearch }: TaskFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
      <div className="flex gap-2 flex-wrap">
        {(['all', 'todo', 'in-progress', 'done'] as const).map(s => (
          <Button
            key={s}
            size="sm"
            variant={statusFilter === s ? 'default' : 'outline'}
            className={statusFilter === s ? 'bg-linear-to-r from-blue-600 to-purple-600 border-0 text-white' : ''}
            onClick={() => setStatusFilter(s)}
          >
            {s === 'all' ? 'Todas' : s === 'todo' ? 'A Fazer' : s === 'in-progress' ? 'Em Progresso' : 'Concluídas'}
          </Button>
        ))}
      </div>
      <Input
        placeholder="Buscar..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="md:w-64 bg-white/50 dark:bg-slate-800/50"
      />
    </div>
  );
}
