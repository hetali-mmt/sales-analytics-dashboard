import { endpoints } from '@/lib/endpoints'
import {
  UsersResponseSchema,
  SessionsResponseSchema,
  SessionDetailSchema,
  TeamMetricsResponseSchema,
  ScoreTrendsResponseSchema,
  UserPerformanceSchema,
  type SessionsQuery,
  type BulkUpdate,
  type User,
  type SessionDetail,
  type TeamMetrics,
  type ScoreTrend,
  type SessionsResponse,
} from '@/schemas'

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

import { API_CONFIG } from '@/lib/constants'

const fetchWithRetry = async (url: string, options?: RequestInit, retries = API_CONFIG.RETRY_ATTEMPTS): Promise<Response> => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options)
      if (response.ok) return response
      if (response.status >= 400 && response.status < 500 && i === retries - 1) {
        throw new ApiError(response.status, `HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000))
    }
  }
  throw new Error('Max retries exceeded')
}

export const apiService = {
  async getUsers(): Promise<User[]> {
    const response = await fetchWithRetry(endpoints.users)
    const data = await response.json()
    return UsersResponseSchema.parse(data)
  },

  async getSessions(query: SessionsQuery): Promise<SessionsResponse> {
    const params = new URLSearchParams()
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, String(value))
    })
    
    const response = await fetchWithRetry(`${endpoints.sessions}?${params}`)
    const data = await response.json()
    return SessionsResponseSchema.parse(data)
  },

  async getSessionDetail(id: string): Promise<SessionDetail> {
    const response = await fetchWithRetry(endpoints.sessionDetail(id))
    const data = await response.json()
    return SessionDetailSchema.parse(data)
  },

  async updateSession(id: string, feedback: string): Promise<void> {
    await fetchWithRetry(endpoints.updateSession(id), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback }),
    })
  },

  async getTeamMetrics(): Promise<TeamMetrics[]> {
    const response = await fetchWithRetry(endpoints.teamMetrics)
    const data = await response.json()
    return TeamMetricsResponseSchema.parse(data)
  },

  async getScoreTrends(days: number): Promise<ScoreTrend[]> {
    const response = await fetchWithRetry(`${endpoints.scoreTrends}?days=${days}`)
    const data = await response.json()
    return ScoreTrendsResponseSchema.parse(data)
  },

  async getUserPerformance(): Promise<User[]> {
    const response = await fetchWithRetry(endpoints.userPerformance)
    const data = await response.json()
    return UserPerformanceSchema.parse(data)
  },

  async bulkUpdateSessions(update: BulkUpdate): Promise<void> {
    await fetchWithRetry(endpoints.bulkUpdate, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    })
  },
}