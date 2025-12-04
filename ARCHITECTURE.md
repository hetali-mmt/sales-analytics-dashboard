# Architecture Documentation

## Overview

This analytics dashboard follows a modern React architecture with TypeScript, emphasizing type safety, performance, and maintainability. The application is built using a service-layer pattern with schema validation and custom hooks for state management.

## Core Architecture Principles

### 1. Type Safety First
- **Strict TypeScript**: No `any` types, comprehensive type definitions
- **Runtime Validation**: Zod schemas for API responses and user inputs
- **Schema-First Development**: Types derived from validation schemas

### 2. Service Layer Pattern
```typescript
// Centralized API service with error handling
export const apiService = {
  async getSessions(query: SessionsQuery): Promise<SessionsResponse> {
    const response = await fetchWithRetry(`${endpoints.sessions}?${params}`)
    return SessionsResponseSchema.parse(await response.json())
  }
}
```

### 3. Custom Hooks for Reusability
- **useUrlState**: URL synchronization with debouncing
- **useWebSocket**: Real-time connections with auto-reconnection
- **useLocalState**: Non-URL state management
- **useExport**: Background export operations

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base components (Button, Input, Modal)
│   ├── charts/         # Data visualization components
│   └── modals/         # Modal components
├── hooks/              # Custom React hooks
├── lib/                # Utilities and configurations
├── pages/              # Page components
├── schemas/            # Zod schemas and types
├── services/           # API services
└── test/               # Test utilities
```

## Data Flow Architecture

### 1. API Layer
```typescript
// Type-safe API calls with retry logic
const fetchWithRetry = async (url: string, options?: RequestInit) => {
  for (let attempt = 1; attempt <= API_CONFIG.RETRY_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(url, options)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return response
    } catch (error) {
      if (attempt === API_CONFIG.RETRY_ATTEMPTS) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
  }
}
```

### 2. State Management
- **TanStack Query**: Server state with caching and synchronization
- **URL State**: Filter persistence and shareable URLs
- **Local State**: Component-specific state management
- **WebSocket**: Real-time updates and notifications

### 3. Schema Validation
```typescript
export const SessionSchema = z.object({
  id: z.string(),
  title: z.string(),
  score: z.number().min(0).max(10),
  created_at: z.string(),
  metrics: z.object({
    confidence: z.number(),
    clarity: z.number(),
    listening: z.number()
  })
})
```

## Performance Architecture

### 1. Virtualization Strategy
- **List Virtualization**: TanStack Virtual for 10,000+ items
- **Transcript Virtualization**: Handles 1,000+ messages
- **Dynamic Height**: Automatic row height calculation

### 2. Caching Strategy
```typescript
// Query configuration with stale time
useQuery({
  queryKey: ['sessions', filters],
  queryFn: () => apiService.getSessions(filters),
  staleTime: API_CONFIG.STALE_TIME, // 5 minutes
  gcTime: 10 * 60 * 1000 // 10 minutes
})
```

### 3. Optimization Techniques
- **Debouncing**: 300ms delay for URL updates
- **Memoization**: React.memo and useMemo for expensive operations
- **Prefetching**: Hover-based session detail prefetching
- **Code Splitting**: Route-based lazy loading ready

## Component Architecture

### 1. Composition Pattern
```typescript
// Flexible component composition
<Modal isOpen={isOpen} onClose={onClose}>
  <Modal.Header>Session Details</Modal.Header>
  <Modal.Body>
    <SessionContent session={session} />
  </Modal.Body>
</Modal>
```

### 2. Hook-Based Logic
```typescript
// Reusable stateful logic
export function useUrlState<T>(initialState: T, debounceMs = 300) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [state, setState] = useState<T>(initialState)
  
  // Debounced URL synchronization
  const debouncedUpdate = useMemo(
    () => debounce((newState: Partial<T>) => {
      // Update URL params
    }, debounceMs),
    [debounceMs]
  )
  
  return [state, debouncedUpdate] as const
}
```

### 3. Error Boundaries
```typescript
class ErrorBoundary extends Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    // Error reporting logic
  }
}
```

## Real-time Architecture

### 1. WebSocket Management
```typescript
export function useWebSocket() {
  const connect = useCallback(() => {
    const ws = new WebSocket(endpoints.websocket)
    
    ws.onopen = () => setIsConnected(true)
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      setLastMessage(message)
    }
    ws.onclose = () => {
      setIsConnected(false)
      // Exponential backoff reconnection
    }
  }, [])
}
```

### 2. Live Updates Integration
- **Query Invalidation**: Automatic cache updates on WebSocket messages
- **Optimistic Updates**: Immediate UI updates with rollback
- **Connection Status**: Visual indicators for connection state

## Security Architecture

### 1. Input Validation
- **Zod Schemas**: Runtime validation for all inputs
- **Sanitization**: XSS prevention through React's built-in protection
- **Type Safety**: Compile-time prevention of injection attacks

### 2. API Security
- **CORS Compliance**: Proper cross-origin request handling
- **Error Handling**: No sensitive information in error messages
- **Request Validation**: Schema validation for all API interactions

## Testing Architecture

### 1. Unit Testing Strategy
```typescript
// Component testing with providers
const renderWithProviders = (component: ReactElement) => {
  return render(
    <QueryClient>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClient>
  )
}
```

### 2. E2E Testing
```typescript
// User workflow testing
test('session management workflow', async ({ page }) => {
  await page.goto('/sessions')
  await page.click('[data-testid="session-row"]:first-child')
  await expect(page.locator('[role="dialog"]')).toBeVisible()
})
```

## Deployment Architecture

### 1. Build Configuration
```typescript
// Vite configuration for production
export default defineConfig({
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['recharts'],
          query: ['@tanstack/react-query']
        }
      }
    }
  }
})
```

### 2. Environment Configuration
- **Development**: Hot reload, source maps, dev tools
- **Production**: Minification, compression, error reporting
- **Testing**: Mock services, test utilities

## Scalability Considerations

### 1. Data Handling
- **Infinite Scroll**: Pagination for large datasets
- **Virtual Scrolling**: Memory-efficient rendering
- **Caching Strategy**: Intelligent cache management

### 2. Code Organization
- **Modular Design**: Clear separation of concerns
- **Reusable Hooks**: Shared logic extraction
- **Type Definitions**: Centralized type management

### 3. Performance Monitoring
- **Bundle Analysis**: Size optimization tracking
- **Runtime Metrics**: Performance monitoring
- **Error Tracking**: Production error reporting

## Future Architecture Enhancements

### 1. Micro-Frontend Ready
- **Module Federation**: Prepared for micro-frontend architecture
- **Independent Deployment**: Component-level deployment capability
- **Shared Dependencies**: Optimized dependency sharing

### 2. Advanced Caching
- **Service Worker**: Offline capability preparation
- **IndexedDB**: Client-side data persistence
- **Background Sync**: Offline operation support

### 3. Enhanced Real-time
- **Server-Sent Events**: Alternative to WebSocket
- **Push Notifications**: Browser notification support
- **Conflict Resolution**: Multi-user editing support