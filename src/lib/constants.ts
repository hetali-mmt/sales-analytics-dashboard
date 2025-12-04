// API Configuration
export const API_CONFIG = {
  BASE_URL: 'https://frontend-homework.koyeb.app',
  WEBSOCKET_URL: 'wss://frontend-homework.koyeb.app/api/interview/ws',
  RETRY_ATTEMPTS: 3,
  STALE_TIME: 5 * 60 * 1000, // 5 minutes
} as const

// Date Ranges
export const DATE_RANGES = [
  { label: '7 Days', value: 7 },
  { label: '30 Days', value: 30 },
  { label: '90 Days', value: 90 },
] as const

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 25,
} as const

// Virtualization
export const VIRTUALIZATION = {
  SESSION_ROW_HEIGHT: 80,
  TRANSCRIPT_ROW_HEIGHT: 80,
  OVERSCAN: 10,
} as const

// Debounce Delays
export const DEBOUNCE_DELAYS = {
  URL_STATE: 300,
  SEARCH: 300,
} as const

// History Limits
export const HISTORY_LIMITS = {
  UNDO_REDO: 5,
  WEBSOCKET_RECONNECT: 5,
} as const

// Theme
export const THEME = {
  STORAGE_KEY: 'theme',
  DARK_CLASS: 'dark',
} as const

// Score Ranges
export const SCORE_RANGES = {
  MIN: 0,
  MAX: 10,
  HIGH_THRESHOLD: 7,
  MEDIUM_THRESHOLD: 5,
} as const

// Teams
export const TEAMS = ['Sales', 'Executive', 'Engineering'] as const

// Sort Options
export const SORT_OPTIONS = {
  FIELDS: ['score', 'created_at', 'title'] as const,
  ORDERS: ['asc', 'desc'] as const,
} as const

// Page Sizes
export const PAGE_SIZES = [25, 50, 100] as const

// Chart Dimensions
export const CHART_DIMENSIONS = {
  DEFAULT_HEIGHT: 64, // h-64 = 256px
  RESPONSIVE_HEIGHT: '100%',
} as const