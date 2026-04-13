import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { getScreenPrompt } from '@/lib/screen-prompts'
import { QuestionPrompt } from '@/components/QuestionPrompt'

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

describe('QuestionPrompt', () => {
  it('renders the prompt text for a known screen', () => {
    render(<QuestionPrompt screenId="feud-top3" visible={true} />)
    expect(screen.getByText(/three adjectives/i)).toBeInTheDocument()
  })

  it('renders nothing when visible=false', () => {
    const { container } = render(<QuestionPrompt screenId="feud-top3" visible={false} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing for screens with no prompt', () => {
    const { container } = render(<QuestionPrompt screenId="cold-open" visible={true} />)
    expect(container.firstChild).toBeNull()
  })

  it('prefers an explicit prompt override when provided', () => {
    render(
      <QuestionPrompt
        screenId="survivor"
        prompt="Final words for the tribe."
        visible={true}
      />
    )

    expect(screen.getByText(/final words for the tribe/i)).toBeInTheDocument()
  })
})
