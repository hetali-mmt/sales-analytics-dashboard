import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { TeamOverview } from '@/pages/TeamOverview'
import { SessionList } from '@/pages/SessionList'
import { Dashboard } from '@/pages/Dashboard'
import { useWebSocket } from '@/hooks/useWebSocket'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { Toaster } from 'sonner'

import { API_CONFIG } from '@/lib/constants'

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
  
  return (
    <nav className="bg-card border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-xl font-bold">
              Analytics Dashboard
            </Link>
            <div className="flex space-x-4">
              <Link
                to="/"
                className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Team Overview
              </Link>
              <Link
                to="/sessions"
                className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sessions
              </Link>
              <Link
                to="/dashboard"
                className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Dashboard
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`flex items-center gap-2 text-sm ${
              isConnected ? 'text-green-600' : 'text-red-600'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-600' : 'bg-red-600'
              }`} />
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
            <ThemeToggle />
          </div>
        </div>
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
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <Routes>
                <Route path="/" element={<TeamOverview />} />
                <Route path="/sessions" element={<SessionList />} />
                <Route path="/dashboard" element={<Dashboard />} />
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