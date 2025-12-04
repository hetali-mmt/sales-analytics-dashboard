import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { debounce } from '@/lib/utils'
import { DEBOUNCE_DELAYS } from '@/lib/constants'

export function useUrlState<T extends Record<string, unknown>>(
  defaultState: T,
  debounceMs = DEBOUNCE_DELAYS.URL_STATE,
  enableUrlSync = false
) {
  const [searchParams, setSearchParams] = useSearchParams()

  const state = useMemo(() => {
    const result = { ...defaultState }
    
    for (const [key, defaultValue] of Object.entries(defaultState)) {
      const urlValue = searchParams.get(key)
      if (urlValue !== null) {
        if (typeof defaultValue === 'number') {
          const parsed = Number(urlValue)
          if (!isNaN(parsed)) {
            (result as Record<string, unknown>)[key] = parsed
          }
        } else if (typeof defaultValue === 'boolean') {
          (result as Record<string, unknown>)[key] = urlValue === 'true'
        } else {
          (result as Record<string, unknown>)[key] = urlValue
        }
      }
    }
    
    return result as T
  }, [searchParams, defaultState])

  const debouncedSetSearchParams = useMemo(
    () => debounce((...args: unknown[]) => {
      const params = args[0] as URLSearchParams
      setSearchParams(params, { replace: true })
    }, debounceMs),
    [setSearchParams, debounceMs]
  )

  const updateState = useCallback((updates: Partial<T>) => {
    if (!enableUrlSync) return
    
    const newParams = new URLSearchParams(searchParams)
    
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined || value === null || value === '' || 
          (typeof value === 'string' && value.trim() === '')) {
        newParams.delete(key)
      } else {
        newParams.set(key, String(value))
      }
    }
    
    debouncedSetSearchParams(newParams)
  }, [searchParams, debouncedSetSearchParams, enableUrlSync])

  return [state, updateState] as const
}