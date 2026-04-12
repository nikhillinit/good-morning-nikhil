# AI Video Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add AI-generated video backgrounds to 9 survey screens as progressive enhancement, with prerequisite UX fixes for media consent and persistent question prompts.

**Architecture:** Phase 0 adds a media consent interstitial and mute toggle so audio never auto-plays. Phase 1 adds persistent question prompts above every input. Phase 2 adds an optional `video` field to the Screen type and a video background layer in ScreenPlayer with autoplay-failure fallback. Phases 3-4 are asset generation via `infsh` CLI. Phase 5 is mobile validation.

**Tech Stack:** Next.js 16, React 19, Framer Motion, Howler.js, Vitest, inference.sh CLI

---

## File Structure

### New files
- `src/components/MediaGate.tsx` — "This episode has sound" interstitial, renders once before first audio play
- `src/components/MuteToggle.tsx` — persistent mute button visible on all screens
- `src/components/QuestionPrompt.tsx` — renders the screen's question text above the UI input
- `src/components/VideoBackground.tsx` — `<video>` element with autoplay fallback, pause-on-input, preload logic
- `src/hooks/useMediaConsent.ts` — tracks whether user has tapped "Start Episode", persists to localStorage
- `src/hooks/useVideoBackground.ts` — manages video element ref, autoplay attempt, fallback state
- `src/lib/screen-prompts.ts` — maps screen IDs to their visible question text (extracted from captions/config)
- `test/media-gate.test.tsx` — MediaGate + useMediaConsent tests
- `test/question-prompt.test.tsx` — QuestionPrompt + screen-prompts tests
- `test/video-background.test.tsx` — VideoBackground + useVideoBackground tests
- `scripts/generate-videos.sh` — infsh CLI batch generation script (prompt bible)

### Modified files
- `src/data/screens.ts` — add `video?: string` and `prompt?: string` to Screen interface
- `src/components/ScreenPlayer.tsx` — integrate MediaGate check, QuestionPrompt, VideoBackground, conditional overlay opacity
- `src/hooks/useAudioPlayer.ts` — add `mute`/`unmute`/`isMuted` to the hook return
- `src/app/page.tsx` — wire useMediaConsent into SurveyFlow, pass mute state down
- `test/flow.test.ts` — update mockScreens to include optional `video` and `prompt` fields

---

## Task 1: useMediaConsent hook

**Files:**
- Create: `src/hooks/useMediaConsent.ts`
- Test: `test/media-gate.test.tsx`

- [ ] **Step 1: Write the failing test for useMediaConsent**

```tsx
// test/media-gate.test.tsx
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/media-gate.test.tsx`
Expected: FAIL — module `@/hooks/useMediaConsent` not found

- [ ] **Step 3: Implement useMediaConsent**

```ts
// src/hooks/useMediaConsent.ts
"use client";

import { useCallback, useState } from "react";

const LS_KEY = "gmn-media-consent";

function readConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(LS_KEY) === "1";
  } catch {
    return false;
  }
}

export function useMediaConsent() {
  const [hasConsented, setHasConsented] = useState(readConsent);

  const grantConsent = useCallback(() => {
    setHasConsented(true);
    try {
      localStorage.setItem(LS_KEY, "1");
    } catch {
      // Silently fail in private browsing
    }
  }, []);

  return { hasConsented, grantConsent };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/media-gate.test.tsx`
Expected: 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useMediaConsent.ts test/media-gate.test.tsx
git commit -m "feat: add useMediaConsent hook for audio consent gate"
```

---

## Task 2: MediaGate component

**Files:**
- Create: `src/components/MediaGate.tsx`
- Modify: `test/media-gate.test.tsx`

- [ ] **Step 1: Write the failing test for MediaGate**

Add to `test/media-gate.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { MediaGate } from '@/components/MediaGate'

describe('MediaGate', () => {
  it('renders the interstitial when hasConsented is false', () => {
    render(<MediaGate hasConsented={false} onConsent={() => {}} />)
    expect(screen.getByText(/this episode has sound/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start episode/i })).toBeInTheDocument()
  })

  it('calls onConsent when Start Episode is clicked', () => {
    const onConsent = vi.fn()
    render(<MediaGate hasConsented={false} onConsent={onConsent} />)
    fireEvent.click(screen.getByRole('button', { name: /start episode/i }))
    expect(onConsent).toHaveBeenCalledOnce()
  })

  it('renders nothing when hasConsented is true', () => {
    const { container } = render(<MediaGate hasConsented={true} onConsent={() => {}} />)
    expect(container.firstChild).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/media-gate.test.tsx`
Expected: FAIL — module `@/components/MediaGate` not found

- [ ] **Step 3: Implement MediaGate**

```tsx
// src/components/MediaGate.tsx
"use client";

import { motion } from "framer-motion";

interface MediaGateProps {
  hasConsented: boolean;
  onConsent: () => void;
}

export function MediaGate({ hasConsented, onConsent }: MediaGateProps) {
  if (hasConsented) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <h1 className="font-display text-3xl text-yellow-500">
          Good Morning, Nikhil
        </h1>
        <p className="max-w-sm text-sm text-zinc-400">
          This episode has sound. Put your headphones in or turn your volume up.
        </p>
        <button
          onClick={onConsent}
          className="font-display rounded-lg bg-yellow-500 px-10 py-5 text-2xl text-black hover:bg-yellow-400 glow-accent"
          aria-label="Start Episode"
        >
          Start Episode
        </button>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/media-gate.test.tsx`
Expected: 6 tests PASS (3 hook + 3 component)

- [ ] **Step 5: Commit**

```bash
git add src/components/MediaGate.tsx test/media-gate.test.tsx
git commit -m "feat: add MediaGate interstitial component"
```

---

## Task 3: Add mute/unmute to useAudioPlayer

**Files:**
- Modify: `src/hooks/useAudioPlayer.ts`
- Test: `test/media-gate.test.tsx` (add mute tests)

- [ ] **Step 1: Write the failing test for mute behavior**

Add to `test/media-gate.test.tsx`:

```tsx
import { useAudioPlayer } from '@/hooks/useAudioPlayer'

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/media-gate.test.tsx`
Expected: FAIL — `toggleMute` / `isMuted` not found on hook return

- [ ] **Step 3: Add mute state to useAudioPlayer**

In `src/hooks/useAudioPlayer.ts`, add a `muted` ref and `toggleMute` callback. The `muted` state controls `Howl` volume:

```ts
// Add to existing imports — no new imports needed

// Inside useAudioPlayer(), add after existing refs:
const mutedRef = useRef(false);
const [isMuted, setIsMuted] = useState(false);

// Add toggleMute callback:
const toggleMute = useCallback(() => {
  mutedRef.current = !mutedRef.current;
  setIsMuted(mutedRef.current);
  if (howlRef.current) {
    howlRef.current.mute(mutedRef.current);
  }
}, []);

// In the play callback, after `howl.play()`, add:
howl.mute(mutedRef.current);

// Update return:
return { play, skip, stop, isPlaying, hasEnded, getCurrentTime, isMuted, toggleMute };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/media-gate.test.tsx`
Expected: 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useAudioPlayer.ts test/media-gate.test.tsx
git commit -m "feat: add mute toggle to useAudioPlayer"
```

---

## Task 4: MuteToggle component

**Files:**
- Create: `src/components/MuteToggle.tsx`
- Modify: `test/media-gate.test.tsx`

- [ ] **Step 1: Write the failing test**

Add to `test/media-gate.test.tsx`:

```tsx
import { MuteToggle } from '@/components/MuteToggle'

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/media-gate.test.tsx`
Expected: FAIL — module `@/components/MuteToggle` not found

- [ ] **Step 3: Implement MuteToggle**

```tsx
// src/components/MuteToggle.tsx
"use client";

interface MuteToggleProps {
  isMuted: boolean;
  onToggle: () => void;
}

export function MuteToggle({ isMuted, onToggle }: MuteToggleProps) {
  return (
    <button
      onClick={onToggle}
      aria-label={isMuted ? "Unmute audio" : "Mute audio"}
      className="fixed right-4 top-4 safe-top z-30 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white/70 backdrop-blur-sm hover:bg-black/80"
    >
      {isMuted ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
        </svg>
      )}
    </button>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/media-gate.test.tsx`
Expected: 11 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/MuteToggle.tsx test/media-gate.test.tsx
git commit -m "feat: add MuteToggle component"
```

---

## Task 5: Wire MediaGate and MuteToggle into SurveyFlow

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/ScreenPlayer.tsx`

- [ ] **Step 1: Add useMediaConsent to SurveyFlow in page.tsx**

In `src/app/page.tsx`, add imports at the top:

```tsx
import { useMediaConsent } from "@/hooks/useMediaConsent";
import { MediaGate } from "@/components/MediaGate";
import { MuteToggle } from "@/components/MuteToggle";
```

Inside `SurveyFlow()`, after the existing state declarations (around line 59), add:

```tsx
const { hasConsented, grantConsent } = useMediaConsent();
```

- [ ] **Step 2: Render MediaGate before the main survey UI**

In the return statement of `SurveyFlow`, add the MediaGate check **before** the bootstrap error check (before line 293). Wrap the existing return in a fragment and add at the top:

```tsx
if (!hasConsented) {
  return <MediaGate hasConsented={false} onConsent={grantConsent} />;
}
```

- [ ] **Step 3: Pass consent and mute state to ScreenPlayer**

Update the `ScreenPlayer` component call to pass `hasConsented`:

```tsx
<ScreenPlayer
  screen={currentScreen}
  initialValue={getResponse(currentScreen.id)}
  onComplete={handleComplete}
  onBack={history.length > 1 ? handleBack : undefined}
/>
```

No prop changes needed yet — ScreenPlayer already calls `useAudioPlayer` internally. The consent gate ensures audio only plays after user interaction.

- [ ] **Step 4: Remove auto-play on mount from ScreenPlayer**

In `src/components/ScreenPlayer.tsx`, modify the audio play effect (lines 53-58). The current code auto-plays after 300ms. Change it to only play if the page has been interacted with (which is guaranteed by MediaGate):

```tsx
useEffect(() => {
  const timer = setTimeout(() => {
    play(screen.audio);
  }, 300);
  return () => clearTimeout(timer);
}, [screen.id, screen.audio, play]);
```

This stays as-is — MediaGate ensures user has already interacted before this component mounts, so the browser autoplay policy is satisfied.

- [ ] **Step 5: Add MuteToggle to ScreenPlayer**

In `src/components/ScreenPlayer.tsx`, import MuteToggle and expose mute state from useAudioPlayer:

```tsx
import { MuteToggle } from "./MuteToggle";
```

Update the destructured hook return:

```tsx
const { play, skip, isPlaying, hasEnded, getCurrentTime, isMuted, toggleMute } = useAudioPlayer();
```

Add MuteToggle inside the `<motion.section>`, after the dark overlay div:

```tsx
<MuteToggle isMuted={isMuted} onToggle={toggleMute} />
```

- [ ] **Step 6: Run full test suite**

Run: `npx vitest run`
Expected: All existing tests pass. MediaGate tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/app/page.tsx src/components/ScreenPlayer.tsx
git commit -m "feat: wire MediaGate consent and MuteToggle into survey flow"
```

---

## Task 6: screen-prompts mapping

**Files:**
- Create: `src/lib/screen-prompts.ts`
- Test: `test/question-prompt.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// test/question-prompt.test.tsx
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/question-prompt.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Implement screen-prompts**

```ts
// src/lib/screen-prompts.ts

// Maps screen IDs to their visible question text.
// Extracted from captions and uiConfig so the question
// stays on screen after audio ends.
const SCREEN_PROMPTS: Record<string, string> = {
  "relationship": "How do you know Nikhil?",
  "feud-top3": "Give me three adjectives or short phrases that describe Nikhil.",
  "feud-strongest": "Which of your 3 answers feels most true, and why?",
  "feud-trademark": "Name a thing he does so often it should come with theme music.",
  "sponsor-brand": "What company, product, vibe, aesthetic, or brand sponsors Nikhil?",
  "sponsor-why": "Why does that feel on-brand?",
  "bachelor-roses": "Give 3 roses to Nikhil's strongest qualities.",
  "bachelor-eliminate": "Which quality should go home?",
  "bachelor-limo": "Complete: \"I never stood a chance because Nikhil always...\"",
  "shark-invest": "Would you invest in Nikhil?",
  "shark-reason": "Why are you in or out?",
  "survivor": "What's one thing people should know about being on a team with Nikhil?",
  "maury": "Nikhil projects that he is... but he actually comes across as...",
  "producer-notes": "What should Nikhil do more of, less of, or more consistently?",
};

export function getScreenPrompt(screenId: string): string | null {
  return SCREEN_PROMPTS[screenId] ?? null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/question-prompt.test.tsx`
Expected: 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/screen-prompts.ts test/question-prompt.test.tsx
git commit -m "feat: add screen-prompts mapping for persistent question text"
```

---

## Task 7: QuestionPrompt component

**Files:**
- Create: `src/components/QuestionPrompt.tsx`
- Modify: `test/question-prompt.test.tsx`

- [ ] **Step 1: Write the failing test**

Add to `test/question-prompt.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { QuestionPrompt } from '@/components/QuestionPrompt'

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
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/question-prompt.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Implement QuestionPrompt**

```tsx
// src/components/QuestionPrompt.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { getScreenPrompt } from "@/lib/screen-prompts";

interface QuestionPromptProps {
  screenId: string;
  visible: boolean;
}

export function QuestionPrompt({ screenId, visible }: QuestionPromptProps) {
  const prompt = getScreenPrompt(screenId);

  if (!visible || !prompt) return null;

  return (
    <AnimatePresence>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-4 max-w-md px-2 text-center text-sm italic text-zinc-400"
      >
        &ldquo;{prompt}&rdquo;
      </motion.p>
    </AnimatePresence>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/question-prompt.test.tsx`
Expected: 9 tests PASS (6 mapping + 3 component)

- [ ] **Step 5: Commit**

```bash
git add src/components/QuestionPrompt.tsx test/question-prompt.test.tsx
git commit -m "feat: add QuestionPrompt component for persistent question text"
```

---

## Task 8: Wire QuestionPrompt into ScreenPlayer

**Files:**
- Modify: `src/components/ScreenPlayer.tsx`

- [ ] **Step 1: Import QuestionPrompt**

In `src/components/ScreenPlayer.tsx`, add import:

```tsx
import { QuestionPrompt } from "./QuestionPrompt";
```

- [ ] **Step 2: Add QuestionPrompt above the UIInput**

Inside the `AnimatePresence` block that renders `showUI` (around line 102), add `QuestionPrompt` before `UIInput`:

```tsx
<AnimatePresence>
  {showUI && (
    <motion.div
      {...uiReveal}
      className="flex w-full flex-col items-center"
    >
      <QuestionPrompt screenId={screen.id} visible={true} />
      <UIInput
        key={`${screen.id}:${JSON.stringify(initialValue ?? null)}`}
        type={screen.ui}
        config={screen.uiConfig}
        initialValue={initialValue}
        onSubmit={onComplete}
      />
    </motion.div>
  )}
</AnimatePresence>
```

- [ ] **Step 3: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add src/components/ScreenPlayer.tsx
git commit -m "feat: show persistent question prompt above UI inputs"
```

---

## Task 9: Add `video` field to Screen type

**Files:**
- Modify: `src/data/screens.ts`
- Modify: `test/flow.test.ts`

- [ ] **Step 1: Add video field to Screen interface**

In `src/data/screens.ts`, add to the `Screen` interface after the `uiRevealAt` field:

```ts
video?: string; // path to video in /public/videos/
```

- [ ] **Step 2: Update mockScreens in flow.test.ts**

The existing `mockScreens` in `test/flow.test.ts` omit optional fields. The `video` field is optional so no changes are needed — TypeScript won't complain. Verify by running:

Run: `npx vitest run test/flow.test.ts`
Expected: All tests pass (no type errors)

- [ ] **Step 3: Commit**

```bash
git add src/data/screens.ts
git commit -m "feat: add optional video field to Screen interface"
```

---

## Task 10: useVideoBackground hook

**Files:**
- Create: `src/hooks/useVideoBackground.ts`
- Test: `test/video-background.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// test/video-background.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/video-background.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Implement useVideoBackground**

```ts
// src/hooks/useVideoBackground.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseVideoBackgroundOptions {
  videoSrc: string | undefined;
  showUI: boolean;
}

export function useVideoBackground({ videoSrc, showUI }: UseVideoBackgroundOptions) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isVideoActive, setIsVideoActive] = useState(false);

  // Check prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Attempt autoplay when video src is available
  useEffect(() => {
    if (!videoSrc || prefersReducedMotion || !videoRef.current) return;

    const video = videoRef.current;
    video.src = videoSrc;
    video.load();

    video.play().then(() => {
      setIsVideoActive(true);
    }).catch(() => {
      // Autoplay blocked — fall back to still
      setIsVideoActive(false);
    });

    return () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
      setIsVideoActive(false);
    };
  }, [videoSrc, prefersReducedMotion]);

  // Pause video when UI input appears
  useEffect(() => {
    if (!videoRef.current || !isVideoActive) return;

    if (showUI) {
      videoRef.current.pause();
    }
  }, [showUI, isVideoActive]);

  // Check saveData
  const shouldSkip =
    !videoSrc ||
    prefersReducedMotion ||
    (typeof navigator !== "undefined" &&
      "connection" in navigator &&
      (navigator as { connection?: { saveData?: boolean } }).connection?.saveData === true);

  return {
    videoRef,
    isVideoActive: isVideoActive && !shouldSkip,
    shouldSkip,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/video-background.test.tsx`
Expected: 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useVideoBackground.ts test/video-background.test.tsx
git commit -m "feat: add useVideoBackground hook with autoplay fallback"
```

---

## Task 11: VideoBackground component

**Files:**
- Create: `src/components/VideoBackground.tsx`
- Modify: `test/video-background.test.tsx`

- [ ] **Step 1: Write the failing test**

Add to `test/video-background.test.tsx`:

```tsx
import { render } from '@testing-library/react'
import { VideoBackground } from '@/components/VideoBackground'

describe('VideoBackground', () => {
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/video-background.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Implement VideoBackground**

```tsx
// src/components/VideoBackground.tsx
"use client";

import { useVideoBackground } from "@/hooks/useVideoBackground";

interface VideoBackgroundProps {
  videoSrc: string | undefined;
  poster: string;
  showUI: boolean;
}

export function VideoBackground({ videoSrc, poster, showUI }: VideoBackgroundProps) {
  const { videoRef, shouldSkip } = useVideoBackground({ videoSrc, showUI });

  if (!videoSrc || shouldSkip) return null;

  return (
    <video
      ref={videoRef}
      muted
      autoPlay
      playsInline
      poster={poster}
      preload="metadata"
      className="absolute inset-0 h-full w-full object-cover"
      aria-hidden="true"
    />
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/video-background.test.tsx`
Expected: 5 tests PASS (3 hook + 2 component)

- [ ] **Step 5: Commit**

```bash
git add src/components/VideoBackground.tsx test/video-background.test.tsx
git commit -m "feat: add VideoBackground component with poster fallback"
```

---

## Task 12: Integrate VideoBackground into ScreenPlayer

**Files:**
- Modify: `src/components/ScreenPlayer.tsx`

- [ ] **Step 1: Import VideoBackground**

```tsx
import { VideoBackground } from "./VideoBackground";
```

- [ ] **Step 2: Add VideoBackground and conditional overlay**

In `ScreenPlayer`, add the video layer inside `<motion.section>` right before the ambient layers (before `<PaperShimmer />`):

```tsx
{/* Video background — progressive enhancement */}
<VideoBackground videoSrc={screen.video} poster={screen.bg} showUI={showUI} />
```

- [ ] **Step 3: Make overlay opacity conditional on video presence**

Change the dark overlay div from:

```tsx
<div className="absolute inset-0 bg-black/50" />
```

To:

```tsx
<div className={`absolute inset-0 ${screen.video ? "bg-black/60" : "bg-black/50"}`} />
```

- [ ] **Step 4: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add src/components/ScreenPlayer.tsx
git commit -m "feat: integrate video backgrounds into ScreenPlayer with conditional overlay"
```

---

## Task 13: Video preloading

**Files:**
- Modify: `src/components/ScreenPlayer.tsx`

- [ ] **Step 1: Add next-screen video preload**

In `ScreenPlayer`, add a prop for the next screen's video URL. In `src/components/ScreenPlayer.tsx`, update the interface:

```tsx
interface ScreenPlayerProps {
  screen: Screen;
  nextScreenVideo?: string; // video URL for next screen, for preloading
  initialValue?: unknown;
  onComplete: (value: unknown) => void;
  onBack?: () => void;
}
```

- [ ] **Step 2: Add preload link**

Inside the component, after the imports, add the preload effect:

```tsx
useEffect(() => {
  if (!nextScreenVideo) return;

  // Skip preload on saveData
  if (
    typeof navigator !== "undefined" &&
    "connection" in navigator &&
    (navigator as { connection?: { saveData?: boolean } }).connection?.saveData
  ) {
    return;
  }

  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "video";
  link.type = "video/mp4";
  link.href = nextScreenVideo;
  document.head.appendChild(link);

  return () => {
    document.head.removeChild(link);
  };
}, [nextScreenVideo]);
```

- [ ] **Step 3: Pass nextScreenVideo from page.tsx**

In `src/app/page.tsx`, compute the next screen's video and pass it:

```tsx
const nextScreen = screens[activeIndex + 1];
const nextScreenVideo = nextScreen?.video;
```

Pass to ScreenPlayer:

```tsx
<ScreenPlayer
  screen={currentScreen}
  nextScreenVideo={nextScreenVideo}
  initialValue={getResponse(currentScreen.id)}
  onComplete={handleComplete}
  onBack={history.length > 1 ? handleBack : undefined}
/>
```

- [ ] **Step 4: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add src/components/ScreenPlayer.tsx src/app/page.tsx
git commit -m "feat: add connection-aware video preloading for next screen"
```

---

## Task 14: Generation script (prompt bible)

**Files:**
- Create: `scripts/generate-videos.sh`

- [ ] **Step 1: Create the generation script**

```bash
#!/usr/bin/env bash
# generate-videos.sh — AI video generation via infsh CLI
# Usage: ./scripts/generate-videos.sh [screen-id]
# Run with no args to generate all, or pass a screen ID for one clip.

set -euo pipefail

STYLE="TV game show production, saturated studio lighting, 16:9 broadcast, shallow depth of field, cinematic color grade"
OUTPUT_DIR="public/videos"
mkdir -p "$OUTPUT_DIR"

generate() {
  local id="$1" image="$2" prompt="$3"
  echo "==> Generating: $id"
  infsh app run falai/wan-2-5-i2v --input "{
    \"image_url\": \"$image\",
    \"prompt\": \"$prompt, $STYLE\"
  }" --output "$OUTPUT_DIR/${id}-raw.mp4"

  echo "==> Compressing: $id"
  ffmpeg -y -i "$OUTPUT_DIR/${id}-raw.mp4" \
    -vcodec libx264 -crf 23 \
    -vf scale=1280:720 \
    -movflags +faststart \
    -an \
    "$OUTPUT_DIR/${id}.mp4"

  rm "$OUTPUT_DIR/${id}-raw.mp4"

  local size
  size=$(wc -c < "$OUTPUT_DIR/${id}.mp4")
  local size_mb
  size_mb=$(echo "scale=2; $size / 1048576" | bc)
  echo "    $id.mp4 — ${size_mb}MB"

  if [ "$size" -gt 1572864 ]; then
    echo "    WARNING: exceeds 1.5MB budget. Re-run with higher CRF (26-28)."
  fi
}

# ── Screen definitions ──
cold_open() {
  generate "cold-open" "./public/sets/cold-open-glitch.webp" \
    "wide shot, slow zoom in, glitchy game show stage powering on, lights flickering to life, board illuminating"
}

welcome() {
  generate "welcome" "./public/sets/morning-desk.webp" \
    "medium shot, slow pan right, morning show desk, studio lights warming up, subtle camera drift"
}

feud_top3() {
  generate "feud-top3" "./public/sets/feud-board.webp" \
    "wide shot, static then slow dolly in, Family Feud board center stage, answer slots visible, stage lights sweep"
}

bachelor_roses() {
  generate "bachelor-roses" "./public/sets/bachelor-mansion.webp" \
    "wide shot, low angle, slow crane up, mansion interior, candelabras, rose petals catching light"
}

bachelor_limo() {
  generate "bachelor-limo" "./public/sets/limo-interior.webp" \
    "medium shot, slow truck left, limo interior, city lights streaming past windows, moody blue tones"
}

shark_invest() {
  generate "shark-invest" "./public/sets/shark-warehouse.webp" \
    "wide shot, slight low angle, slow dolly in, warehouse set, shark chairs visible, dramatic top-lighting"
}

survivor() {
  generate "survivor" "./public/sets/tribal-council.webp" \
    "medium shot, slow push in, tribal council, torches flickering, jungle ambiance, intimate confessional"
}

maury() {
  generate "maury" "./public/sets/maury-studio.webp" \
    "medium shot, static then slow pan, talk show studio, audience seats, dramatic envelope lighting"
}

credits() {
  generate "credits" "./public/sets/credits-bg.webp" \
    "wide shot, slow pull out, empty studio, lights dimming one by one, wrap-up energy"
}

# ── Runner ──
if [ $# -eq 1 ]; then
  case "$1" in
    cold-open) cold_open ;;
    welcome) welcome ;;
    feud-top3) feud_top3 ;;
    bachelor-roses) bachelor_roses ;;
    bachelor-limo) bachelor_limo ;;
    shark-invest) shark_invest ;;
    survivor) survivor ;;
    maury) maury ;;
    credits) credits ;;
    *) echo "Unknown screen: $1"; exit 1 ;;
  esac
else
  echo "Generating all 9 video clips..."
  cold_open
  welcome
  feud_top3
  bachelor_roses
  bachelor_limo
  shark_invest
  survivor
  maury
  credits
  echo ""
  echo "Done. Videos in $OUTPUT_DIR/"
  ls -lh "$OUTPUT_DIR"/*.mp4
fi
```

- [ ] **Step 2: Commit**

```bash
git add scripts/generate-videos.sh
git commit -m "feat: add infsh video generation script (prompt bible)"
```

---

## Task 15: Add video paths to screens.ts (after clips are generated)

**Files:**
- Modify: `src/data/screens.ts`

- [ ] **Step 1: Add video field to the 9 video screens**

In `src/data/screens.ts`, add `video` to each of the 9 video screens. Example for the first three:

```ts
// SCREEN 0: COLD OPEN
{
  id: "cold-open",
  // ...existing fields...
  video: "/videos/cold-open.mp4",
  uiRevealAt: 10.0,
},

// SCREEN 1: WELCOME
{
  id: "welcome",
  // ...existing fields...
  video: "/videos/welcome.mp4",
  uiRevealAt: 4.0,
},

// SCREEN 3A: FAMILY FEUD — TOP 3
{
  id: "feud-top3",
  // ...existing fields...
  video: "/videos/feud-top3.mp4",
  uiRevealAt: 3.5,
},
```

Do the same for: `bachelor-roses`, `bachelor-limo`, `shark-invest`, `survivor`, `maury`, `credits`.

Still-only screens (`relationship`, `feud-strongest`, `feud-trademark`, `sponsor-brand`, `sponsor-why`, `bachelor-eliminate`, `shark-reason`, `producer-notes`) keep no `video` field.

- [ ] **Step 2: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add src/data/screens.ts public/videos/
git commit -m "feat: add video backgrounds for 9 screens"
```

---

## Task 16: Mobile validation checklist

This is a manual testing task — no code changes.

- [ ] **Step 1: Test on real iPhone**

| Scenario | Expected |
|---|---|
| Normal mode, WiFi | MediaGate shows → tap Start → video plays behind captions → freezes on showUI |
| Low Power Mode | MediaGate shows → tap Start → video fails to autoplay → WebP still shows → no visual glitch |
| Silent mode on | Audio muted by OS → MuteToggle shows unmuted icon → captions still display |
| MuteToggle tap | Audio mutes/unmutes → video keeps playing |

- [ ] **Step 2: Test on real Android**

| Scenario | Expected |
|---|---|
| Normal mode, WiFi | Same as iPhone normal |
| Data Saver on | Video preload skipped → WebP still shows → no degradation |

- [ ] **Step 3: Test accessibility**

| Scenario | Expected |
|---|---|
| `prefers-reduced-motion: reduce` | No video plays → WebP stills only |
| VoiceOver / TalkBack | Video is `aria-hidden` → screen reader ignores it → MuteToggle has label |

- [ ] **Step 4: Test caption legibility over video**

Verify on all 9 video screens that:
- Caption text is readable with `bg-black/60` overlay
- QuestionPrompt text is readable when showUI is true
- Video is paused/frozen when input appears

- [ ] **Step 5: Document any issues and fix**

If overlay opacity needs adjustment, update the conditional class in `ScreenPlayer.tsx`.

---

## Dependency Order

```
Task 1 (useMediaConsent)
  → Task 2 (MediaGate)
    → Task 3 (mute in useAudioPlayer)
      → Task 4 (MuteToggle)
        → Task 5 (wire into SurveyFlow)

Task 6 (screen-prompts)
  → Task 7 (QuestionPrompt)
    → Task 8 (wire into ScreenPlayer)

Task 9 (video field on Screen type)
  → Task 10 (useVideoBackground)
    → Task 11 (VideoBackground)
      → Task 12 (integrate into ScreenPlayer)
        → Task 13 (preloading)

Task 14 (generation script) — independent, can run in parallel
Task 15 (add video paths) — after Task 12 + Task 14
Task 16 (mobile validation) — after Task 15
```

Tasks 1-5, 6-8, and 9-13 are three independent chains that can be parallelized. Task 14 can also run in parallel with all code tasks.
