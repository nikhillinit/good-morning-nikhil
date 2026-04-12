import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useVideoBackground } from '@/hooks/useVideoBackground'

describe('useVideoBackground', () => {
  it('returns isVideoActive=false when no videoSrc provided', () => {
    const { result } = renderHook(() => useVideoBackground({ videoSrc: undefined, showUI: false }))
    expect(result.current.isVideoActive).toBe(false)
  })

  it('returns isVideoActive=false when prefers-reduced-motion', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true })
    const { result } = renderHook(() => useVideoBackground({ videoSrc: '/videos/test.mp4', showUI: false }))
    expect(result.current.isVideoActive).toBe(false)
  })

  it('returns videoRef as a ref object', () => {
    const { result } = renderHook(() => useVideoBackground({ videoSrc: '/videos/test.mp4', showUI: false }))
    expect(result.current.videoRef).toBeDefined()
    expect(result.current.videoRef.current).toBeNull()
  })
})
