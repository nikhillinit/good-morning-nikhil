import { act, cleanup, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockScreens,
  useAmbientMusicMock,
  playNarrationMock,
  audioUnlockState,
  unlockAudioPlaybackMock,
} = vi.hoisted(() => ({
  mockScreens: [
    {
      id: "intro-tv",
      show: "Intro",
      showEmoji: "",
      audio: "/vo/intro.mp3",
      bg: "crt",
      bgMusic: "/music/test-theme.mp3",
      captions: [],
      ui: "start-button" as const,
    },
  ],
  useAmbientMusicMock: vi.fn(),
  playNarrationMock: vi.fn(),
  audioUnlockState: { unlocked: false },
  unlockAudioPlaybackMock: vi.fn(async () => {
    audioUnlockState.unlocked = true;
    return true;
  }),
}));

vi.mock("@/data/screens", () => ({
  screens: mockScreens,
}));

vi.mock("@/hooks/useResponses", () => ({
  useResponses: () => ({
    setResponse: vi.fn(),
    hydrateResponses: vi.fn(),
    getResponse: vi.fn(),
    getAllResponses: vi.fn(() => ({})),
  }),
}));

vi.mock("@/hooks/useSession", () => ({
  SessionProvider: ({ children }: { children: ReactNode }) => children,
  useSession: () => ({
    session: null,
    loading: false,
    error: null,
    createNewSession: vi.fn(),
    updateSession: vi.fn(),
  }),
}));

vi.mock("@/hooks/useMediaConsent", () => ({
  useMediaConsent: () => ({
    hasConsented: true,
    grantConsent: vi.fn(),
    hydrated: true,
  }),
}));

vi.mock("@/hooks/useAmbientMusic", () => ({
  useAmbientMusic: useAmbientMusicMock,
}));

vi.mock("@/hooks/useAudioPlayer", () => ({
  useAudioPlayer: () => ({
    play: playNarrationMock,
    skip: vi.fn(),
    stop: vi.fn(),
    isPlaying: false,
    hasEnded: false,
    getCurrentTime: () => 0,
    isMuted: false,
    toggleMute: vi.fn(),
  }),
}));

vi.mock("@/lib/audio-unlock", () => ({
  hasTabAudioUnlock: () => audioUnlockState.unlocked,
  isAudioPlaybackUnlocked: () => audioUnlockState.unlocked,
  unlockAudioPlayback: unlockAudioPlaybackMock,
}));

vi.mock("@/components/ScreenPlayer", () => ({
  ScreenPlayer: () => <div data-testid="screen-player" />,
}));

vi.mock("@/components/SceneTransition", () => ({
  SceneTransition: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("@/components/ReviewScreen", () => ({
  ReviewScreen: () => <div data-testid="review-screen" />,
}));

vi.mock("@/components/MediaGate", () => ({
  MediaGate: () => <div data-testid="media-gate" />,
}));

describe("page audio gating", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetModules();
    useAmbientMusicMock.mockReset();
    playNarrationMock.mockReset();
    unlockAudioPlaybackMock.mockClear();
    audioUnlockState.unlocked = false;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    cleanup();
  });

  it("waits for a current-tab user gesture before starting ambient music and narration", async () => {
    const { default: Home } = await import("@/app/page");

    render(<Home />);

    expect(useAmbientMusicMock).toHaveBeenLastCalledWith(undefined, 0.4, false);
    expect(playNarrationMock).not.toHaveBeenCalled();

    await act(async () => {
      window.dispatchEvent(new PointerEvent("pointerdown"));
      await Promise.resolve();
    });

    expect(useAmbientMusicMock).toHaveBeenLastCalledWith(
      "/music/test-theme.mp3",
      0.4,
      false,
    );

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(playNarrationMock).toHaveBeenCalledWith("/vo/intro.mp3");
  }, 10000);
});
