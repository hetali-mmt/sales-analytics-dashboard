import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TeamOverview } from '../TeamOverview'

// Mock API service
vi.mock('@/services/api', () => ({
  apiService: {
    getUsers: vi.fn().mockResolvedValue([]),
    getTeamMetrics: vi.fn().mockResolvedValue([]),
    getUserPerformance: vi.fn().mockResolvedValue([])
  }
}))

// Mock chart components
vi.mock('@/components/charts/TeamPerformanceChart', () => ({
  TeamPerformanceChart: () => <div data-testid="team-performance-chart">Chart</div>
}))

describe('TeamOverview Page', () => {
  it('renders team overview page', () => {
    render(<TeamOverview />)
    expect(screen.getByText('Team Overview')).toBeInTheDocument()
  })

  it('displays team performance chart', () => {
    render(<TeamOverview />)
    expect(screen.getByTestId('team-performance-chart')).toBeInTheDocument()
  })
})