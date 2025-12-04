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
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  const ws = useRef<WebSocket | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = HISTORY_LIMITS.WEBSOCKET_RECONNECT

  const connect = () => {
    if (ws.current?.readyState === WebSocket.CONNECTING || ws.current?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      setConnectionStatus('connecting')

      
      ws.current = new WebSocket(endpoints.websocket)
      
      ws.current.onopen = () => {

        setIsConnected(true)
        setConnectionStatus('connected')
        reconnectAttempts.current = 0
      }

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)

          setLastMessage(message)
        } catch (error) {

        }
      }

      ws.current.onclose = (event) => {

        
        if (event.code === 1006) {

          setConnectionStatus('error')
          return
        }
        setIsConnected(false)
        setConnectionStatus('disconnected')
        
        // Only reconnect on unexpected closures (not manual close or server rejection)
        if (event.code !== 1000 && event.code !== 1006 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)

          
          setTimeout(() => {
            reconnectAttempts.current++
            connect()
          }, delay)
        }
      }

      ws.current.onerror = () => {

        setIsConnected(false)
        setConnectionStatus('error')
      }
    } catch (error) {
      console.error('❌ WebSocket creation failed:', error)
      setIsConnected(false)
      setConnectionStatus('error')
    }
  }

  useEffect(() => {
    connect()
    
    return () => {
      if (ws.current) {
        ws.current.close(1000, 'Component unmounting')
      }
    }
  }, [])

  return { 
    isConnected, 
    lastMessage, 
    connectionStatus,
    reconnect: connect 
  }
}