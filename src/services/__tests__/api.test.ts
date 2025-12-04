import { describe, it, expect, vi } from 'vitest'
import { apiService } from '../api'

// Mock fetch
;(globalThis as any).fetch = vi.fn()

describe('API Service', () => {
  it('fetches users successfully', async () => {
    const mockUsers = [
      { id: '1', first_name: 'John', team: 'Sales', avg_score: 8.5, total_sessions: 10 }
    ]
    
    ;(fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsers
    })

    const result = await apiService.getUsers()
    expect(result).toEqual(mockUsers)
  })

  it('fetches sessions with query parameters', async () => {
    const mockSessions = {
      sessions: [{ id: '1', title: 'Test Session', score: 7.5 }],
      total: 1
    }
    
    ;(fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSessions
    })

    const result = await apiService.getSessions({ 
      page: 1, 
      pageSize: 50, 
      search: 'test' 
    })
    
    expect(result).toEqual(mockSessions)
  })
})