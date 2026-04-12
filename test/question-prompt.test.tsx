import { describe, it, expect } from 'vitest'
import { getScreenPrompt } from '@/lib/screen-prompts'

describe('getScreenPrompt', () => {
  it('returns prompt text for feud-top3', () => {
    expect(getScreenPrompt('feud-top3')).toBe(
      'Give me three adjectives or short phrases that describe Nikhil.'
    )
  })

  it('returns prompt text for survivor', () => {
    expect(getScreenPrompt('survivor')).toBe(
      "What's one thing people should know about being on a team with Nikhil?"
    )
  })

  it('returns prompt text for maury', () => {
    expect(getScreenPrompt('maury')).toContain('projects that he is')
  })

  it('returns null for screens with no question (cold-open)', () => {
    expect(getScreenPrompt('cold-open')).toBeNull()
  })

  it('returns null for screens with no question (welcome)', () => {
    expect(getScreenPrompt('welcome')).toBeNull()
  })

  it('returns null for screens with no question (credits)', () => {
    expect(getScreenPrompt('credits')).toBeNull()
  })
})
