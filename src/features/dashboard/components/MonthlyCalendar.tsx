"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export type CalendarActivity = {
  id: string;
  title: string;
  type: "meeting" | "task";
  date: string | Date;
  clientId: string;
  clientName: string;
  status?: string;
};

export function MonthlyCalendar({
  activities,
  onMonthChange,
  initialMonth,
}: {
  activities: CalendarActivity[];
  onMonthChange?: (month: Date) => void;
  initialMonth?: Date;
}) {
  const [cursor, setCursor] = useState(() => {
    const d = initialMonth ? new Date(initialMonth) : new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filter, setFilter] = useState<"all" | "meeting" | "task">("all");
  const [view, setView] = useState<"month" | "week">("month");

  const monthInfo = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    const gridStart = new Date(startOfMonth);
    gridStart.setDate(startOfMonth.getDate() - startOfMonth.getDay());
    gridStart.setHours(0, 0, 0, 0);
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      days.push(d);
    }
    return { startOfMonth, endOfMonth, days };
  }, [cursor]);

  const normalized = useMemo(() => {
    return activities.map((a) => {
      let dateObj: Date;
      if (typeof a.date === "string") {
        if (/^\d{4}-\d{2}-\d{2}$/.test(a.date)) {
          const [y, m, d] = a.date.split("-").map((n) => Number(n));
          dateObj = new Date(y, (m || 1) - 1, d || 1);
        } else {
          dateObj = new Date(a.date);
        }
      } else {
        dateObj = new Date(a.date);
      }
      return { ...a, dateObj };
    });
  }, [activities]);

  const monthLabel = cursor.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const prevMonth = () => {
    const d = new Date(cursor);
    d.setMonth(d.getMonth() - 1);
    setCursor(d);
    onMonthChange?.(new Date(d));
  };

  const nextMonth = () => {
    const d = new Date(cursor);
    d.setMonth(d.getMonth() + 1);
    setCursor(d);
    onMonthChange?.(new Date(d));
  };

  const goToday = () => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    setCursor(d);
    onMonthChange?.(new Date(d));
    setSelectedDate(new Date());
  };

  const isSameDay = (a: Date | null, b: Date | null) => {
    if (!a || !b) return false;
    return a.toDateString() === b.toDateString();
  };
  const isToday = (d: Date) => isSameDay(d, new Date());
  const inCurrentMonth = (d: Date) => d.getMonth() === cursor.getMonth();

  const activitiesByDay = useMemo(() => {
    const map = new Map<string, CalendarActivity[]>();
    normalized.forEach((a) => {
      if (filter !== "all" && a.type !== filter) return;
      const key = `${a.dateObj.getFullYear()}-${String(a.dateObj.getMonth() + 1).padStart(2, "0")}-${String(a.dateObj.getDate()).padStart(2, "0")}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    });
    return map;
  }, [normalized, filter]);

  const selectedKey = selectedDate
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`
    : null;
  const selectedActivities = selectedKey
    ? activitiesByDay.get(selectedKey) || []
    : [];

  // Estatísticas do mês
  const monthStats = useMemo(() => {
    const currentMonthActivities = normalized.filter(
      (a) =>
        a.dateObj.getMonth() === cursor.getMonth() &&
        a.dateObj.getFullYear() === cursor.getFullYear(),
    );

    const meetings = currentMonthActivities.filter(
      (a) => a.type === "meeting",
    ).length;
    const tasks = currentMonthActivities.filter(
      (a) => a.type === "task",
    ).length;
    const completed = currentMonthActivities.filter(
      (a) => a.status === "done" || a.status === "completed",
    ).length;

    return { total: currentMonthActivities.length, meetings, tasks, completed };
  }, [normalized, cursor]);

  return (
    <div className="space-y-4">
      {/* Header aprimorado */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white capitalize">
              {monthLabel}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {monthStats.total} eventos • {monthStats.meetings} reuniões •{" "}
              {monthStats.tasks} tarefas
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={prevMonth}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToday}
              className="h-8 text-xs px-3"
            >
              Hoje
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={nextMonth}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filtros e visualização */}
        <div className="flex items-center justify-between gap-2">
          <Select
            value={filter}
            onValueChange={(value) =>
              setFilter(value as "all" | "meeting" | "task")
            }
          >
            <SelectTrigger className="h-8 w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-400" />
                  Todos ({monthStats.total})
                </div>
              </SelectItem>
              <SelectItem value="meeting">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  Reuniões ({monthStats.meetings})
                </div>
              </SelectItem>
              <SelectItem value="task">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  Tarefas ({monthStats.tasks})
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Legenda compacta */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span className="text-slate-600 dark:text-slate-400">
                Reuniões
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-purple-500" />
              <span className="text-slate-600 dark:text-slate-400">
                Tarefas
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cabeçalho dos dias da semana */}
      <div className="grid grid-cols-7 gap-1">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day, idx) => (
          <div
            key={day}
            className={`text-center py-2 text-xs font-semibold ${
              idx === 0 || idx === 6
                ? "text-slate-400 dark:text-slate-500"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grid do calendário melhorado */}
      <div className="grid grid-cols-7 gap-1">
        {monthInfo.days.map((day) => {
          const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
          const dayActs = activitiesByDay.get(key) || [];
          const today = isToday(day);
          const current = inCurrentMonth(day);
          const selected = selectedDate && isSameDay(day, selectedDate);
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;

          return (
            <button
              key={key}
              onClick={() =>
                setSelectedDate(
                  isSameDay(day, selectedDate) ? null : new Date(day),
                )
              }
              className={`
                relative min-h-20 p-2 rounded-lg border transition-all
                ${
                  today
                    ? "bg-blue-50 dark:bg-blue-950/30 border-blue-400 dark:border-blue-600 shadow-sm"
                    : "bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                }
                ${!current ? "opacity-40" : ""}
                ${selected ? "ring-2 ring-blue-500 shadow-md" : ""}
                ${isWeekend && current ? "bg-slate-50 dark:bg-slate-800/30" : ""}
                hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600
                focus:outline-none focus:ring-2 focus:ring-blue-400
              `}
              aria-label={`${day.getDate()} de ${monthLabel}`}
            >
              {/* Número do dia */}
              <div
                className={`
                text-sm font-bold mb-1
                ${today ? "text-blue-600 dark:text-blue-400" : ""}
                ${!current ? "text-slate-400" : "text-slate-700 dark:text-slate-300"}
              `}
              >
                {day.getDate()}
              </div>

              {/* Indicadores de atividades */}
              {dayActs.length > 0 && (
                <div className="space-y-0.5">
                  {dayActs.slice(0, 2).map((a) => (
                    <div
                      key={a.id}
                      className={`
                        text-[10px] px-1.5 py-0.5 rounded truncate
                        ${
                          a.type === "meeting"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                            : "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300"
                        }
                      `}
                      title={`${a.title} - ${a.clientName}`}
                    >
                      {a.title}
                    </div>
                  ))}
                  {dayActs.length > 2 && (
                    <div className="text-[10px] text-center text-slate-500 dark:text-slate-400 font-medium">
                      +{dayActs.length - 2} mais
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Painel de detalhes do dia selecionado */}
      {selectedDate && (
        <div className="mt-4 p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              {selectedDate.toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDate(null)}
              className="h-7 w-7 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {selectedActivities.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
              Nenhuma atividade agendada para este dia
            </p>
          ) : (
            <div className="space-y-2">
              {selectedActivities.map((activity) => (
                <Link
                  key={activity.id}
                  href={`/clients/${activity.clientId}`}
                  className="block"
                >
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all group">
                    <div
                      className={`
                      h-10 w-10 rounded-lg flex items-center justify-center shrink-0
                      ${
                        activity.type === "meeting"
                          ? "bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
                          : "bg-purple-100 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400"
                      }
                    `}
                    >
                      {activity.type === "meeting" ? (
                        <Clock className="h-5 w-5" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {activity.title}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        {activity.clientName}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`
                          text-[10px] px-2 py-0.5 rounded-full font-medium
                          ${
                            activity.type === "meeting"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                              : "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300"
                          }
                        `}
                        >
                          {activity.type === "meeting" ? "Reunião" : "Tarefa"}
                        </span>
                        {activity.status && (
                          <span
                            className={`
                            text-[10px] px-2 py-0.5 rounded-full font-medium
                            ${
                              activity.status === "done" ||
                              activity.status === "completed"
                                ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                            }
                          `}
                          >
                            {activity.status === "done" ||
                            activity.status === "completed"
                              ? "Concluída"
                              : "Pendente"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mensagem quando não há atividades */}
      {normalized.length === 0 && (
        <div className="text-center py-8">
          <CalendarIcon className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
            Nenhuma atividade neste mês
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
            Adicione reuniões e tarefas aos seus clientes
          </p>
        </div>
      )}
    </div>
  );
}
