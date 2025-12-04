import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { useWebSocket } from '@/hooks/useWebSocket'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { Toaster } from 'sonner'
import { API_CONFIG } from '@/lib/constants'
import { routes } from '@/lib/routes'
import { Menu, X } from 'lucide-react'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: API_CONFIG.STALE_TIME,
      retry: API_CONFIG.RETRY_ATTEMPTS,
    },
  },
})

function Navigation() {
  const { isConnected } = useWebSocket()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  return (
    <nav className="bg-card border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold">
              Analytics Dashboard
            </Link>
            {/* Desktop Navigation */}
            <div className="hidden md:flex ml-8 space-x-4">
              {routes.map((route) => (
                <Link
                  key={route.path}
                  to={route.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === route.path
                      ? 'text-foreground bg-muted'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {route.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`hidden sm:flex items-center gap-2 text-sm ${
              isConnected ? 'text-green-600' : 'text-red-600'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-600' : 'bg-red-600'
              }`} />
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
            <ThemeToggle />
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md hover:bg-muted transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {routes.map((route) => (
                <Link
                  key={route.path}
                  to={route.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    location.pathname === route.path
                      ? 'text-foreground bg-muted'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {route.label}
                </Link>
              ))}
              <div className={`flex items-center gap-2 px-3 py-2 text-sm ${
                isConnected ? 'text-green-600' : 'text-red-600'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-600' : 'bg-red-600'
                }`} />
                {isConnected ? 'Connected' : 'Disconnected'}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark')
    }
    return false
  })

  const toggleTheme = () => {
    const newTheme = !isDark
    setIsDark(newTheme)
    document.documentElement.classList.toggle('dark', newTheme)
    localStorage.setItem('theme', newTheme ? 'dark' : 'light')
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md hover:bg-muted transition-colors"
      aria-label="Toggle theme"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="min-h-screen bg-background text-foreground">
            <Navigation />
            <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 lg:py-8">
              <Routes>
                {routes.map((route) => {
                  const Component = route.component
                  return (
                    <Route
                      key={route.path}
                      path={route.path}
                      element={<Component />}
                    />
                  )
                })}
              </Routes>
            </main>
            <Toaster />
          </div>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App