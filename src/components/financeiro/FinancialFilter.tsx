"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar, ChevronLeft, ChevronRight, Filter, RotateCw } from 'lucide-react'
import { useMemo } from 'react'

interface DashboardData {
  financial?: Record<string, unknown>
  invoices?: Record<string, unknown>
}

interface FinancialFilterProps {
  year: number
  month: number
  onYearChange?: (year: number) => void
  onMonthChange?: (month: number) => void
  onRefresh: () => void
  loading?: boolean
  data?: DashboardData
  onPeriodChange?: (year: number, month: number) => void
}

const MONTHS = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
]

export function FinancialFilter({
  year,
  month,
  onYearChange,
  onMonthChange,
  onPeriodChange,
  onRefresh,
  loading = false,
}: FinancialFilterProps) {
  // Gera lista de anos usando useMemo para evitar recálculos
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 11 }, (_, i) => currentYear - 5 + i)
  }, [])

  const handlePrevMonth = () => {
    let newMonth = month
    let newYear = year

    if (month === 1) {
      newMonth = 12
      newYear = year - 1
    } else {
      newMonth = month - 1
    }

    console.debug('[FinancialFilter] handlePrevMonth ->', { newYear, newMonth })
    if (typeof onPeriodChange === 'function') {
      onPeriodChange(newYear, newMonth)
    } else {
      onMonthChange?.(newMonth)
      onYearChange?.(newYear)
    }
  }

  const handleNextMonth = () => {
    let newMonth = month
    let newYear = year

    if (month === 12) {
      newMonth = 1
      newYear = year + 1
    } else {
      newMonth = month + 1
    }

    console.debug('[FinancialFilter] handleNextMonth ->', { newYear, newMonth })
    if (typeof onPeriodChange === 'function') {
      onPeriodChange(newYear, newMonth)
    } else {
      onMonthChange?.(newMonth)
      onYearChange?.(newYear)
    }
  }

  const handleMonthChange = (newMonth: number) => {
    console.debug('[FinancialFilter] handleMonthChange ->', { year, newMonth })
    if (typeof onPeriodChange === 'function') {
      onPeriodChange(year, newMonth)
    } else {
      onMonthChange?.(newMonth)
    }
  }

  const handleYearChange = (newYear: number) => {
    console.debug('[FinancialFilter] handleYearChange ->', { newYear, month })
    if (typeof onPeriodChange === 'function') {
      onPeriodChange(newYear, month)
    } else {
      onYearChange?.(newYear)
    }
  }

  const currentMonthLabel = MONTHS.find((m) => m.value === month)?.label || ''
  const isCurrentMonth =
    year === new Date().getFullYear() &&
    month === new Date().getMonth() + 1

  return (
    <Card size="sm" className="relative z-40 pointer-events-auto border-2 border-border/50 shadow-lg bg-gradient-to-br from-background via-background to-muted/20" data-testid="financial-filter-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Período de Análise
            </CardTitle>
            <CardDescription>
              Selecione o mês e ano para visualizar dados financeiros
            </CardDescription>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="gap-2"
            data-testid="period-refresh"
          >
            <RotateCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Carregando...' : 'Atualizar'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Navegação Visual de Mês - Compacta */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-primary/8 via-primary/5 to-transparent border-2 border-primary/30 shadow-lg">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevMonth}
              data-testid="period-prev"
              className="h-10 w-10 p-0 rounded-full hover:bg-primary/20 hover:border-primary/50 transition-all"
              title="Mês anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <div className="flex-1 text-center py-2">
              <div className="text-xs font-semibold text-primary/70 uppercase tracking-widest">
                {year}
              </div>
              <div className="text-2xl font-extrabold text-primary">
                {currentMonthLabel}
              </div>
              {isCurrentMonth && (
                <div className="inline-block mt-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                  ✓ Período Atual
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNextMonth}
              data-testid="period-next"
              className="h-10 w-10 p-0 rounded-full hover:bg-primary/20 hover:border-primary/50 transition-all"
              title="Próximo mês"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Seletores de Mês e Ano */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Mês
            </label>
            <Select value={month.toString()} onValueChange={(v) => handleMonthChange(Number(v))}>
              <SelectTrigger className="border-2 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m.value} value={m.value.toString()}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Ano
            </label>
            <Select value={year.toString()} onValueChange={(v) => handleYearChange(Number(v))}>
              <SelectTrigger className="border-2 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Quick Range Buttons */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Atalhos Rápidos
          </label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={isCurrentMonth ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                const now = new Date()
                const ny = now.getFullYear()
                const nm = now.getMonth() + 1
                if (typeof onPeriodChange === 'function') {
                  onPeriodChange(ny, nm)
                } else {
                  onMonthChange?.(nm)
                  onYearChange?.(ny)
                }
              }}
              className="text-xs"
            >
              Hoje
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const prev = new Date()
                prev.setMonth(prev.getMonth() - 1)
                const ny = prev.getFullYear()
                const nm = prev.getMonth() + 1
                if (typeof onPeriodChange === 'function') {
                  onPeriodChange(ny, nm)
                } else {
                  onMonthChange?.(nm)
                  onYearChange?.(ny)
                }
              }}
              className="text-xs"
            >
              Mês Anterior
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const lastYear = new Date()
                lastYear.setFullYear(lastYear.getFullYear() - 1)
                const ny = lastYear.getFullYear()
                const nm = lastYear.getMonth() + 1
                if (typeof onPeriodChange === 'function') {
                  onPeriodChange(ny, nm)
                } else {
                  onMonthChange?.(nm)
                  onYearChange?.(ny)
                }
              }}
              className="text-xs"
            >
              Ano Anterior
            </Button>
          </div>
        </div>

        {/* Info Box */}
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
          <div className="text-xs text-blue-900 dark:text-blue-100">
            <div>
              <span className="font-semibold">💡 Dica:</span> Use os botões de navegação para percorrer meses ou
              selecione diretamente no dropdown
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtro de Período
              </CardTitle>
              <CardDescription>
                Selecione o período para análise
              </CardDescription>
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  )
}
