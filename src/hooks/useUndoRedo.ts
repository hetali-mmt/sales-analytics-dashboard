import { useCallback, useState } from 'react'

interface HistoryState<T> {
  past: T[]
  present: T
  future: T[]
}

import { HISTORY_LIMITS } from '@/lib/constants'

export function useUndoRedo<T>(initialState: T, maxHistorySize = HISTORY_LIMITS.UNDO_REDO) {
  const [state, setState] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
  })

  const canUndo = state.past.length > 0
  const canRedo = state.future.length > 0

  const undo = useCallback(() => {
    if (!canUndo) return

    setState(currentState => {
      const previous = currentState.past[currentState.past.length - 1]
      const newPast = currentState.past.slice(0, currentState.past.length - 1)

      return {
        past: newPast,
        present: previous,
        future: [currentState.present, ...currentState.future],
      }
    })
  }, [canUndo])

  const redo = useCallback(() => {
    if (!canRedo) return

    setState(currentState => {
      const next = currentState.future[0]
      const newFuture = currentState.future.slice(1)

      return {
        past: [...currentState.past, currentState.present],
        present: next,
        future: newFuture,
      }
    })
  }, [canRedo])

  const set = useCallback((newState: T) => {
    setState(currentState => ({
      past: [...currentState.past, currentState.present].slice(-maxHistorySize),
      present: newState,
      future: [],
    }))
  }, [maxHistorySize])

  const reset = useCallback((newState: T) => {
    setState({
      past: [],
      present: newState,
      future: [],
    })
  }, [])

  // Keyboard shortcuts
  useCallback(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'z') {
        event.preventDefault()
        if (event.shiftKey) {
          redo()
        } else {
          undo()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  return {
    state: state.present,
    canUndo,
    canRedo,
    undo,
    redo,
    set,
    reset,
  }
}