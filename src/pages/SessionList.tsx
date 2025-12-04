import { useState, useMemo, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useVirtualizer } from '@tanstack/react-virtual'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { apiService } from '@/services/api'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { SessionDetailModal } from '@/components/modals/SessionDetailModal'
import { Session } from '@/schemas'
import { formatDuration, formatScore, getScoreColor } from '@/lib/utils'
import { useUrlState } from '@/hooks/useUrlState'
import { useWebSocket } from '@/hooks/useWebSocket'
import { PAGINATION, SCORE_RANGES, VIRTUALIZATION, PAGE_SIZES } from '@/lib/constants'
import { format, parseISO } from 'date-fns'


interface SessionRowProps {
  session: Session
  style: React.CSSProperties
  onClick: () => void
  onHover: () => void
  isSelected: boolean
  onSelect: (selected: boolean) => void
  showBulkActions: boolean
  index: number
  moveRow: (dragIndex: number, hoverIndex: number) => void
  visibleColumns: ColumnConfig
}

interface ColumnConfig {
  score: boolean
  confidence: boolean
  clarity: boolean
  listening: boolean
  duration: boolean
}

function SessionRow({ session, style, onClick, onHover, isSelected, onSelect, showBulkActions, index, moveRow, visibleColumns }: SessionRowProps) {
  const [{ isDragging }, drag] = useDrag({
    type: 'session',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const [, drop] = useDrop({
    accept: 'session',
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        moveRow(item.index, index)
        item.index = index
      }
    },
  })
  return (
    <div
      ref={(node) => drag(drop(node))}
      style={{ ...style, opacity: isDragging ? 0.5 : 1 }}
      className={`flex items-center gap-4 px-4 py-3 border-b hover:bg-muted/50 cursor-pointer transition-colors ${
        isSelected ? 'bg-primary/10' : ''
      }`}
      onClick={onClick}
      onMouseEnter={onHover}
    >
      {showBulkActions && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation()
            onSelect(e.target.checked)
          }}
          className="rounded"
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{session.title}</p>
        <p className="text-sm text-muted-foreground">
          {format(parseISO(session.created_at), 'MMM dd, yyyy HH:mm')}
        </p>
      </div>
      {visibleColumns.score && (
        <div className="text-center w-16">
          <p className={`font-bold ${getScoreColor(session.score)}`}>
            {formatScore(session.score)}
          </p>
        </div>
      )}
      {visibleColumns.confidence && (
        <div className="text-center w-16">
          <p className="text-sm">{session.metrics.confidence}</p>
        </div>
      )}
      {visibleColumns.clarity && (
        <div className="text-center w-16">
          <p className="text-sm">{session.metrics.clarity}</p>
        </div>
      )}
      {visibleColumns.listening && (
        <div className="text-center w-16">
          <p className="text-sm">{session.metrics.listening}</p>
        </div>
      )}
      {visibleColumns.duration && (
        <div className="text-center w-20">
          <p className="text-sm text-muted-foreground">
            {formatDuration(session.duration)}
          </p>
        </div>
      )}
    </div>
  )
}

export function SessionList() {
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [bulkFeedback, setBulkFeedback] = useState('')
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [visibleColumns, setVisibleColumns] = useState<ColumnConfig>(() => {
    const saved = localStorage.getItem('sessionColumns')
    return saved ? JSON.parse(saved) : {
      score: true,
      confidence: true,
      clarity: true,
      listening: true,
      duration: true,
    }
  })
  const queryClient = useQueryClient()
  
  const [urlState, updateUrlState] = useUrlState({
    page: 1,
    pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
    search: '',
    sortBy: 'created_at' as const,
    sortOrder: 'desc' as const,
    scoreMin: SCORE_RANGES.MIN,
    scoreMax: SCORE_RANGES.MAX,
    dateFrom: '',
    dateTo: '',
    team: undefined as 'Sales' | 'Executive' | 'Engineering' | undefined,
    sessionId: '',
  }, 300, true)

  useWebSocket()

  const { data: sessionsData, isLoading } = useQuery({
    queryKey: ['sessions', urlState],
    queryFn: () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { sessionId, ...queryParams } = urlState
      return apiService.getSessions(queryParams)
    },
  })

  // Update local sessions when API data changes
  useState(() => {
    if (sessionsData?.sessions) {
      setSessions(sessionsData.sessions)
    }
  })

  // Prefetch session details on hover
  const prefetchSession = useCallback((sessionId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['sessionDetail', sessionId],
      queryFn: () => apiService.getSessionDetail(sessionId),
    })
  }, [queryClient])

  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      const matchesSearch = !urlState.search || session.title.toLowerCase().includes(urlState.search.toLowerCase())
      const matchesScore = session.score >= urlState.scoreMin && session.score <= urlState.scoreMax
      const matchesDateFrom = !urlState.dateFrom || new Date(session.created_at) >= new Date(urlState.dateFrom)
      const matchesDateTo = !urlState.dateTo || new Date(session.created_at) <= new Date(urlState.dateTo)
      return matchesSearch && matchesScore && matchesDateFrom && matchesDateTo
    })
  }, [sessions, urlState.search, urlState.scoreMin, urlState.scoreMax, urlState.dateFrom, urlState.dateTo])

  const parentRef = useState<HTMLDivElement | null>(null)
  
  const virtualizer = useVirtualizer({
    count: filteredSessions.length,
    getScrollElement: () => parentRef[0],
    estimateSize: () => VIRTUALIZATION.SESSION_ROW_HEIGHT,
    overscan: VIRTUALIZATION.OVERSCAN,
  })

  const handleSelectAll = () => {
    if (selectedSessions.size === filteredSessions.length) {
      setSelectedSessions(new Set())
    } else {
      setSelectedSessions(new Set(filteredSessions.map(s => s.id)))
    }
  }

  const handleBulkUpdate = async () => {
    if (selectedSessions.size === 0 || !bulkFeedback.trim()) return
    
    try {
      await apiService.bulkUpdateSessions({
        session_ids: Array.from(selectedSessions),
        feedback: bulkFeedback,
      })
      setSelectedSessions(new Set())
      setBulkFeedback('')
      setShowBulkActions(false)
    } catch (error) {
      // Silent error handling
    }
  }

  const moveRow = useCallback((dragIndex: number, hoverIndex: number) => {
    setSessions(prev => {
      const newSessions = [...prev]
      const draggedSession = newSessions[dragIndex]
      newSessions.splice(dragIndex, 1)
      newSessions.splice(hoverIndex, 0, draggedSession)
      return newSessions
    })
  }, [])

  const toggleColumn = (column: keyof ColumnConfig) => {
    const newColumns = { ...visibleColumns, [column]: !visibleColumns[column] }
    setVisibleColumns(newColumns)
    localStorage.setItem('sessionColumns', JSON.stringify(newColumns))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold">Sessions ({filteredSessions.length})</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowBulkActions(!showBulkActions)}
          >
            {showBulkActions ? 'Cancel' : 'Bulk Actions'}
          </Button>
          <div className="relative">
            <Button variant="outline" size="sm">
              Columns ▼
            </Button>
            <div className="absolute right-0 mt-1 bg-card border rounded-lg shadow-lg p-2 space-y-1 z-10">
              {Object.entries(visibleColumns).map(([key, visible]) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={visible}
                    onChange={() => toggleColumn(key as keyof ColumnConfig)}
                  />
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <Input
          placeholder="Search sessions..."
          value={urlState.search}
          onChange={(e) => updateUrlState({ search: e.target.value })}
        />
        <select
          value={urlState.sortBy}
          onChange={(e) => updateUrlState({ sortBy: e.target.value as any })}
          className="px-3 py-2 border border-input rounded-md bg-background"
        >
          <option value="created_at">Sort by Date</option>
          <option value="score">Sort by Score</option>
          <option value="title">Sort by Title</option>
        </select>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min Score"
            value={urlState.scoreMin}
            onChange={(e) => updateUrlState({ scoreMin: Number(e.target.value) })}
            min={0}
            max={10}
          />
          <Input
            type="number"
            placeholder="Max Score"
            value={urlState.scoreMax}
            onChange={(e) => updateUrlState({ scoreMax: Number(e.target.value) })}
            min={0}
            max={10}
          />
        </div>
        <Input
          type="date"
          placeholder="From Date"
          value={urlState.dateFrom}
          onChange={(e) => updateUrlState({ dateFrom: e.target.value })}
        />
        <Input
          type="date"
          placeholder="To Date"
          value={urlState.dateTo}
          onChange={(e) => updateUrlState({ dateTo: e.target.value })}
        />
        <select
          value={urlState.pageSize}
          onChange={(e) => updateUrlState({ pageSize: Number(e.target.value) })}
          className="px-3 py-2 border border-input rounded-md bg-background"
        >
          {PAGE_SIZES.map((size: number) => (
            <option key={size} value={size}>{size} per page</option>
          ))}
        </select>
      </div>

      {/* Bulk Actions */}
      {showBulkActions && (
        <div className="bg-card border rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedSessions.size === filteredSessions.length ? 'Deselect All' : 'Select All'}
            </Button>
            <span className="text-sm text-muted-foreground">
              {selectedSessions.size} selected
            </span>
          </div>
          {selectedSessions.size > 0 && (
            <div className="flex gap-4">
              <Input
                placeholder="Bulk feedback..."
                value={bulkFeedback}
                onChange={(e) => setBulkFeedback(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleBulkUpdate} disabled={!bulkFeedback.trim()}>
                Update Selected
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Virtualized List */}
      <div className="bg-card border rounded-lg">
        <div
          ref={(el) => (parentRef[0] = el)}
          className="h-[600px] overflow-auto"
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const session = filteredSessions[virtualItem.index]
              return (
                <SessionRow
                  key={session.id}
                  session={session}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                  onClick={() => {
                    setSelectedSessionId(session.id)
                    updateUrlState({ sessionId: session.id })
                  }}
                  onHover={() => prefetchSession(session.id)}
                  isSelected={selectedSessions.has(session.id)}
                  onSelect={(selected) => {
                    const newSelected = new Set(selectedSessions)
                    if (selected) {
                      newSelected.add(session.id)
                    } else {
                      newSelected.delete(session.id)
                    }
                    setSelectedSessions(newSelected)
                  }}
                  showBulkActions={showBulkActions}
                  index={virtualItem.index}
                  moveRow={moveRow}
                  visibleColumns={visibleColumns}
                />
              )
            })}
          </div>
        </div>
      </div>

      <SessionDetailModal
        sessionId={selectedSessionId}
        isOpen={!!selectedSessionId}
        onClose={() => {
          setSelectedSessionId(null)
          updateUrlState({ sessionId: '' })
        }}
      />
    </div>
    </DndProvider>
  )
}