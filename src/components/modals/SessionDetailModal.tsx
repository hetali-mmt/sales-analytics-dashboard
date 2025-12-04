import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useVirtualizer } from '@tanstack/react-virtual'
import { apiService } from '@/services/api'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { TranscriptMessage } from '@/schemas'
import { VIRTUALIZATION } from '@/lib/constants'

interface SessionDetailModalProps {
  sessionId: string | null
  isOpen: boolean
  onClose: () => void
}

interface TranscriptRowProps {
  message: TranscriptMessage
  style: React.CSSProperties
  searchTerm: string
}

function TranscriptRow({ message, style, searchTerm }: TranscriptRowProps) {
  const highlightText = (text: string, search: string) => {
    if (!search) return text
    
    const regex = new RegExp(`(${search})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800">
          {part}
        </mark>
      ) : part
    )
  }

  return (
    <div style={style} className="flex gap-4 px-4 py-3 border-b">
      <div className="flex-shrink-0 w-16 text-sm text-muted-foreground">
        {Math.floor(message.secondsFromStart / 60)}:{(message.secondsFromStart % 60).toString().padStart(2, '0')}
      </div>
      <div className="flex-shrink-0 w-20">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          message.speaker === 'Agent' 
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
        }`}>
          {message.speaker}
        </span>
      </div>
      <div className="flex-1 text-sm">
        {highlightText(message.text, searchTerm)}
      </div>
    </div>
  )
}

export function SessionDetailModal({ sessionId, isOpen, onClose }: SessionDetailModalProps) {
  const [feedback, setFeedback] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const queryClient = useQueryClient()

  const { data: sessionDetail, isLoading } = useQuery({
    queryKey: ['sessionDetail', sessionId],
    queryFn: () => sessionId ? apiService.getSessionDetail(sessionId) : null,
    enabled: !!sessionId && isOpen,
  })

  const updateMutation = useMutation({
    mutationFn: (newFeedback: string) => 
      sessionId ? apiService.bulkUpdateSessions({
        session_ids: [sessionId],
        feedback: newFeedback,
      }) : Promise.reject(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessionDetail', sessionId] })
      setIsEditing(false)
    },
  })

  const filteredTranscript = useMemo(() => {
    if (!sessionDetail?.transcript || !searchTerm) {
      return sessionDetail?.transcript || []
    }
    
    return sessionDetail.transcript.filter(message =>
      message.text.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [sessionDetail?.transcript, searchTerm])

  const parentRef = useState<HTMLDivElement | null>(null)
  
  const virtualizer = useVirtualizer({
    count: filteredTranscript.length,
    getScrollElement: () => parentRef[0],
    estimateSize: () => VIRTUALIZATION.TRANSCRIPT_ROW_HEIGHT,
    overscan: VIRTUALIZATION.OVERSCAN,
  })

  const handleSaveFeedback = () => {
    if (feedback.trim()) {
      updateMutation.mutate(feedback)
    }
  }

  const handleClose = () => {
    setSearchTerm('')
    setIsEditing(false)
    setFeedback('')
    onClose()
  }

  if (!sessionId || !isOpen) return null

  if (isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Session Details">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Modal>
    )
  }

  if (!sessionDetail) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Session Details">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Session not found</p>
          <Button onClick={handleClose} className="mt-4">Close</Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title="Session Details"
      className="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Session Metadata */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-muted-foreground">Session ID</h3>
              <p className="font-mono text-sm">{sessionDetail.id}</p>
            </div>
            <div>
              <h3 className="font-medium text-muted-foreground">User ID</h3>
              <p className="font-mono text-sm">{sessionDetail.user_id}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-muted-foreground">Transcript Messages</h3>
              <p className="text-lg font-semibold">{sessionDetail.transcript.length}</p>
            </div>
          </div>
        </div>

        {/* Feedback Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Feedback</h3>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditing(true)
                  setFeedback(sessionDetail.feedback)
                }}
              >
                Edit
              </Button>
            )}
          </div>
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full h-24 px-3 py-2 border border-input rounded-md bg-background resize-none"
                placeholder="Enter feedback..."
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveFeedback}
                  disabled={updateMutation.isPending}
                  size="sm"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm bg-muted p-3 rounded-md">
              {sessionDetail.feedback || 'No feedback provided'}
            </p>
          )}
        </div>

        {/* Transcript Search */}
        <div className="space-y-2">
          <h3 className="font-medium">Transcript Search</h3>
          <Input
            placeholder="Search transcript..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Virtualized Transcript */}
        <div className="space-y-2">
          <h3 className="font-medium">
            Transcript ({filteredTranscript.length} messages)
          </h3>
          <div className="border rounded-lg">
            <div
              ref={(el) => (parentRef[0] = el)}
              className="h-96 overflow-auto"
            >
              <div
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {virtualizer.getVirtualItems().map((virtualItem) => {
                  const message = filteredTranscript[virtualItem.index]
                  return (
                    <TranscriptRow
                      key={virtualItem.index}
                      message={message}
                      searchTerm={searchTerm}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                    />
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}