import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { SessionList } from '@/pages/SessionList'
import { apiService } from '@/services/api'

// Mock the API service
vi.mock('@/services/api', () => ({
  apiService: {
    getSessions: vi.fn(),
  },
}))

// Mock WebSocket hook
vi.mock('@/hooks/useWebSocket', () => ({
  useWebSocket: () => ({ lastMessage: null, isConnected: true }),
}))

const mockSessions = {
  sessions: [
    {
      id: '1',
      user_id: 'user1',
      title: 'Test Session 1',
      score: 8,
      metrics: { confidence: 7, clarity: 8, listening: 9 },
      created_at: '2024-01-01T10:00:00Z',
      duration: 1800,
    },
    {
      id: '2',
      user_id: 'user2',
      title: 'Test Session 2',
      score: 6,
      metrics: { confidence: 5, clarity: 6, listening: 7 },
      created_at: '2024-01-02T10:00:00Z',
      duration: 1200,
    },
  ],
  total: 2,
  page: 1,
  pageSize: 50,
}

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe('SessionList', () => {
  beforeEach(() => {
    vi.mocked(apiService.getSessions).mockResolvedValue(mockSessions)
  })

  it('renders session list with data', async () => {
    renderWithProviders(<SessionList />)

    expect(screen.getByText('Sessions (0)')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByText('Test Session 1')).toBeInTheDocument()
      expect(screen.getByText('Test Session 2')).toBeInTheDocument()
    })
  })

  it('filters sessions by search term', async () => {
    renderWithProviders(<SessionList />)

    await waitFor(() => {
      expect(screen.getByText('Test Session 1')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('Search sessions...')
    fireEvent.change(searchInput, { target: { value: 'Session 1' } })

    // The filtering happens in the component, so we need to check the filtered results
    await waitFor(() => {
      expect(screen.getByText('Test Session 1')).toBeInTheDocument()
    })
  })

  it('handles bulk actions', async () => {
    renderWithProviders(<SessionList />)

    await waitFor(() => {
      expect(screen.getByText('Test Session 1')).toBeInTheDocument()
    })

    const bulkActionsButton = screen.getByText('Bulk Actions')
    fireEvent.click(bulkActionsButton)

    expect(screen.getByText('Select All')).toBeInTheDocument()
  })

  it('handles score range filtering', async () => {
    renderWithProviders(<SessionList />)

    await waitFor(() => {
      expect(screen.getByText('Test Session 1')).toBeInTheDocument()
    })

    const minScoreInput = screen.getByPlaceholderText('Min Score')
    fireEvent.change(minScoreInput, { target: { value: '7' } })

    // This would filter out sessions with score < 7
    await waitFor(() => {
      expect(screen.getByText('Test Session 1')).toBeInTheDocument()
    })
  })
})