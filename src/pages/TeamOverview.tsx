import { useState, useMemo, useCallback, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { useSearchParams } from 'react-router-dom'
import { apiService } from '@/services/api'
import { TeamPerformanceChart } from '@/components/charts/TeamPerformanceChart'
import { Input } from '@/components/ui/Input'

import { Modal } from '@/components/ui/Modal'
import { User } from '@/schemas'
import { formatScore, getScoreColor, getTrendIcon } from '@/lib/utils'
import { useLocalState } from '@/hooks/useLocalState'
import { useTeamExport } from '@/hooks/useTeamExport'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'

interface UserRowProps {
  user: User
  index: number
  onClick: () => void
  moveUser: (dragIndex: number, hoverIndex: number) => void
}

function UserRow({ user, index, onClick, moveUser }: UserRowProps) {
  const [{ isDragging }, drag] = useDrag({
    type: 'user',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const [, drop] = useDrop({
    accept: 'user',
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        moveUser(item.index, index)
        item.index = index
      }
    },
  })
  return (
    <tr 
      ref={(node) => drag(drop(node))}
      className={`hover:bg-muted/50 cursor-pointer transition-colors ${
        isDragging ? 'opacity-50' : ''
      }`}
      onClick={onClick}
    >
      <td className="px-2 lg:px-4 py-3 font-medium text-sm lg:text-base">{user.first_name}</td>
      <td className="px-2 lg:px-4 py-3">
        <span className={`px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-full text-xs font-medium ${
          user.team === 'Sales' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
          user.team === 'Executive' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
        }`}>
          {user.team}
        </span>
      </td>
      <td className="px-2 lg:px-4 py-3 text-sm lg:text-base">{user.total_sessions || 0}</td>
      <td className={`px-2 lg:px-4 py-3 font-medium text-sm lg:text-base ${getScoreColor(user.avg_score || 0)}`}>
        {formatScore(user.avg_score || 0)}
      </td>
      <td className="px-2 lg:px-4 py-3">
        <span className="flex items-center gap-1 text-sm lg:text-base">
          {getTrendIcon(user.recent_trend || 'stable')}
          <span className="capitalize hidden sm:inline">{user.recent_trend || 'stable'}</span>
        </span>
      </td>
    </tr>
  )
}

function UserModal({ user, isOpen, onClose }: { user: User | null, isOpen: boolean, onClose: () => void }) {
  if (!user) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${user.first_name} - Performance Details`}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-medium text-muted-foreground">Team</h3>
            <p className="text-lg">{user.team}</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-muted-foreground">Total Sessions</h3>
            <p className="text-lg">{user.total_sessions}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-medium text-muted-foreground">Average Score</h3>
            <p className={`text-xl lg:text-2xl font-bold ${getScoreColor(user.avg_score)}`}>
              {formatScore(user.avg_score)}
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-muted-foreground">Best Session</h3>
            <p className="text-xl lg:text-2xl font-bold text-green-600">{user.best_session_score}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium">Detailed Metrics</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-3 lg:p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Confidence</p>
              <p className="text-lg lg:text-xl font-semibold">{formatScore(user.avg_confidence)}</p>
            </div>
            <div className="text-center p-3 lg:p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Clarity</p>
              <p className="text-lg lg:text-xl font-semibold">{formatScore(user.avg_clarity)}</p>
            </div>
            <div className="text-center p-3 lg:p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Listening</p>
              <p className="text-lg lg:text-xl font-semibold">{formatScore(user.avg_listening)}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Recent Trend:</span>
          <span className="flex items-center gap-1">
            {getTrendIcon(user.recent_trend)}
            <span className="capitalize font-medium">{user.recent_trend}</span>
          </span>
        </div>
      </div>
    </Modal>
  )
}

export function TeamOverview() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [filterState, updateFilterState] = useLocalState({
    search: '',
    team: undefined as string | undefined,
  })
  const [users, setUsers] = useState<User[]>([])
  const { exportProgress, exportTeamReport } = useTeamExport()

  const { data: apiUsers = [], isLoading: usersLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: apiService.getUsers,
  })

  // Update local users when API data changes
  useEffect(() => {
    setUsers(apiUsers)
  }, [apiUsers])

  // Handle URL-based modal opening
  useEffect(() => {
    const userId = searchParams.get('user')
    if (userId && users.length > 0) {
      const user = users.find(u => u.id === userId)
      if (user) {
        setSelectedUser(user)
      }
    }
  }, [searchParams, users])

  const { data: teamMetrics = [] } = useQuery({
    queryKey: ['teamMetrics'],
    queryFn: apiService.getTeamMetrics,
  })



  useQuery({
    queryKey: ['userPerformance'],
    queryFn: apiService.getUserPerformance,
  })

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = !filterState.search || user.first_name.toLowerCase().includes(filterState.search.toLowerCase())
      const matchesTeam = !filterState.team || user.team === filterState.team
      return matchesSearch && matchesTeam
    })
  }, [users, filterState.search, filterState.team])

  const topPerformers = useMemo(() => {
    return [...users]
      .sort((a, b) => b.avg_score - a.avg_score)
      .slice(0, 3)
  }, [users])



  const handleUserClick = (user: User) => {
    setSelectedUser(user)
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev)
      newParams.set('user', user.id)
      return newParams
    })
  }

  const handleCloseModal = () => {
    setSelectedUser(null)
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev)
      newParams.delete('user')
      return newParams
    })
  }

  const moveUser = useCallback((dragIndex: number, hoverIndex: number) => {
    setUsers(prev => {
      const newUsers = [...prev]
      const draggedUser = newUsers[dragIndex]
      newUsers.splice(dragIndex, 1)
      newUsers.splice(hoverIndex, 0, draggedUser)
      return newUsers
    })
  }, [])

  if (usersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">Error loading users: {error.message}</div>
      </div>
    )
  }

  if (users.length === 0 && !usersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">No users found</div>
      </div>
    )
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold">Team Overview</h1>
          <Button
            onClick={() => exportTeamReport(users, teamMetrics, undefined, 'team-performance-report')}
            disabled={exportProgress.isExporting}
            variant="outline"
          >
            {exportProgress.isExporting ? 'Generating...' : 'Export PDF Report'}
          </Button>
        </div>

        {/* Export Progress */}
        {exportProgress.isExporting && (
          <div className="bg-card border rounded-lg p-4">
            <ProgressBar 
              progress={exportProgress.progress}
              label="Generating PDF report with charts..."
            />
          </div>
        )}

        {/* Charts and Stats */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
          <div className="flex flex-col space-y-4">
            <h2 className="text-lg lg:text-xl font-semibold">Team Performance</h2>
            <div className="bg-card rounded-lg p-4 lg:p-6 border h-full min-h-[300px]" data-chart="team-performance">
              <TeamPerformanceChart data={teamMetrics} />
            </div>
          </div>

          <div className="flex flex-col space-y-4">
            <h2 className="text-lg lg:text-xl font-semibold">Top Performers</h2>
            <div className="bg-card rounded-lg p-4 lg:p-6 border space-y-4 h-full min-h-[300px]">
              {topPerformers.map((user, index) => (
                <div key={user.id} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-xs lg:text-sm font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm lg:text-base">{user.first_name}</p>
                      <p className="text-xs lg:text-sm text-muted-foreground">{user.team}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm lg:text-base ${getScoreColor(user.avg_score || 0)}`}>
                      {formatScore(user.avg_score || 0)}
                    </p>
                    <p className="text-xs lg:text-sm text-muted-foreground">
                      {user.total_sessions || 0} sessions
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search users..."
            value={filterState.search}
            onChange={(e) => updateFilterState({ search: e.target.value })}
            className="sm:max-w-xs"
          />
          <select
            value={filterState.team || ''}
            onChange={(e) => updateFilterState({ team: e.target.value || undefined })}
            className="px-3 py-2 border border-input rounded-md bg-background"
          >
            <option value="">All Teams</option>
            <option value="Sales">Sales</option>
            <option value="Executive">Executive</option>
            <option value="Engineering">Engineering</option>
          </select>
        </div>

        {/* Users Table */}
        <div className="bg-card rounded-lg border">
          <div className="p-4 lg:p-6 border-b">
            <h2 className="text-lg lg:text-xl font-semibold">
              All Users ({filteredUsers.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-card sticky top-0 z-10 border-b">
                  <tr>
                    <th className="px-2 lg:px-4 py-3 text-left font-medium text-sm lg:text-base">Name</th>
                    <th className="px-2 lg:px-4 py-3 text-left font-medium text-sm lg:text-base">Team</th>
                    <th className="px-2 lg:px-4 py-3 text-left font-medium text-sm lg:text-base">Sessions</th>
                    <th className="px-2 lg:px-4 py-3 text-left font-medium text-sm lg:text-base">Avg Score</th>
                    <th className="px-2 lg:px-4 py-3 text-left font-medium text-sm lg:text-base">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map((user, index) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      index={index}
                      onClick={() => handleUserClick(user)}
                      moveUser={moveUser}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <UserModal
          user={selectedUser}
          isOpen={!!selectedUser}
          onClose={handleCloseModal}
        />
      </div>
    </DndProvider>
  )
}