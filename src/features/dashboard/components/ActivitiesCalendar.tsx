"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface Activity {
  id: string;
  title: string;
  type: "meeting" | "task";
  date: Date;
  clientId: string;
  clientName: string;
  status?: string;
}

interface ActivitiesCalendarProps {
  activities: Activity[];
}

export function ActivitiesCalendar({ activities }: ActivitiesCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());

  // Obter início e fim da semana
  const getWeekBounds = (date: Date) => {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay()); // Domingo
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6); // Sábado
    end.setHours(23, 59, 59, 999);

    return { start, end };
  };

  const { start: weekStart, end: weekEnd } = getWeekBounds(currentWeek);

  // Navegar semanas
  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(currentWeek.getDate() - 7);
    setCurrentWeek(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(currentWeek.getDate() + 7);
    setCurrentWeek(newDate);
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
  };

  // Filtrar atividades da semana
  const weekActivities = activities.filter((activity) => {
    const activityDate = new Date(activity.date);
    return activityDate >= weekStart && activityDate <= weekEnd;
  });

  // Agrupar por dia
  const activitiesByDay = new Map<string, Activity[]>();
  weekActivities.forEach((activity) => {
    const activityDate = new Date(activity.date);
    const dateKey = activityDate.toISOString().split("T")[0];

    if (!activitiesByDay.has(dateKey)) {
      activitiesByDay.set(dateKey, []);
    }
    activitiesByDay.get(dateKey)!.push(activity);
  });

  // Gerar dias da semana
  const weekDays: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    weekDays.push(day);
  }

  // Verificar se é hoje
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Estatísticas da semana
  const meetingsCount = weekActivities.filter(
    (a) => a.type === "meeting",
  ).length;
  const tasksCount = weekActivities.filter((a) => a.type === "task").length;
  const completedTasks = weekActivities.filter(
    (a) => a.type === "task" && a.status === "done",
  ).length;

  return (
    <Card className="relative overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-600 to-purple-600 flex items-center justify-center shrink-0">
              <CalendarIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Próximas Atividades
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {weekStart.toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                })}{" "}
                -{" "}
                {weekEnd.toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={goToPreviousWeek}
              variant="outline"
              size="sm"
              className="rounded-lg"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              onClick={goToToday}
              variant="outline"
              size="sm"
              className="rounded-lg text-xs"
            >
              Hoje
            </Button>
            <Button
              onClick={goToNextWeek}
              variant="outline"
              size="sm"
              className="rounded-lg"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-2 sm:p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Video className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Reuniões
              </span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-blue-600">
              {meetingsCount}
            </p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-2 sm:p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Tarefas
              </span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-purple-600">
              {tasksCount}
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-2 sm:p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Feitas
              </span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-green-600">
              {completedTasks}
            </p>
          </div>
        </div>

        {/* Dias da Semana - Grid Responsivo */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {weekDays.map((day) => {
            const dateKey = day.toISOString().split("T")[0];
            const dayActivities = activitiesByDay.get(dateKey) || [];
            const today = isToday(day);

            return (
              <div
                key={dateKey}
                className={`
                  relative rounded-lg border p-1.5 sm:p-2 transition-all
                  ${
                    today
                      ? "bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 ring-2 ring-blue-400/50"
                      : "bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                  }
                  ${dayActivities.length > 0 ? "hover:shadow-md cursor-pointer" : ""}
                `}
              >
                {/* Dia */}
                <div className="text-center mb-1">
                  <div
                    className={`text-[9px] sm:text-[10px] uppercase font-medium ${today ? "text-blue-600" : "text-slate-500"}`}
                  >
                    {day
                      .toLocaleDateString("pt-BR", { weekday: "short" })
                      .slice(0, 3)}
                  </div>
                  <div
                    className={`text-xs sm:text-sm font-bold ${today ? "text-blue-600" : "text-slate-900 dark:text-white"}`}
                  >
                    {day.getDate()}
                  </div>
                </div>

                {/* Indicadores de atividades */}
                {dayActivities.length > 0 && (
                  <div className="flex flex-col gap-0.5">
                    {dayActivities.slice(0, 2).map((activity) => (
                      <div
                        key={activity.id}
                        className={`
                          w-full h-1 sm:h-1.5 rounded-full
                          ${
                            activity.type === "meeting"
                              ? "bg-blue-500"
                              : "bg-purple-500"
                          }
                        `}
                        title={`${activity.title} - ${activity.clientName}`}
                      />
                    ))}
                    {dayActivities.length > 2 && (
                      <div className="text-[8px] text-center text-slate-500 mt-0.5">
                        +{dayActivities.length - 2}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Lista de Atividades */}
        {weekActivities.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">
              Próximas {weekActivities.length > 5 ? "5" : weekActivities.length}{" "}
              atividades
            </h4>
            <div className="space-y-1.5">
              {weekActivities.slice(0, 5).map((activity) => (
                <Link
                  key={activity.id}
                  href={`/clients/${activity.clientId}/info`}
                  className="block"
                >
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                    <div
                      className={`
                      w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                      ${
                        activity.type === "meeting"
                          ? "bg-blue-100 dark:bg-blue-950/50 text-blue-600"
                          : "bg-purple-100 dark:bg-purple-950/50 text-purple-600"
                      }
                    `}
                    >
                      {activity.type === "meeting" ? (
                        <Video className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate group-hover:text-blue-600">
                        {activity.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <span>{activity.clientName}</span>
                        <span>•</span>
                        <span>
                          {new Date(activity.date).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                      </div>
                    </div>
                    {activity.status === "done" && (
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {weekActivities.length === 0 && (
          <div className="text-center py-6">
            <CalendarIcon className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Nenhuma atividade programada para esta semana
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
