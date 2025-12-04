import { API_CONFIG } from "./constants";

export const endpoints = {
  users: `${API_CONFIG.BASE_URL}/api/interview/users`,
  sessions: `${API_CONFIG.BASE_URL}/api/interview/sessions`,
  sessionDetail: (id: string) =>
    `${API_CONFIG.BASE_URL}/api/interview/sessions/${id}`,
  updateSession: (id: string) =>
    `${API_CONFIG.BASE_URL}/api/interview/sessions/${id}`,
  teamMetrics: `${API_CONFIG.BASE_URL}/api/interview/analytics/team-metrics`,
  scoreTrends: `${API_CONFIG.BASE_URL}/api/interview/analytics/score-trends`,
  userPerformance: `${API_CONFIG.BASE_URL}/api/interview/analytics/user-performance`,
  bulkUpdate: `${API_CONFIG.BASE_URL}/api/interview/sessions/bulk`,
  websocket: API_CONFIG.WEBSOCKET_URL,
} as const;
