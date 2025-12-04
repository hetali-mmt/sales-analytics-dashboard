import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useVirtualizer } from '@tanstack/react-virtual'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { useSearchParams } from 'react-router-dom'
import { apiService } from '@/services/api'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { SessionDetailModal } from '@/components/modals/SessionDetailModal'
import { Toast } from '@/components/ui/Toast'
import { Session } from '@/schemas'
import { formatDuration, formatScore, getScoreColor } from '@/lib/utils'
import { useUrlState } from '@/hooks/useUrlState'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useExport } from '@/hooks/useExport'
import { ProgressBar } from '@/components/ui/ProgressBar'
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
          onClick={(e) => e.stopPropagation()}
          className="rounded"
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{session.title}</p>
      </div>
      <div className="text-center w-20">
        <p className="text-sm font-mono">{session.user_id.slice(-6)}</p>
      </div>
      <div className="text-center w-32">
        <p className="text-xs text-muted-foreground">
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
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [bulkFeedback, setBulkFeedback] = useState('')
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [showColumnDropdown, setShowColumnDropdown] = useState(false)
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
  
  // Local filter states for immediate UI updates
  const [localSearch, setLocalSearch] = useState('')
  const [localScoreMin, setLocalScoreMin] = useState<number | ''>(SCORE_RANGES.MIN)
  const [localScoreMax, setLocalScoreMax] = useState<number | ''>(SCORE_RANGES.MAX)
  const [localDateFrom, setLocalDateFrom] = useState('')
  const [localDateTo, setLocalDateTo] = useState('')
  const [localTeam, setLocalTeam] = useState<string>('')
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  
  const queryClient = useQueryClient()
  
  const [urlState, updateUrlState] = useUrlState({
    pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
    search: '',
    sortBy: 'created_at' as 'score' | 'created_at' | 'title',
    sortOrder: 'desc' as 'asc' | 'desc',
    scoreMin: SCORE_RANGES.MIN as number,
    scoreMax: SCORE_RANGES.MAX as number,
    dateFrom: '',
    dateTo: '',
    team: undefined as 'Sales' | 'Executive' | 'Engineering' | undefined,
    sessionId: '',
  }, 300, true)

  const { isConnected, lastMessage } = useWebSocket()
  const { exportProgress, exportToCSV, exportToPDF } = useExport()

  const {
    data: sessionsData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['sessions', urlState],
    queryFn: ({ pageParam = 1 }) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { sessionId, ...queryParams } = urlState
      // Send all filters to API
      const serverParams = {
        page: pageParam,
        pageSize: queryParams.pageSize,
        sortBy: queryParams.sortBy,
        sortOrder: queryParams.sortOrder,
        search: queryParams.search,
        scoreMin: queryParams.scoreMin,
        scoreMax: queryParams.scoreMax,
        dateFrom: queryParams.dateFrom,
        dateTo: queryParams.dateTo,
        team: queryParams.team,
      }
      return apiService.getSessions(serverParams)
    },
    getNextPageParam: (lastPage, allPages) => {
      const totalLoaded = allPages.reduce((sum, page) => sum + page.sessions.length, 0)
      return totalLoaded < lastPage.total ? allPages.length + 1 : undefined
    },
    initialPageParam: 1,
  })

  // Flatten all pages into single sessions array
  const allSessions = useMemo(() => {
    return sessionsData?.pages.flatMap(page => page.sessions) ?? []
  }, [sessionsData])

  const totalSessions = sessionsData?.pages[0]?.total ?? 0

  // Update local sessions when API data changes
  useEffect(() => {

    setSessions(allSessions)
  }, [allSessions])

  // Initialize local filter states from URL state
  useEffect(() => {
    setLocalSearch(urlState.search)
    setLocalScoreMin(urlState.scoreMin)
    setLocalScoreMax(urlState.scoreMax)
    setLocalDateFrom(urlState.dateFrom)
    setLocalDateTo(urlState.dateTo)
    setLocalTeam(urlState.team || '')
  }, [urlState.search, urlState.scoreMin, urlState.scoreMax, urlState.dateFrom, urlState.dateTo, urlState.team])

  // Handle URL-based modal opening
  useEffect(() => {
    const sessionId = searchParams.get('sessionId')
    if (sessionId && sessionId !== selectedSessionId) {
      setSelectedSessionId(sessionId)
    }
  }, [searchParams, selectedSessionId])

  // Handle real-time WebSocket updates
  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'session_created') {
        // Invalidate and refetch sessions to get new data
        queryClient.invalidateQueries({ queryKey: ['sessions'] })
        
        // Show toast notification
        setToastMessage('New session created!')
        setShowToast(true)

      } else if (lastMessage.type === 'session_updated') {
        // Invalidate sessions to refresh data
        queryClient.invalidateQueries({ queryKey: ['sessions'] })
        
        setToastMessage('Session updated!')
        setShowToast(true)

      }
    }
  }, [lastMessage, queryClient])

  // Prefetch session details on hover
  const prefetchSession = useCallback((sessionId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['sessionDetail', sessionId],
      queryFn: () => apiService.getSessionDetail(sessionId),
    })
  }, [queryClient])

  const filteredSessions = useMemo(() => {

    
    if (sessions.length === 0) return []
    
    let filtered = [...sessions]
    
    // Apply frontend filters
    if (urlState.search && urlState.search.trim()) {
      const searchTerm = urlState.search.toLowerCase().trim()
      filtered = filtered.filter(session => 
        session.title.toLowerCase().includes(searchTerm)
      )

    }
    
    // Score range filter
    if (urlState.scoreMin > SCORE_RANGES.MIN || urlState.scoreMax < SCORE_RANGES.MAX) {
      filtered = filtered.filter(session => 
        session.score >= urlState.scoreMin && session.score <= urlState.scoreMax
      )

    }
    
    // Date filters
    if (urlState.dateFrom) {
      filtered = filtered.filter(session => 
        new Date(session.created_at) >= new Date(urlState.dateFrom)
      )

    }
    
    if (urlState.dateTo) {
      const endDate = new Date(urlState.dateTo)
      endDate.setHours(23, 59, 59, 999) // End of day
      filtered = filtered.filter(session => 
        new Date(session.created_at) <= endDate
      )

    }
    
    // Team filter
    if (urlState.team) {
      // Note: sessions don't have team field, this might need user lookup

    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aVal: any, bVal: any
      
      switch (urlState.sortBy) {
        case 'score':
          aVal = a.score
          bVal = b.score
          break
        case 'title':
          aVal = a.title.toLowerCase()
          bVal = b.title.toLowerCase()
          break

        case 'created_at':
        default:
          aVal = new Date(a.created_at)
          bVal = new Date(b.created_at)
          break
      }
      
      if (urlState.sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })
    

    return filtered
  }, [sessions, urlState.search, urlState.scoreMin, urlState.scoreMax, urlState.dateFrom, urlState.dateTo, urlState.team, urlState.sortBy, urlState.sortOrder])

  const parentRef = useRef<HTMLDivElement | null>(null)
  
  const virtualizer = useVirtualizer({
    count: filteredSessions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => VIRTUALIZATION.SESSION_ROW_HEIGHT,
    overscan: VIRTUALIZATION.OVERSCAN,
  })

  // Infinite scroll effect
  useEffect(() => {
    const [lastItem] = [...virtualizer.getVirtualItems()].reverse()
    
    if (!lastItem) return
    
    if (
      lastItem.index >= filteredSessions.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage()
    }
  }, [virtualizer.getVirtualItems(), filteredSessions.length, hasNextPage, isFetchingNextPage, fetchNextPage])

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
      
      // Update local sessions with new feedback
      setSessions(prev => prev.map(session => 
        selectedSessions.has(session.id) 
          ? { ...session, feedback: bulkFeedback }
          : session
      ))
      
      // Invalidate session detail cache for updated sessions
      selectedSessions.forEach(sessionId => {
        queryClient.invalidateQueries({ queryKey: ['sessionDetail', sessionId] })
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

  if (isLoading && !sessionsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isLoading && allSessions.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-muted-foreground text-lg">No sessions found</div>
      </div>
    )
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">
            Sessions ({filteredSessions.length}{totalSessions > allSessions.length ? ` of ${totalSessions}` : ''})
          </h1>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm text-muted-foreground">
              {isConnected ? 'Live' : 'Disconnected'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => exportToCSV(filteredSessions, 'sessions-export')}
            disabled={exportProgress.isExporting}
          >
            {exportProgress.isExporting && exportProgress.type === 'csv' ? 'Exporting...' : 'Export CSV'}
          </Button>
          <Button
            variant="outline"
            onClick={() => exportToPDF(filteredSessions, undefined, 'sessions-report')}
            disabled={exportProgress.isExporting}
          >
            {exportProgress.isExporting && exportProgress.type === 'pdf' ? 'Generating...' : 'Export PDF'}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowBulkActions(!showBulkActions)}
          >
            {showBulkActions ? 'Cancel' : 'Bulk Actions'}
          </Button>
          <div className="relative">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowColumnDropdown(!showColumnDropdown)}
            >
              Columns ▼
            </Button>
            {showColumnDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowColumnDropdown(false)}
                />
                <div className="absolute right-0 mt-1 bg-card border rounded-lg shadow-lg p-2 space-y-1 z-20">
                  {Object.entries(visibleColumns).map(([key, visible]) => (
                    <label key={key} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={visible}
                        onChange={() => toggleColumn(key as keyof ColumnConfig)}
                      />
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>



      {/* Export Progress */}
      {exportProgress.isExporting && (
        <div className="bg-card border rounded-lg p-4">
          <ProgressBar 
            progress={exportProgress.progress}
            label={`${exportProgress.type === 'csv' ? 'Exporting CSV' : 'Generating PDF'}...`}
          />
        </div>
      )}

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

      {/* Clear Filters Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setLocalSearch('')
            setLocalScoreMin(SCORE_RANGES.MIN)
            setLocalScoreMax(SCORE_RANGES.MAX)
            setLocalDateFrom('')
            setLocalDateTo('')
            setLocalTeam('')
            window.location.href = '/sessions'
          }}
        >
          Clear All Filters
        </Button>
      </div>

      {/* Virtualized List */}
      <div className="bg-card border rounded-lg">
        {/* Sticky Header with Filters */}
        <div className="sticky top-0 z-10 bg-card border-b">
          {/* Column Headers */}
          <div className="flex items-center gap-4 px-4 py-3 font-medium text-sm border-b">
            {showBulkActions && <div className="w-6"></div>}
            <div className="flex-1 min-w-0">
              <button
                onClick={() => updateUrlState({ 
                  sortBy: 'title',
                  sortOrder: urlState.sortBy === 'title' && urlState.sortOrder === 'asc' ? 'desc' : 'asc'
                })}
                className="flex items-center gap-1 hover:text-primary"
              >
                Title
                {urlState.sortBy === 'title' && (
                  <span>{urlState.sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
            </div>
            <div className="text-center w-20">
              <span className="text-sm font-medium">User</span>
            </div>
            <div className="text-center w-32">
              <button
                onClick={() => updateUrlState({ 
                  sortBy: 'created_at',
                  sortOrder: urlState.sortBy === 'created_at' && urlState.sortOrder === 'asc' ? 'desc' : 'asc'
                })}
                className="flex items-center gap-1 hover:text-primary"
              >
                Created At
                {urlState.sortBy === 'created_at' && (
                  <span>{urlState.sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
            </div>
            {visibleColumns.score && (
              <div className="text-center w-16">
                <button
                  onClick={() => updateUrlState({ 
                    sortBy: 'score',
                    sortOrder: urlState.sortBy === 'score' && urlState.sortOrder === 'asc' ? 'desc' : 'asc'
                  })}
                  className="flex items-center gap-1 hover:text-primary"
                >
                  Score
                  {urlState.sortBy === 'score' && (
                    <span>{urlState.sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </div>
            )}
            {visibleColumns.confidence && <div className="text-center w-16">Confidence</div>}
            {visibleColumns.clarity && <div className="text-center w-16">Clarity</div>}
            {visibleColumns.listening && <div className="text-center w-16">Listening</div>}
            {visibleColumns.duration && <div className="text-center w-20">Duration</div>}
          </div>
          
          {/* Filter Row */}
          <div className="flex items-center gap-4 px-4 py-2 bg-muted/30">
            {showBulkActions && <div className="w-6"></div>}
            <div className="flex-1 min-w-0">
              <Input
                placeholder="Search by title..."
                value={localSearch}
                onChange={(e) => {
                  const value = e.target.value
                  setLocalSearch(value)
                  updateUrlState({ search: value })
                }}
                className="h-8 text-xs"
              />
            </div>
            <div className="w-20">
              <select
                value={localTeam}
                onChange={(e) => {
                  const value = e.target.value
                  setLocalTeam(value)
                  updateUrlState({ team: (value as 'Sales' | 'Executive' | 'Engineering') || undefined })
                }}
                className="h-8 px-2 text-xs border border-input rounded bg-background w-full"
              >
                <option value="">All Teams</option>
                <option value="Sales">Sales</option>
                <option value="Executive">Executive</option>
                <option value="Engineering">Engineering</option>
              </select>
            </div>
            <div className="w-32">
              <div className="flex flex-col gap-1">
                <Input
                  type="date"
                  value={localDateFrom}
                  onChange={(e) => {
                    setLocalDateFrom(e.target.value)
                    updateUrlState({ dateFrom: e.target.value })
                  }}
                  className="h-6 text-xs w-full"
                />
                <Input
                  type="date"
                  value={localDateTo}
                  onChange={(e) => {
                    setLocalDateTo(e.target.value)
                    updateUrlState({ dateTo: e.target.value })
                  }}
                  className="h-6 text-xs w-full"
                />
              </div>
            </div>
            {visibleColumns.score && (
              <div className="w-16">
                <div className="flex flex-col gap-1">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={localScoreMin === SCORE_RANGES.MIN ? '' : localScoreMin}
                    onChange={(e) => {
                      const value = e.target.value ? Number(e.target.value) : SCORE_RANGES.MIN
                      setLocalScoreMin(value)
                    }}
                    onBlur={(e) => {
                      const value = e.target.value ? Number(e.target.value) : SCORE_RANGES.MIN
                      updateUrlState({ scoreMin: value })
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const value = e.currentTarget.value ? Number(e.currentTarget.value) : SCORE_RANGES.MIN
                        updateUrlState({ scoreMin: value })
                      }
                    }}
                    min={0}
                    max={10}
                    className="h-6 text-xs w-full"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={localScoreMax === SCORE_RANGES.MAX ? '' : localScoreMax}
                    onChange={(e) => {
                      const value = e.target.value ? Number(e.target.value) : SCORE_RANGES.MAX
                      setLocalScoreMax(value)
                    }}
                    onBlur={(e) => {
                      const value = e.target.value ? Number(e.target.value) : SCORE_RANGES.MAX
                      updateUrlState({ scoreMax: value })
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const value = e.currentTarget.value ? Number(e.currentTarget.value) : SCORE_RANGES.MAX
                        updateUrlState({ scoreMax: value })
                      }
                    }}
                    min={0}
                    max={10}
                    className="h-6 text-xs w-full"
                  />
                </div>
              </div>
            )}
            {visibleColumns.confidence && <div className="w-16"></div>}
            {visibleColumns.clarity && <div className="w-16"></div>}
            {visibleColumns.listening && <div className="w-16"></div>}
            {visibleColumns.duration && <div className="w-20"></div>}
          </div>
        </div>
        
        <div
          ref={parentRef}
          className="h-[calc(100vh-200px)] overflow-auto relative"
        >
          {filteredSessions.length === 0 && allSessions.length > 0 && (
            <div className="absolute inset-0 flex items-center justify-center z-30">
              <div className="text-muted-foreground text-lg bg-card px-4 py-2 rounded-lg shadow-lg">No sessions match your filters</div>
            </div>
          )}
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {filteredSessions.length > 0 && (
              virtualizer.getVirtualItems().map((virtualItem) => {
                const session = filteredSessions[virtualItem.index]
                if (!session) {

                  return null
                }
                
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
                    setSearchParams(prev => {
                      const newParams = new URLSearchParams(prev)
                      newParams.set('sessionId', session.id)
                      return newParams
                    })
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
            })
            )}
            {isFetchingNextPage && (
              <div className="absolute bottom-0 left-0 right-0 flex justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      <SessionDetailModal
        sessionId={selectedSessionId}
        isOpen={!!selectedSessionId}
        onClose={() => {
          setSelectedSessionId(null)
          setSearchParams(prev => {
            const newParams = new URLSearchParams(prev)
            newParams.delete('sessionId')
            return newParams
          })
        }}
      />
      
      {showToast && (
        <Toast
          message={toastMessage}
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
    </DndProvider>
  )
}