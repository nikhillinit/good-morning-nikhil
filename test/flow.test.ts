import { describe, it, expect } from 'vitest'
import {
  buildHistoryToScreen,
  getCompletionStatusForValue,
  getNextScreen,
  getPrevScreen,
  getScreenIndex,
  getResumeState,
  getTotalScreens,
  getCompletionStatusForScreen,
  isScreenComplete,
  getResumeScreen,
} from '@/lib/flow'
import { ScreenStatus } from '@/types'
import type { Screen } from '@/data/screens'
import type { ScreenProgress } from '@/types'

const mockScreens: Screen[] = [
  { id: 'intro', show: 'Intro', showEmoji: '', audio: '', bg: '', captions: [], ui: 'start-button' },
  { id: 'q1', show: 'Q1', showEmoji: '', audio: '', bg: '', captions: [], ui: 'short-text' },
  { id: 'q2', show: 'Q2', showEmoji: '', audio: '', bg: '', captions: [], ui: 'text-area' },
  { id: 'end', show: 'End', showEmoji: '', audio: '', bg: '', captions: [], ui: 'submit-button' },
]

describe('getNextScreen', () => {
  it('returns the next screen id', () => {
    expect(getNextScreen('intro', mockScreens)).toBe('q1')
  })

  it('returns null at the last screen', () => {
    expect(getNextScreen('end', mockScreens)).toBeNull()
  })

  it('returns null for unknown screen', () => {
    expect(getNextScreen('nonexistent', mockScreens)).toBeNull()
  })
})

describe('getPrevScreen', () => {
  it('returns previous screen from history', () => {
    expect(getPrevScreen('q2', ['intro', 'q1', 'q2'])).toBe('q1')
  })

  it('returns null at the first history entry', () => {
    expect(getPrevScreen('intro', ['intro', 'q1'])).toBeNull()
  })

  it('returns null for empty history', () => {
    expect(getPrevScreen('intro', [])).toBeNull()
  })
})

describe('getScreenIndex', () => {
  it('returns correct index', () => {
    expect(getScreenIndex('q2', mockScreens)).toBe(2)
  })

  it('returns -1 for unknown screen', () => {
    expect(getScreenIndex('nonexistent', mockScreens)).toBe(-1)
  })
})

describe('getTotalScreens', () => {
  it('returns the number of screens', () => {
    expect(getTotalScreens(mockScreens)).toBe(4)
  })
})

describe('getCompletionStatusForScreen', () => {
  it('returns VIEWED for view-only screens like start-button', () => {
    expect(getCompletionStatusForScreen(mockScreens[0])).toBe(ScreenStatus.VIEWED)
  })

  it('returns ANSWERED for input screens like short-text', () => {
    expect(getCompletionStatusForScreen(mockScreens[1])).toBe(ScreenStatus.ANSWERED)
  })
})

describe('getCompletionStatusForValue', () => {
  it('marks skipped answer screens as SKIPPED', () => {
    expect(getCompletionStatusForValue(mockScreens[1], null)).toBe(ScreenStatus.SKIPPED)
  })

  it('marks answered screens as ANSWERED when they have a value', () => {
    expect(getCompletionStatusForValue(mockScreens[1], 'typed')).toBe(ScreenStatus.ANSWERED)
  })
})

describe('isScreenComplete', () => {
  it('view-only screen is complete when VIEWED', () => {
    expect(isScreenComplete(mockScreens[0], ScreenStatus.VIEWED)).toBe(true)
  })

  it('view-only screen is incomplete when NOT_STARTED', () => {
    expect(isScreenComplete(mockScreens[0], ScreenStatus.NOT_STARTED)).toBe(false)
  })

  it('input screen is complete when ANSWERED', () => {
    expect(isScreenComplete(mockScreens[1], ScreenStatus.ANSWERED)).toBe(true)
  })

  it('input screen is complete when SKIPPED', () => {
    expect(isScreenComplete(mockScreens[1], ScreenStatus.SKIPPED)).toBe(true)
  })

  it('input screen is incomplete when only VIEWED', () => {
    expect(isScreenComplete(mockScreens[1], ScreenStatus.VIEWED)).toBe(false)
  })
})

describe('getResumeScreen', () => {
  it('returns first screen when no progress', () => {
    expect(getResumeScreen([], mockScreens)).toBe('intro')
  })

  it('returns first incomplete screen', () => {
    const progress: ScreenProgress[] = [
      { id: '1', session_id: 's', screen_key: 'intro', screen_order: 0, status: ScreenStatus.VIEWED, entered_at: '', answered_at: null, time_spent_ms: 0, used_audio_on_screen: false, used_captions_on_screen: false },
      { id: '2', session_id: 's', screen_key: 'q1', screen_order: 1, status: ScreenStatus.ANSWERED, entered_at: '', answered_at: null, time_spent_ms: 0, used_audio_on_screen: false, used_captions_on_screen: false },
    ]
    expect(getResumeScreen(progress, mockScreens)).toBe('q2')
  })

  it('returns null when all screens complete', () => {
    const progress: ScreenProgress[] = [
      { id: '1', session_id: 's', screen_key: 'intro', screen_order: 0, status: ScreenStatus.VIEWED, entered_at: '', answered_at: null, time_spent_ms: 0, used_audio_on_screen: false, used_captions_on_screen: false },
      { id: '2', session_id: 's', screen_key: 'q1', screen_order: 1, status: ScreenStatus.ANSWERED, entered_at: '', answered_at: null, time_spent_ms: 0, used_audio_on_screen: false, used_captions_on_screen: false },
      { id: '3', session_id: 's', screen_key: 'q2', screen_order: 2, status: ScreenStatus.ANSWERED, entered_at: '', answered_at: null, time_spent_ms: 0, used_audio_on_screen: false, used_captions_on_screen: false },
      { id: '4', session_id: 's', screen_key: 'end', screen_order: 3, status: ScreenStatus.VIEWED, entered_at: '', answered_at: null, time_spent_ms: 0, used_audio_on_screen: false, used_captions_on_screen: false },
    ]
    expect(getResumeScreen(progress, mockScreens)).toBeNull()
  })
})

describe('buildHistoryToScreen', () => {
  it('rebuilds linear navigation history up to the current screen', () => {
    expect(buildHistoryToScreen('q2', mockScreens)).toEqual(['intro', 'q1', 'q2'])
  })
})

describe('getResumeState', () => {
  it('returns review state when all screens are complete', () => {
    const progress: ScreenProgress[] = [
      { id: '1', session_id: 's', screen_key: 'intro', screen_order: 0, status: ScreenStatus.VIEWED, entered_at: '', answered_at: null, time_spent_ms: 0, used_audio_on_screen: false, used_captions_on_screen: false },
      { id: '2', session_id: 's', screen_key: 'q1', screen_order: 1, status: ScreenStatus.ANSWERED, entered_at: '', answered_at: null, time_spent_ms: 0, used_audio_on_screen: false, used_captions_on_screen: false },
      { id: '3', session_id: 's', screen_key: 'q2', screen_order: 2, status: ScreenStatus.ANSWERED, entered_at: '', answered_at: null, time_spent_ms: 0, used_audio_on_screen: false, used_captions_on_screen: false },
      { id: '4', session_id: 's', screen_key: 'end', screen_order: 3, status: ScreenStatus.VIEWED, entered_at: '', answered_at: null, time_spent_ms: 0, used_audio_on_screen: false, used_captions_on_screen: false },
    ]

    expect(getResumeState(progress, mockScreens)).toEqual({
      currentScreenId: 'end',
      history: ['intro', 'q1', 'q2', 'end'],
      showReview: true,
    })
  })
})
