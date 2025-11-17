/**
 * Cálculos de tendências e analytics
 */

interface TimeWindow {
  start: Date
  end: Date
}

/**
 * Calcula janelas de tempo para comparação de tendências
 */
export function getTimeWindows(
  now: Date = new Date(),
  days: number = 30
): { current: TimeWindow; previous: TimeWindow } {
  const startCurrent = new Date(now)
  startCurrent.setDate(startCurrent.getDate() - days)

  const startPrevious = new Date(startCurrent)
  startPrevious.setDate(startPrevious.getDate() - days)

  return {
    current: { start: startCurrent, end: now },
    previous: { start: startPrevious, end: startCurrent },
  }
}

/**
 * Calcula percentual de mudança entre dois valores
 */
export function calculatePercentageChange(
  current: number,
  previous: number
): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0
  }
  return Math.round(((current - previous) / previous) * 100)
}

/**
 * Agrupa financeiro por tipo e calcula net
 */
export function calculateFinanceNet(
  financeRows: Array<{ type: string; amount: number | bigint; date: Date }>,
  window?: TimeWindow
): { income: number; expense: number; net: number } {
  let filtered = financeRows

  if (window) {
    filtered = financeRows.filter(
      (f) => f.date >= window.start && f.date < window.end
    )
  }

  const income = filtered
    .filter((f) => f.type === 'income')
    .reduce((acc, f) => acc + Number(f.amount), 0)

  const expense = filtered
    .filter((f) => f.type === 'expense')
    .reduce((acc, f) => acc + Number(f.amount), 0)

  return { income, expense, net: income - expense }
}

/**
 * Filtra reuniões de hoje
 */
export function getMeetingsToday(
  meetings: Array<{ startTime: Date }>,
  now: Date = new Date()
): number {
  return meetings.filter((m) => {
    const d = m.startTime
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    )
  }).length
}
