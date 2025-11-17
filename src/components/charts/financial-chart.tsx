"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export interface FinancialDataPoint {
  month: string
  receitas: number
  despesas: number
  saldo: number
}

interface FinancialChartProps {
  data: FinancialDataPoint[]
  type?: 'area' | 'bar'
  title?: string
  description?: string
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

interface TooltipPayload {
  payload: FinancialDataPoint
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-3 shadow-lg">
        <p className="mb-2 font-medium text-sm">{payload[0].payload.month}</p>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">Receitas:</span>
            <span className="font-semibold">{formatCurrency(payload[0].payload.receitas)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-muted-foreground">Despesas:</span>
            <span className="font-semibold">{formatCurrency(payload[0].payload.despesas)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">Saldo:</span>
            <span className="font-semibold">{formatCurrency(payload[0].payload.saldo)}</span>
          </div>
        </div>
      </div>
    )
  }
  return null
}

export function FinancialChart({ data, type = 'area', title = 'Visão Financeira', description }: FinancialChartProps) {

  return (
    <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader className="bg-linear-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="pt-6">
        <ResponsiveContainer width="100%" height={350}>
          {type === 'area' ? (
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                className="text-xs text-muted-foreground"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                className="text-xs text-muted-foreground"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '12px' }}
                formatter={(value) => {
                  const labels: Record<string, string> = {
                    receitas: 'Receitas',
                    despesas: 'Despesas',
                    saldo: 'Saldo'
                  }
                  return labels[value] || value
                }}
              />
              <Area
                type="monotone"
                dataKey="receitas"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorReceitas)"
              />
              <Area
                type="monotone"
                dataKey="despesas"
                stroke="#ef4444"
                fillOpacity={1}
                fill="url(#colorDespesas)"
              />
              <Area
                type="monotone"
                dataKey="saldo"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorSaldo)"
              />
            </AreaChart>
          ) : (
            <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                className="text-xs text-muted-foreground"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                className="text-xs text-muted-foreground"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '12px' }}
                formatter={(value) => {
                  const labels: Record<string, string> = {
                    receitas: 'Receitas',
                    despesas: 'Despesas',
                    saldo: 'Saldo'
                  }
                  return labels[value] || value
                }}
              />
              <Bar dataKey="receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="saldo" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
