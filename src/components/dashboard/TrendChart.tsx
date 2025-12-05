'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTheme } from 'next-themes'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
} from 'recharts'

export interface TrendDataPoint {
  name: string
  value: number
  [key: string]: string | number
}

export interface TrendChartProps {
  /**
   * Chart title
   */
  title: string

  /**
   * Chart description
   */
  description?: string

  /**
   * Data points for the chart
   */
  data: TrendDataPoint[]

  /**
   * Chart type: line, bar, or area
   */
  type?: 'line' | 'bar' | 'area'

  /**
   * Color of the data line/bar/area
   */
  color?: string

  /**
   * Secondary color for multi-line charts
   */
  secondaryColor?: string

  /**
   * Data keys to display (for multi-series)
   */
  dataKeys?: string[]

  /**
   * Y-axis label
   */
  yAxisLabel?: string

  /**
   * Format function for Y-axis values
   */
  formatYAxis?: (value: number) => string

  /**
   * Format function for tooltip values
   */
  formatTooltip?: (value: number) => string

  /**
   * Height of the chart
   */
  height?: number

  /**
   * Loading state
   */
  isLoading?: boolean

  /**
   * Optional className
   */
  className?: string

  /**
   * Show legend
   */
  showLegend?: boolean

  /**
   * Smooth curves (for line charts)
   */
  smooth?: boolean
}

/**
 * Custom tooltip for charts
 */
function CustomTooltip({ active, payload, label, formatTooltip }: TooltipProps<number, string> & { formatTooltip?: (value: number) => string }) {
  if (active && payload?.length) {
    return (
      <div className="rounded-lg border border-border bg-background p-2 shadow-lg">
        <p className="text-xs font-medium text-foreground">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {formatTooltip ? formatTooltip(entry.value as number) : entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

/**
 * TrendChart Component
 * 
 * Responsive chart for displaying trends and time-series data
 * 
 * @example
 * ```tsx
 * <TrendChart
 *   title="Receita Mensal"
 *   description="Tendência dos últimos 12 meses"
 *   type="area"
 *   color="rgb(16, 185, 129)"
 *   data={[
 *     { name: 'Jan', value: 45000 },
 *     { name: 'Fev', value: 52000 },
 *     // ...
 *   ]}
 *   formatTooltip={(value) => formatBRL(value)}
 * />
 * ```
 */
export function TrendChart({
  title,
  description,
  data,
  type = 'line',
  color = 'rgb(59, 130, 246)',
  secondaryColor = 'rgb(168, 85, 247)',
  dataKeys = ['value'],
  yAxisLabel,
  formatYAxis,
  formatTooltip,
  height = 300,
  isLoading,
  className,
  showLegend = false,
  smooth = true,
}: TrendChartProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const axisColor = isDark ? '#94a3b8' : '#64748b'
  const gridColor = isDark ? '#334155' : '#e2e8f0'
  const textColor = isDark ? '#e2e8f0' : '#1e293b'

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full rounded-lg bg-muted animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          {type === 'line' && (
            <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis stroke={axisColor} />
              <YAxis
                stroke={axisColor}
                label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
                tickFormatter={formatYAxis}
              />
              <Tooltip content={<CustomTooltip formatTooltip={formatTooltip} />} />
              {showLegend && <Legend />}
              {dataKeys.map((key, index) => (
                <Line
                  key={key}
                  type={smooth ? 'monotone' : 'linear'}
                  dataKey={key}
                  stroke={index === 0 ? color : secondaryColor}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={true}
                />
              ))}
            </LineChart>
          )}

          {type === 'bar' && (
            <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis stroke={axisColor} />
              <YAxis
                stroke={axisColor}
                label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
                tickFormatter={formatYAxis}
              />
              <Tooltip content={<CustomTooltip formatTooltip={formatTooltip} />} />
              {showLegend && <Legend />}
              {dataKeys.map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={index === 0 ? color : secondaryColor}
                  radius={[8, 8, 0, 0]}
                />
              ))}
            </BarChart>
          )}

          {type === 'area' && (
            <AreaChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis stroke={axisColor} />
              <YAxis
                stroke={axisColor}
                label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
                tickFormatter={formatYAxis}
              />
              <Tooltip content={<CustomTooltip formatTooltip={formatTooltip} />} />
              {showLegend && <Legend />}
              {dataKeys.map((key, index) => (
                <Area
                  key={key}
                  type={smooth ? 'monotone' : 'linear'}
                  dataKey={key}
                  fill={index === 0 ? color : secondaryColor}
                  stroke={index === 0 ? color : secondaryColor}
                  fillOpacity={0.3}
                />
              ))}
            </AreaChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
