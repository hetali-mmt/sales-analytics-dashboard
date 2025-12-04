# Analytics Dashboard

A production-ready analytics dashboard for sales representative practice sessions built with React 19, TypeScript, and modern web technologies.

## 🚀 Features

### Core Features
- **Team Overview**: Interactive dashboard with team performance charts and user management
- **Session Management**: Virtualized list handling 10,000+ sessions with advanced filtering
- **Real-time Updates**: WebSocket integration for live session notifications
- **Session Details**: Modal with virtualized transcript viewer and feedback editing
- **Bulk Operations**: Multi-select and bulk update functionality
- **Score Trends**: Interactive charts with date range selection

### Technical Features
- **Type Safety**: Full TypeScript with Zod schema validation
- **Performance**: Virtualization for large datasets
- **State Management**: URL-synced filters with debouncing
- **Error Handling**: Retry logic and graceful error states
- **Accessibility**: ARIA labels and keyboard navigation
- **Responsive Design**: Mobile-first approach
- **Dark/Light Theme**: System preference detection

## 🛠 Technology Stack

- **React 19** with TypeScript (strict mode)
- **Vite** for build tooling
- **TanStack Query** for data fetching and caching
- **TailwindCSS** for styling
- **Recharts** for data visualization
- **TanStack Virtual** for list virtualization
- **React Router** for navigation
- **Zod** for schema validation
- **Vitest** for unit testing
- **Playwright** for E2E testing

## 📦 Installation

```bash
# Install dependencies
npm install

# Start development server (port 3000 required for CORS)
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Run E2E tests
npm run test:e2e
```

## 🏗 Architecture

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components
│   ├── charts/         # Chart components
│   └── modals/         # Modal components
├── hooks/              # Custom React hooks
├── lib/                # Utilities and configurations
├── pages/              # Page components
├── schemas/            # Zod schemas and types
├── services/           # API services
└── test/               # Test utilities
```

### Key Design Patterns
- **Service Layer**: Centralized API calls with error handling
- **Custom Hooks**: Reusable stateful logic (URL state, WebSocket, undo/redo)
- **Schema Validation**: Runtime type checking with Zod
- **Component Composition**: Flexible and reusable UI components

## 🔧 Configuration

### Environment Variables
```bash
# API Base URL (default: https://frontend-homework.koyeb.app)
VITE_API_BASE_URL=https://frontend-homework.koyeb.app
```

### API Endpoints
- `GET /api/interview/users` - User list
- `GET /api/interview/sessions` - Session list with pagination
- `GET /api/interview/sessions/:id` - Session details
- `PUT /api/interview/sessions/:id` - Update session
- `GET /api/interview/analytics/team-metrics` - Team performance
- `GET /api/interview/analytics/score-trends` - Score trends
- `PUT /api/interview/sessions/bulk` - Bulk update
- `WS /api/interview/ws` - Real-time updates

## 🎯 Key Features Implementation

### 1. Team Overview
- User list with drag-and-drop reordering
- Team performance bar chart
- Top performers ranking
- User detail modal with shareable URLs
- Advanced filtering and search

### 2. Session List
- Virtualized list for 10,000+ items
- Multi-column sorting
- Advanced filtering (score range, date range, team)
- Bulk operations with optimistic updates
- Column customization with persistence
- Infinite scroll pagination

### 3. Session Details
- Virtualized transcript viewer (1000+ messages)
- In-transcript search with highlighting
- Editable feedback with auto-save
- Keyboard navigation (ESC to close)
- Error handling with retry mechanisms

### 4. Real-time Features
- WebSocket connection with auto-reconnect
- Live session notifications
- Connection status indicator
- Exponential backoff for reconnection

### 5. State Management
- URL-synced filters with debouncing
- Undo/redo functionality (Cmd+Z)
- Persistent column preferences
- Shareable URLs for all states

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### Test Coverage
- Component rendering and interactions
- API service error handling
- Custom hooks functionality
- Accessibility compliance

## 🚀 Performance Optimizations

- **Virtualization**: Handles 10,000+ items smoothly
- **Query Caching**: 5-minute stale time for API responses
- **Debounced Updates**: URL state changes debounced to 300ms
- **Code Splitting**: Route-based code splitting
- **Memoization**: React.memo and useMemo for expensive operations

## 🎨 Design System

### Color Scheme
- Supports both light and dark themes
- CSS custom properties for consistent theming
- Accessible color contrasts (WCAG AA compliant)

### Typography
- Consistent font scales
- Proper heading hierarchy
- Readable line heights

### Components
- Consistent spacing using Tailwind scale
- Focus states for keyboard navigation
- Loading and error states

## 🔒 Security & Best Practices

- **Type Safety**: No `any` types, strict TypeScript
- **Input Validation**: Zod schemas for all API responses
- **Error Boundaries**: Graceful error handling
- **Accessibility**: ARIA labels, keyboard navigation
- **Performance**: Virtualization, memoization, debouncing

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Touch-friendly interactions
- Optimized for tablets and mobile devices

## 🔄 State Persistence

- URL state for filters and navigation
- Local storage for theme preference
- Column customization persistence
- Shareable URLs for all application states

## 🚦 Error Handling

- Retry logic with exponential backoff
- Graceful degradation for network issues
- User-friendly error messages
- Loading states for all async operations

## 📈 Monitoring & Analytics

- Performance metrics tracking
- Error boundary reporting
- WebSocket connection monitoring
- User interaction analytics

## 🤝 Contributing

1. Follow TypeScript strict mode
2. Use Zod for all data validation
3. Implement proper error handling
4. Add tests for new features
5. Follow accessibility guidelines
6. Maintain responsive design

## 📄 License

MIT License - see LICENSE file for details