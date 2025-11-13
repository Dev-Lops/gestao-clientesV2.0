"use client"

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

export type CalendarActivity = {
  id: string
  title: string
  type: 'meeting' | 'task'
  date: string | Date
  clientId: string
  clientName: string
  status?: string
}

export function MonthlyCalendar({ activities, onMonthChange, initialMonth }: { activities: CalendarActivity[]; onMonthChange?: (month: Date) => void; initialMonth?: Date }) {
  const [cursor, setCursor] = useState(() => {
    const d = initialMonth ? new Date(initialMonth) : new Date()
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
    return d
  })
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [filter, setFilter] = useState<'all' | 'meeting' | 'task'>('all')

  const monthInfo = useMemo(() => {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const startOfMonth = new Date(year, month, 1)
    const endOfMonth = new Date(year, month + 1, 0)
    // Grid começa no domingo anterior ou igual ao primeiro dia do mês
    const gridStart = new Date(startOfMonth)
    gridStart.setDate(startOfMonth.getDate() - startOfMonth.getDay())
    gridStart.setHours(0, 0, 0, 0)
    // 6 semanas (42 dias) para cobrir qualquer mês
    const days: Date[] = []
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart)
      d.setDate(gridStart.getDate() + i)
      days.push(d)
    }
    return { startOfMonth, endOfMonth, days }
  }, [cursor])

  // Nota: Mudanças externas de mês devem ser feitas via remount (key) ou callbacks

  const normalized = useMemo(() => {
    return activities.map((a) => ({
      ...a,
      dateObj: new Date(a.date),
    }))
  }, [activities])

  const monthLabel = cursor.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  const prevMonth = () => {
    const d = new Date(cursor)
    d.setMonth(d.getMonth() - 1)
    setCursor(d)
    onMonthChange?.(new Date(d))
  }
  const nextMonth = () => {
    const d = new Date(cursor)
    d.setMonth(d.getMonth() + 1)
    setCursor(d)
    onMonthChange?.(new Date(d))
  }
  const goToday = () => {
    const d = new Date()
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
    setCursor(d)
    onMonthChange?.(new Date(d))
    setSelectedDate(new Date())
  }

  const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()
  const isToday = (d: Date) => isSameDay(d, new Date())
  const inCurrentMonth = (d: Date) => d.getMonth() === cursor.getMonth()

  const activitiesByDay = useMemo(() => {
    const map = new Map<string, CalendarActivity[]>()
    normalized.forEach((a) => {
      if (filter !== 'all' && a.type !== filter) return
      const key = a.dateObj.toISOString().split('T')[0]
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(a)
    })
    return map
  }, [normalized, filter])

  const selectedKey = selectedDate ? selectedDate.toISOString().split('T')[0] : null
  const selectedActivities = selectedKey ? activitiesByDay.get(selectedKey) || [] : []

  return (
    <Card className="relative overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700">
      <div className="p-4 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-600 to-purple-600 flex items-center justify-center shrink-0">
              <CalendarIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Calendário Mensal</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">{monthLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'meeting' | 'task')}
              title="Filtrar atividades"
              aria-label="Filtrar atividades"
            >
              <option value="all">Tudo</option>
              <option value="meeting">Reuniões</option>
              <option value="task">Tarefas</option>
            </select>
            <Button variant="outline" size="sm" className="rounded-lg" onClick={prevMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="rounded-lg text-xs" onClick={goToday}>
              Hoje
            </Button>
            <Button variant="outline" size="sm" className="rounded-lg" onClick={nextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Weekday headers - apenas números */}
        <div className="grid grid-cols-7 text-[10px] sm:text-xs text-slate-500 uppercase tracking-wide">
          {monthInfo.days.slice(0, 7).map((d, i) => (
            <div key={i} className="px-2 py-1 text-center">{d.getDate()}</div>
          ))}
        </div>

        {/* Month grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {monthInfo.days.map((day) => {
            // Corrigir fuso/data: usar apenas ano-mes-dia local
            const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
            const dayActs = activitiesByDay.get(key) || []
            const today = isToday(day)
            const current = inCurrentMonth(day)
            const selected = selectedDate && isSameDay(day, selectedDate)
            return (
              <button
                key={key}
                onClick={() => setSelectedDate(new Date(day))}
                className={`relative text-center rounded-lg border p-1.5 sm:p-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400/50
                  ${today ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700' : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'}
                  ${!current ? 'opacity-60' : ''}
                  ${selected ? 'ring-2 ring-blue-500' : ''}
                `}
                aria-label={`Dia ${day.getDate()}`}
              >
                <div className={`text-xs sm:text-sm font-bold ${today ? 'text-blue-600' : 'text-slate-900 dark:text-white'}`}>
                  {day.getDate()}
                </div>
                {dayActs.length > 0 && (
                  <div className="flex flex-col gap-0.5 mt-1">
                    {dayActs.slice(0, 3).map((a) => (
                      <div
                        key={a.id}
                        className={`w-full h-1.5 rounded-full ${a.type === 'meeting' ? 'bg-blue-500' : 'bg-purple-500'}`}
                        title={`${a.title} - ${a.clientName}`}
                      />
                    ))}
                    {dayActs.length > 3 && (
                      <div className="text-[8px] text-center text-slate-500 mt-0.5">+{dayActs.length - 3}</div>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Selected day list */}
        {selectedActivities.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">
              {new Date(selectedActivities[0].date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
            </h4>
            <div className="space-y-1.5">
              {selectedActivities.map((a) => (
                <Link key={a.id} href={`/clients/${a.clientId}/info`} className="block">
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className={`w-2 h-2 rounded-full ${a.type === 'meeting' ? 'bg-blue-500' : 'bg-purple-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{a.title}</p>
                      <p className="text-xs text-slate-500 truncate">{a.clientName}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {normalized.length === 0 && (
          <div className="text-center py-6">
            <CalendarIcon className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm text-slate-600 dark:text-slate-400">Sem atividades para este mês</p>
          </div>
        )}
      </div>
    </Card>
  )
}
