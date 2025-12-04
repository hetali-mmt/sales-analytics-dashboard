# Setup Instructions

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`

3. **Run Tests**
   ```bash
   # Unit tests
   npm run test
   
   # E2E tests (requires dev server running)
   npm run test:e2e
   ```

## Development Workflow

### Initial Setup
```bash
# Clone the repository
git clone <repository-url>
cd practical-test

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts
- `npm run dev` - Start development server on port 3000
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run unit tests with Vitest
- `npm run test:ui` - Run tests with UI
- `npm run test:e2e` - Run E2E tests with Playwright
- `npm run lint` - Run ESLint

### Project Structure
```
src/
├── components/          # Reusable components
│   ├── ui/             # Base UI components (Button, Input, Modal)
│   ├── charts/         # Chart components (Recharts)
│   └── modals/         # Modal components
├── hooks/              # Custom React hooks
│   ├── useWebSocket.ts # WebSocket connection management
│   ├── useUrlState.ts  # URL state synchronization
│   └── useUndoRedo.ts  # Undo/redo functionality
├── lib/                # Utilities and configurations
│   ├── endpoints.ts    # API endpoint definitions
│   └── utils.ts        # Utility functions
├── pages/              # Page components
│   ├── TeamOverview.tsx # Team dashboard with charts
│   ├── SessionList.tsx  # Virtualized session list
│   └── Dashboard.tsx    # Score trends dashboard
├── schemas/            # Zod schemas and TypeScript types
├── services/           # API service layer
└── test/               # Test utilities and setup
```

## Key Features Implemented

### ✅ Core Requirements
- [x] Team Overview with analytics and user management
- [x] Virtualized Session List (handles 10,000+ items)
- [x] Session Detail Modal with transcript viewer
- [x] Real-time WebSocket updates
- [x] Bulk operations with optimistic updates
- [x] Score trends charts with date range selection
- [x] URL state persistence for all filters
- [x] Dark/Light theme support
- [x] Responsive design (mobile, tablet, desktop)

### ✅ Technical Requirements
- [x] React 19 with TypeScript (strict mode, no any types)
- [x] Vite build tooling
- [x] TanStack Query for data fetching
- [x] TailwindCSS for styling
- [x] Vitest for unit testing
- [x] Playwright for E2E testing
- [x] Recharts for data visualization
- [x] TanStack Virtual for list virtualization
- [x] Zod schema validation

### ✅ Advanced Features
- [x] Error boundaries with graceful error handling
- [x] Retry logic with exponential backoff
- [x] Debounced URL updates
- [x] Keyboard shortcuts (Cmd+Z for undo/redo)
- [x] Accessibility (ARIA labels, keyboard navigation)
- [x] Performance optimizations (memoization, virtualization)
- [x] Type-safe API layer with Zod validation

## API Integration

The application integrates with the provided API endpoints:
- Base URL: `https://frontend-homework.koyeb.app`
- WebSocket: `wss://frontend-homework.koyeb.app/api/interview/ws`
- Port 3000 required for CORS compliance

### Error Handling
- 20% random failure rate handled with retry logic
- Graceful degradation for network issues
- User-friendly error messages
- Loading states for all async operations

## Performance Considerations

### Virtualization
- Session list handles 10,000+ items smoothly
- Transcript viewer handles 1,000+ messages
- Smooth scrolling with no performance degradation

### Caching
- TanStack Query with 5-minute stale time
- Prefetching on hover for session details
- Optimistic updates for better UX

### State Management
- URL-synced filters with 300ms debouncing
- Persistent column preferences
- Undo/redo with 5-action history limit

## Testing Strategy

### Unit Tests
- Component rendering and interactions
- Custom hooks functionality
- API service error handling
- Utility functions

### E2E Tests
- Complete user workflows
- Cross-browser compatibility
- Accessibility compliance
- Performance benchmarks

## Deployment

### Production Build
```bash
npm run build
```

### Environment Variables
```bash
# Optional: Override API base URL
VITE_API_BASE_URL=https://your-api-url.com
```

### Docker Support (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## Troubleshooting

### Common Issues

1. **Port 3000 Required**
   - The API requires port 3000 for CORS
   - Use `npm run dev` which starts on port 3000

2. **WebSocket Connection Issues**
   - Check network connectivity
   - WebSocket auto-reconnects with exponential backoff

3. **Performance Issues**
   - Virtualization handles large datasets
   - Check browser dev tools for memory usage

4. **Type Errors**
   - All types are strictly validated with Zod
   - No `any` types allowed in strict mode

### Development Tips

1. **Hot Reload**
   - Vite provides fast hot module replacement
   - State is preserved during development

2. **Debugging**
   - React DevTools for component inspection
   - TanStack Query DevTools for cache inspection
   - Browser DevTools for network and performance

3. **Testing**
   - Run tests in watch mode: `npm run test -- --watch`
   - Use test UI: `npm run test:ui`

## Contributing

1. Follow TypeScript strict mode guidelines
2. Use Zod for all data validation
3. Implement proper error handling
4. Add tests for new features
5. Maintain accessibility standards
6. Follow responsive design principles

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the test files for usage examples
3. Check the API documentation
4. Review the component implementations