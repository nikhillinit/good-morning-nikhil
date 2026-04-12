import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { render } from '@testing-library/react'
import { useVideoBackground } from '@/hooks/useVideoBackground'
import { VideoBackground } from '@/components/VideoBackground'

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

describe('VideoBackground', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false })
  })

  it('renders a video element when videoSrc is provided', () => {
    const { container } = render(
      <VideoBackground videoSrc="/videos/test.mp4" poster="/sets/test.webp" showUI={false} />
    )
    const video = container.querySelector('video')
    expect(video).not.toBeNull()
    expect(video?.getAttribute('poster')).toBe('/sets/test.webp')
  })

  it('renders nothing when videoSrc is undefined', () => {
    const { container } = render(
      <VideoBackground videoSrc={undefined} poster="/sets/test.webp" showUI={false} />
    )
    expect(container.querySelector('video')).toBeNull()
  })
})
