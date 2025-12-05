import { KpiGrid } from '@/components/dashboard/KpiGrid'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { render, screen } from '@testing-library/react'
import { DollarSign, TrendingUp, Users } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'

// Mock next-themes to avoid hydration issues
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light' }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}))

describe('Dashboard Components', () => {
  describe('KpiGrid', () => {
    it('should render with default props', () => {
      const { container } = render(
        <KpiGrid>
          <div>Test Child</div>
        </KpiGrid>
      )
      expect(container.querySelector('.grid')).toBeTruthy()
      expect(screen.getByText('Test Child')).toBeTruthy()
    })

    it('should apply correct column classes', () => {
      const { container } = render(
        <KpiGrid columns={4}>
          <div>Test</div>
        </KpiGrid>
      )
      const grid = container.querySelector('.grid')
      expect(grid?.className).toContain('grid-cols-1')
      expect(grid?.className).toContain('lg:grid-cols-4')
    })

    it('should apply correct gap classes', () => {
      const { container } = render(
        <KpiGrid gap="lg">
          <div>Test</div>
        </KpiGrid>
      )
      const grid = container.querySelector('.grid')
      expect(grid?.className).toContain('gap-8')
    })

    it('should support 1, 2, 3, 4 columns', () => {
      const variants = [1, 2, 3, 4] as const
      for (const col of variants) {
        const { container } = render(
          <KpiGrid columns={col}>
            <div>Test</div>
          </KpiGrid>
        )
        expect(container.querySelector('.grid')).toBeTruthy()
      }
    })

    it('should merge custom className', () => {
      const { container } = render(
        <KpiGrid className="custom-class">
          <div>Test</div>
        </KpiGrid>
      )
      const grid = container.querySelector('.grid')
      expect(grid?.className).toContain('custom-class')
    })
  })

  describe('MetricCard', () => {
    it('should render value and label', () => {
      render(
        <MetricCard
          value="R$ 45.280"
          label="Receita do Mês"
        />
      )
      expect(screen.getByText('R$ 45.280')).toBeTruthy()
      expect(screen.getByText('Receita do Mês')).toBeTruthy()
    })

    it('should render description when provided', () => {
      render(
        <MetricCard
          value="R$ 45.280"
          label="Receita do Mês"
          description="↑ 12% vs mês anterior"
        />
      )
      expect(screen.getByText('↑ 12% vs mês anterior')).toBeTruthy()
    })

    it('should render icon when provided', () => {
      const { container } = render(
        <MetricCard
          value="R$ 45.280"
          label="Receita do Mês"
          icon={DollarSign}
        />
      )
      // Icon should be rendered as SVG
      const svg = container.querySelector('svg')
      expect(svg).toBeTruthy()
    })

    it('should show loading state', () => {
      const { container } = render(
        <MetricCard
          value="R$ 45.280"
          label="Receita do Mês"
          isLoading
        />
      )
      expect(container.querySelector('.animate-pulse')).toBeTruthy()
    })

    it('should render trend indicator with up arrow', () => {
      render(
        <MetricCard
          value="R$ 45.280"
          label="Receita do Mês"
          trend="up"
          trendValue="+12%"
        />
      )
      expect(screen.getByText('+12%')).toBeTruthy()
    })

    it('should render trend indicator with down arrow', () => {
      render(
        <MetricCard
          value="R$ 45.280"
          label="Receita do Mês"
          trend="down"
          trendValue="-5%"
        />
      )
      expect(screen.getByText('-5%')).toBeTruthy()
    })

    it('should render progress bar when progress provided', () => {
      const { container } = render(
        <MetricCard
          value="75%"
          label="Taxa de Conclusão"
          progress={75}
        />
      )
      expect(screen.getAllByText(/75%/)).toHaveLength(2) // One in value, one in progress
      const progressBar = container.querySelector('.bg-muted.rounded-full')
      expect(progressBar).toBeTruthy()
    })

    it('should apply color variants', () => {
      const variants = ['emerald', 'blue', 'purple', 'orange', 'red', 'pink', 'amber'] as const
      for (const variant of variants) {
        const { container } = render(
          <MetricCard
            value="Test"
            label="Test Label"
            variant={variant}
          />
        )
        expect(container.querySelector('[class*="bg-gradient-to-br"]')).toBeTruthy()
      }
    })

    it('should render actions when provided', () => {
      render(
        <MetricCard
          value="R$ 45.280"
          label="Receita do Mês"
          actions={<button>Action Button</button>}
        />
      )
      expect(screen.getByRole('button', { name: 'Action Button' })).toBeTruthy()
    })

    it('should render with Node value', () => {
      render(
        <MetricCard
          value={<span>React Node</span>}
          label="Receita do Mês"
        />
      )
      expect(screen.getByText('React Node')).toBeTruthy()
    })

    it('should render multiple metric cards', () => {
      const { container } = render(
        <>
          <MetricCard value="R$ 45.280" label="Receita" variant="emerald" icon={DollarSign} />
          <MetricCard value="24" label="Clientes" variant="blue" icon={Users} />
          <MetricCard value="12%" label="Crescimento" variant="purple" icon={TrendingUp} />
        </>
      )
      expect(screen.getByText('Receita')).toBeTruthy()
      expect(screen.getByText('Clientes')).toBeTruthy()
      expect(screen.getByText('Crescimento')).toBeTruthy()
      // Should have 3 SVG icons
      expect(container.querySelectorAll('svg')).toHaveLength(3)
    })
  })
})
