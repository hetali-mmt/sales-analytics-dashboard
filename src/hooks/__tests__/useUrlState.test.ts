import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useUrlState } from '../useUrlState'

// Mock useSearchParams
const mockSetSearchParams = vi.fn()
vi.mock('react-router-dom', () => ({
  useSearchParams: () => [new URLSearchParams(), mockSetSearchParams]
}))

describe('useUrlState Hook', () => {
  it('initializes with default state', () => {
    const { result } = renderHook(() => 
      useUrlState({ search: '', page: 1 })
    )
    
    expect(result.current[0]).toEqual({ search: '', page: 1 })
  })

  it('updates state', () => {
    const { result } = renderHook(() => 
      useUrlState({ search: '', page: 1 }, 300)
    )
    
    act(() => {
      result.current[1]({ search: 'test' })
    })
    
    expect(result.current[0]).toEqual({ search: 'test', page: 1 })
  })
})