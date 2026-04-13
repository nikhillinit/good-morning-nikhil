import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Screen } from "@/data/screens";
import { ScreenPlayer } from "@/components/ScreenPlayer";

const play = vi.fn();
const skip = vi.fn();

vi.mock("@/hooks/useAudioPlayer", () => ({
  useAudioPlayer: () => ({
    play,
    skip,
    isPlaying: false,
    hasEnded: false,
    getCurrentTime: () => 0,
    isMuted: false,
    toggleMute: vi.fn(),
  }),
}));

vi.mock("@/hooks/useCaptions", () => ({
  useCaptions: () => ({
    currentCaption: null,
  }),
}));

vi.mock("@/components/ambient/PaperShimmer", () => ({
  PaperShimmer: () => <div data-testid="paper-shimmer" />,
}));

vi.mock("@/lib/ambient-map", () => ({
  getAmbientLayer: () => null,
}));

vi.mock("@/components/ShowBadge", () => ({
  ShowBadge: () => <div data-testid="show-badge" />,
}));

vi.mock("@/components/SkipButton", () => ({
  SkipButton: ({
    visible,
    onClick,
  }: {
    visible: boolean;
    onClick: () => void;
  }) => (visible ? <button onClick={onClick}>Skip →</button> : null),
}));

vi.mock("@/components/ui-inputs", () => ({
  UIInput: () => <div data-testid="ui-input" />,
}));

vi.mock("@/components/MuteToggle", () => ({
  MuteToggle: () => <button>Mute audio</button>,
}));

vi.mock("@/components/QuestionPrompt", () => ({
  QuestionPrompt: () => <div data-testid="question-prompt" />,
}));

vi.mock("@/components/VideoBackground", () => ({
  VideoBackground: () => <div data-testid="video-bg" />,
}));

function makeScreen(overrides: Partial<Screen> = {}): Screen {
  return {
    id: "cold-open",
    show: "Cold Open",
    showEmoji: "🎬",
    audio: "/vo/test.mp3",
    bg: "/sets/test.webp",
    captions: ["Test caption"],
    ui: "start-button",
    uiRevealAt: 20,
    ...overrides,
  };
}

describe("ScreenPlayer animation behavior", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    play.mockReset();
    skip.mockReset();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    cleanup();
  });

  it("starts audio after the mount delay", () => {
    render(
      <ScreenPlayer
        screen={makeScreen()}
        onComplete={vi.fn()}
      />,
    );

    expect(play).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);
    expect(play).toHaveBeenCalledWith("/vo/test.mp3");
  });

  it("does not start audio if the user skips before playback begins", () => {
    render(
      <ScreenPlayer
        screen={makeScreen()}
        onComplete={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /skip/i }));

    vi.advanceTimersByTime(300);
    expect(skip).toHaveBeenCalled();
    expect(play).not.toHaveBeenCalled();
  });
});
