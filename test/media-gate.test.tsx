import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, cleanup } from '@testing-library/react'
import { render, screen, fireEvent } from '@testing-library/react'
import { useMediaConsent } from '@/hooks/useMediaConsent'
import { MediaGate } from '@/components/MediaGate'
import { useAudioPlayer } from '@/hooks/useAudioPlayer'
import { MuteToggle } from '@/components/MuteToggle'

const { unlockAudioPlayback } = vi.hoisted(() => ({
  unlockAudioPlayback: vi.fn(() => Promise.resolve()),
}))

vi.mock('@/lib/audio-unlock', () => ({
  unlockAudioPlayback,
}))

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  cleanup()
  unlockAudioPlayback.mockClear()
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

describe('MediaGate', () => {
  it('renders the interstitial when hasConsented is false', () => {
    render(<MediaGate hasConsented={false} onConsent={() => {}} />)
    expect(screen.getByText(/this episode has sound/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start episode/i })).toBeInTheDocument()
  })

  it('calls onConsent when Start Episode is clicked', async () => {
    const onConsent = vi.fn()
    render(<MediaGate hasConsented={false} onConsent={onConsent} />)
    fireEvent.click(screen.getByRole('button', { name: /start episode/i }))

    await Promise.resolve()

    expect(onConsent).toHaveBeenCalledOnce()
  })

  it('unlocks audio playback before granting consent', async () => {
    const onConsent = vi.fn()
    render(<MediaGate hasConsented={false} onConsent={onConsent} />)
    fireEvent.click(screen.getByRole('button', { name: /start episode/i }))

    await Promise.resolve()

    expect(unlockAudioPlayback).toHaveBeenCalledOnce()
    expect(onConsent).toHaveBeenCalledOnce()
  })

  it('renders nothing when hasConsented is true', () => {
    const { container } = render(<MediaGate hasConsented={true} onConsent={() => {}} />)
    expect(container.firstChild).toBeNull()
  })
})

describe('useAudioPlayer mute', () => {
  it('starts unmuted', () => {
    const { result } = renderHook(() => useAudioPlayer())
    expect(result.current.isMuted).toBe(false)
  })

  it('toggles mute state', () => {
    const { result } = renderHook(() => useAudioPlayer())
    act(() => result.current.toggleMute())
    expect(result.current.isMuted).toBe(true)
    act(() => result.current.toggleMute())
    expect(result.current.isMuted).toBe(false)
  })
})

describe('MuteToggle', () => {
  it('shows unmuted icon when isMuted=false', () => {
    render(<MuteToggle isMuted={false} onToggle={() => {}} />)
    expect(screen.getByRole('button', { name: /mute/i })).toBeInTheDocument()
  })

  it('shows muted icon when isMuted=true', () => {
    render(<MuteToggle isMuted={true} onToggle={() => {}} />)
    expect(screen.getByRole('button', { name: /unmute/i })).toBeInTheDocument()
  })

  it('calls onToggle when clicked', () => {
    const onToggle = vi.fn()
    render(<MuteToggle isMuted={false} onToggle={onToggle} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onToggle).toHaveBeenCalledOnce()
  })
})
