import { useState, useCallback } from 'react'

export function useLocalState<T extends Record<string, unknown>>(
  defaultState: T
) {
  const [state, setState] = useState<T>(defaultState)

  const updateState = useCallback((updates: Partial<T>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  return [state, updateState] as const
}