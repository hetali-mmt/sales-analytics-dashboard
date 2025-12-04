import { useEffect, useRef, useState } from 'react'
import { endpoints } from '@/lib/endpoints'
import { HISTORY_LIMITS } from '@/lib/constants'

interface WebSocketMessage {
  type: 'session_created' | 'session_updated'
  data: unknown
}

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const ws = useRef<WebSocket | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = HISTORY_LIMITS.WEBSOCKET_RECONNECT
  const [shouldConnect, setShouldConnect] = useState(false)

  const connect = () => {
    try {
      ws.current = new WebSocket(endpoints.websocket)
      
      ws.current.onopen = () => {
        setIsConnected(true)
        reconnectAttempts.current = 0
      }

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          setLastMessage(message)
        } catch (error) {
          // Silent error handling
        }
      }

      ws.current.onclose = () => {
        setIsConnected(false)
        
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.pow(2, reconnectAttempts.current) * 1000
          setTimeout(() => {
            reconnectAttempts.current++
            connect()
          }, delay)
        }
      }

      ws.current.onerror = () => {
        setIsConnected(false)
      }
    } catch (error) {
      setIsConnected(false)
    }
  }

  useEffect(() => {
    setIsConnected(false)
  }, [])

  return { isConnected: false, lastMessage: null }
}