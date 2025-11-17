"use client";
import type { LucideIcon } from "lucide-react";
import { CheckCircle2, Clock, Flag, ListTodo } from "lucide-react";
import type { TaskStats } from "../types";

interface TaskStatsProps { stats: TaskStats }

export function TaskStats({ stats }: TaskStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard
        icon={ListTodo}
        title="Total"
        value={stats.total}
        gradient="from-slate-600 to-slate-400"
      />
      <StatCard
        icon={Clock}
        title="A Fazer"
        value={stats.todo}
        gradient="from-amber-600 to-yellow-500"
        colorText="text-amber-700"
      />
      <StatCard
        icon={Flag}
        title="Em Progresso"
        value={stats.doing}
        gradient="from-blue-600 to-purple-600"
        colorText="text-blue-700"
      />
      <StatCard
        icon={CheckCircle2}
        title="Concluídas"
        value={stats.done}
        gradient="from-green-600 to-emerald-500"
        colorText="text-green-700"
      />
    </div>
  );
}

interface StatCardProps {
  icon: LucideIcon;
  title: string;
  value: number;
  gradient: string;
  colorText?: string;
}

function StatCard({ icon: Icon, title, value, gradient, colorText }: StatCardProps) {
  return (
    <div className="relative group">
      <div
        className={`absolute -inset-0.5 bg-linear-to-r ${gradient} rounded-2xl blur opacity-20 group-hover:opacity-30 transition-all duration-200`}
      />
      <div className="relative bg-white/80 backdrop-blur-sm dark:bg-slate-900/80 rounded-2xl p-5 border border-slate-200/50 dark:border-slate-700/50 hover:-translate-y-1 transition-all duration-200">
        <div className="flex items-center justify-between mb-3">
          <div className="relative">
            <div
              className={`absolute inset-0 bg-linear-to-tr ${gradient} rounded-xl blur-md opacity-50`}
            />
            <div
              className={`relative w-10 h-10 bg-linear-to-tr ${gradient} rounded-xl flex items-center justify-center shrink-0`}
            >
              <Icon className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <p
            className={`text-sm font-medium ${colorText || "text-slate-600 dark:text-slate-400"
              }`}
          >
            {title}
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}
