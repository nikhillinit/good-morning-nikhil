import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Screen } from "@/data/screens";
import { ScreenPlayer } from "@/components/ScreenPlayer";

vi.mock("@/hooks/useCaptions", () => ({
  useCaptions: () => ({
    currentCaption: {
      id: 1,
      startMs: 0,
      endMs: 5000,
      speaker: "steve",
      text: "Keep the captions up.",
      variant: "normal",
    },
  }),
}));

vi.mock("@/components/ambient/PaperShimmer", () => ({
  PaperShimmer: () => null,
}));

vi.mock("@/components/ambient/CRTScreen", () => ({
  CRTScreen: () => null,
}));

vi.mock("@/components/ambient/TelevisionFrame", () => ({
  TelevisionFrame: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/lib/ambient-map", () => ({
  getAmbientLayer: () => null,
}));

vi.mock("@/components/MuteToggle", () => ({
  MuteToggle: () => null,
}));

vi.mock("@/components/QuestionPrompt", () => ({
  QuestionPrompt: () => <div data-testid="question-prompt" />,
}));

vi.mock("@/components/ShowBadge", () => ({
  ShowBadge: () => null,
}));

vi.mock("@/components/SkipButton", () => ({
  SkipButton: () => null,
}));

vi.mock("@/components/ui-inputs", () => ({
  UIInput: () => <div data-testid="ui-input" />,
}));

vi.mock("@/components/VideoBackground", () => ({
  VideoBackground: () => null,
}));

vi.mock("@/components/BroadcastTimeline", () => ({
  BroadcastTimeline: () => null,
}));

function makeScreen(overrides: Partial<Screen> = {}): Screen {
  return {
    id: "test-screen",
    show: "Test",
    showEmoji: "🎬",
    audio: "/vo/test.mp3",
    bg: "/sets/test.webp",
    captions: ["Keep the captions up."],
    ui: "short-text",
    uiRevealAt: 1,
    ...overrides,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  cleanup();
});

describe("ScreenPlayer captions", () => {
  it("keeps captions visible after timed UI reveal while audio is still playing", () => {
    render(
      <ScreenPlayer
        screen={makeScreen()}
        isNarrationPlaying={true}
        hasNarrationEnded={false}
        getNarrationTime={() => 1.5}
        isNarrationMuted={false}
        onToggleNarrationMute={vi.fn()}
        onSkipNarration={vi.fn()}
        onComplete={vi.fn()}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByTestId("ui-input")).toBeInTheDocument();
    expect(screen.getByText("Keep the captions up.")).toBeInTheDocument();
  });
});
