import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
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

  it('handles behavior=pause by issuing pause on showUI', () => {
    // We cannot fully test the useEffect interacting with videoRef simply from render without mock ref injection,
    // but we can ensure behavior string is accepted without errors and the component mounts correctly.
    // In our actual implementation, the hook tests that. Let's test the hook's interaction with the ref mock.
    const { container } = render(
      <VideoBackground videoSrc="/videos/test.mp4" poster="/sets/test.webp" showUI={true} behavior="pause" />
    )
    expect(container.querySelector('video')).not.toBeNull()
  })

  it('applies mediaPosition correctly via style objectPosition', () => {
    const { container } = render(
      <VideoBackground videoSrc="/videos/test.mp4" poster="/sets/test.webp" showUI={false} mediaPosition="center 10%" />
    )
    const video = container.querySelector('video')
    expect(video?.style.objectPosition).toBe('center 10%')
  })

  it('renders nothing when videoSrc is undefined', () => {
    const { container } = render(
      <VideoBackground videoSrc={undefined} poster="/sets/test.webp" showUI={false} />
    )
    expect(container.querySelector('video')).toBeNull()
  })
})

describe('useVideoBackground hook behaviors', () => {
  it('calls pause on video element when behavior=pause and showUI=true', async () => {
    const mockPause = vi.fn()
    const mockPlay = vi.fn().mockResolvedValue(undefined)
    const mockLoad = vi.fn()
    
    const mockVideoElement = { 
        pause: mockPause, 
        play: mockPlay, 
        load: mockLoad, 
        removeAttribute: vi.fn(),
        loop: false 
    } as unknown as HTMLVideoElement

    const { result, rerender } = renderHook((props: {showUI: boolean, behavior?: "loop" | "pause"}) => {
      const hookResult = useVideoBackground({ videoSrc: '/test.mp4', showUI: props.showUI, behavior: props.behavior });
      if (!hookResult.videoRef.current) {
        hookResult.videoRef.current = mockVideoElement;
      }
      return hookResult;
    }, { initialProps: { showUI: false, behavior: 'pause' } })
    
    // We need to wait for the internal playPromise to resolve and isVideoActive to become true
    await waitFor(() => {
      expect(result.current.isVideoActive).toBe(true)
    })
    
    rerender({ showUI: true, behavior: 'pause' })
    expect(mockPause).toHaveBeenCalledTimes(1)
  })

  it('does NOT call pause on video element when behavior=loop and showUI=true', async () => {
    const mockPause = vi.fn()
    const mockPlay = vi.fn().mockResolvedValue(undefined)
    const mockLoad = vi.fn()

    const mockVideoElement = { 
        pause: mockPause, 
        play: mockPlay, 
        load: mockLoad, 
        removeAttribute: vi.fn(),
        loop: false 
    } as unknown as HTMLVideoElement
    
    const { result, rerender } = renderHook((props: {showUI: boolean, behavior?: "loop" | "pause"}) => {
      const hookResult = useVideoBackground({ videoSrc: '/test.mp4', showUI: props.showUI, behavior: props.behavior });
      if (!hookResult.videoRef.current) {
        hookResult.videoRef.current = mockVideoElement;
      }
      return hookResult;
    }, { initialProps: { showUI: false, behavior: 'loop' } })
    
    await waitFor(() => {
      expect(result.current.isVideoActive).toBe(true)
    })
    
    rerender({ showUI: true, behavior: 'loop' })
    expect(mockPause).not.toHaveBeenCalled()
  })
})
