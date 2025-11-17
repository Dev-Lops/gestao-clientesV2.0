import { renderHook } from '@testing-library/react-hooks'
import { describe, expect, it } from 'vitest'
import { useClientKPI } from '../../src/hooks/useClientKPI'

const dashMock = {
  counts: {
    tasks: { total: 10, done: 7 },
    media: 5,
    strategies: 2,
    brandings: 3,
  },
}

describe('useClientKPI', () => {
  it('retorna KPIs corretos', () => {
    const { result } = renderHook(() => useClientKPI(dashMock))
    const kpi = result.current
    expect(kpi.activeTasks).toBe(3)
    expect(kpi.completedTasks).toBe(7)
    expect(kpi.media).toBe(5)
    expect(kpi.strategies).toBe(2)
    expect(kpi.brandings).toBe(3)
    expect(kpi.strategiesDescription).toContain('2 planos ativos')
  })

  it('retorna descrição correta para zero estratégias', () => {
    const dashZero = {
      ...dashMock,
      counts: { ...dashMock.counts, strategies: 0 },
    }
    const { result } = renderHook(() => useClientKPI(dashZero))
    const kpi = result.current
    expect(kpi.strategiesDescription).toBe('Nenhuma estratégia cadastrada')
  })
})
