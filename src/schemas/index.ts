import { z } from 'zod'

// Base schemas
export const UserSchema = z.object({
  id: z.string(),
  first_name: z.string(),
  team: z.enum(['Sales', 'Executive', 'Engineering']),
  total_sessions: z.number().optional().default(0),
  avg_score: z.number().optional().default(0),
  avg_confidence: z.number().optional().default(0),
  avg_clarity: z.number().optional().default(0),
  avg_listening: z.number().optional().default(0),
  best_session_score: z.number().optional().default(0),
  recent_trend: z.enum(['up', 'down', 'stable']).optional().default('stable'),
})

export const SessionMetricsSchema = z.object({
  confidence: z.number(),
  clarity: z.number(),
  listening: z.number(),
})

export const SessionSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  title: z.string(),
  score: z.number(),
  metrics: SessionMetricsSchema,
  created_at: z.string(),
  duration: z.number(),
})

export const TranscriptMessageSchema = z.object({
  text: z.string(),
  secondsFromStart: z.number(),
  speaker: z.enum(['Agent', 'Customer']),
})

export const SessionDetailSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  feedback: z.string(),
  transcript: z.array(TranscriptMessageSchema),
})

export const TeamMetricsSchema = z.object({
  team: z.string(),
  avg_score: z.number(),
  total_sessions: z.number(),
})

export const ScoreTrendSchema = z.object({
  date: z.string(),
  avg_score: z.number(),
})

export const UserPerformanceSchema = z.array(UserSchema)

// API Response schemas
export const UsersResponseSchema = z.array(UserSchema)
export const SessionsResponseSchema = z.object({
  sessions: z.array(SessionSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
})
export const TeamMetricsResponseSchema = z.array(TeamMetricsSchema)
export const ScoreTrendsResponseSchema = z.array(ScoreTrendSchema)

// Request schemas
export const SessionsQuerySchema = z.object({
  page: z.number().default(1),
  pageSize: z.number().min(1).max(100).default(50),
  sortBy: z.enum(['score', 'created_at', 'title']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  search: z.string().optional(),
  scoreMin: z.number().min(0).max(10).optional(),
  scoreMax: z.number().min(0).max(10).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  team: z.enum(['Sales', 'Executive', 'Engineering']).optional(),
})

export const BulkUpdateSchema = z.object({
  session_ids: z.array(z.string()).max(100),
  feedback: z.string(),
})

// Types
export type User = z.infer<typeof UserSchema>
export type Session = z.infer<typeof SessionSchema>
export type SessionDetail = z.infer<typeof SessionDetailSchema>
export type TranscriptMessage = z.infer<typeof TranscriptMessageSchema>
export type TeamMetrics = z.infer<typeof TeamMetricsSchema>
export type ScoreTrend = z.infer<typeof ScoreTrendSchema>
export type SessionsQuery = z.infer<typeof SessionsQuerySchema>
export type BulkUpdate = z.infer<typeof BulkUpdateSchema>
export type SessionsResponse = z.infer<typeof SessionsResponseSchema>