import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMediaConsent } from '@/hooks/useMediaConsent'

beforeEach(() => {
  localStorage.clear()
})

describe('useMediaConsent', () => {
  it('starts with hasConsented=false on fresh session', () => {
    const { result } = renderHook(() => useMediaConsent())
    expect(result.current.hasConsented).toBe(false)
  })

  it('sets hasConsented=true after grantConsent', () => {
    const { result } = renderHook(() => useMediaConsent())
    act(() => result.current.grantConsent())
    expect(result.current.hasConsented).toBe(true)
  })

  it('persists consent to localStorage', () => {
    const { result } = renderHook(() => useMediaConsent())
    act(() => result.current.grantConsent())

    const { result: result2 } = renderHook(() => useMediaConsent())
    expect(result2.current.hasConsented).toBe(true)
  })
})
