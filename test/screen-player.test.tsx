import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Screen } from "@/data/screens";
import { ScreenPlayer } from "@/components/ScreenPlayer";

vi.mock("@/hooks/useCaptions", () => ({
  useCaptions: () => ({
    currentCaption: null,
  }),
}));

vi.mock("@/components/ambient/PaperShimmer", () => ({
  PaperShimmer: () => <div data-testid="paper-shimmer" />,
}));

vi.mock("@/components/ambient/CRTScreen", () => ({
  CRTScreen: () => <div data-testid="crt-screen" />,
}));

vi.mock("@/components/ambient/TelevisionFrame", () => ({
  TelevisionFrame: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="television-frame">{children}</div>
  ),
}));

vi.mock("@/lib/ambient-map", () => ({
  getAmbientLayer: () => null,
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
  UIInput: ({ onSubmit }: { onSubmit: (value: unknown) => void }) => (
    <div data-testid="ui-input">
      <button onClick={() => onSubmit("submitted value")}>submit input</button>
    </div>
  ),
}));

vi.mock("@/components/MuteToggle", () => ({
  MuteToggle: () => <button>Mute audio</button>,
}));

vi.mock("@/components/BroadcastTimeline", () => ({
  BroadcastTimeline: () => <div data-testid="broadcast-timeline" />,
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

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  cleanup();
});

describe("ScreenPlayer animation behavior", () => {
  it("reveals the UI after the configured narration timing threshold", () => {
    render(
      <ScreenPlayer
        screen={makeScreen()}
        isNarrationPlaying={true}
        hasNarrationEnded={false}
        getNarrationTime={() => 0}
        isNarrationMuted={false}
        onToggleNarrationMute={vi.fn()}
        onSkipNarration={vi.fn()}
        onComplete={vi.fn()}
      />,
    );

    expect(screen.queryByTestId("ui-input")).toBeNull();
    act(() => {
      vi.advanceTimersByTime(20_000);
    });
    expect(screen.getByTestId("ui-input")).toBeInTheDocument();
  });

  it("delegates skip to the parent narration controller", () => {
    const onSkipNarration = vi.fn();
    render(
      <ScreenPlayer
        screen={makeScreen()}
        isNarrationPlaying={false}
        hasNarrationEnded={false}
        getNarrationTime={() => 0}
        isNarrationMuted={false}
        onToggleNarrationMute={vi.fn()}
        onSkipNarration={onSkipNarration}
        onComplete={vi.fn()}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: /skip/i })[0]);

    expect(onSkipNarration).toHaveBeenCalledTimes(1);
  });

  it("submits the current screen value through the parent handler", () => {
    const onComplete = vi.fn();

    render(
      <ScreenPlayer
        screen={makeScreen({ ui: "short-text" })}
        isNarrationPlaying={false}
        hasNarrationEnded={true}
        getNarrationTime={() => 0}
        isNarrationMuted={false}
        onToggleNarrationMute={vi.fn()}
        onSkipNarration={vi.fn()}
        onComplete={onComplete}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /submit input/i }));

    expect(onComplete).toHaveBeenCalledWith("submitted value");
  });

  it("delegates back navigation to the parent handler", () => {
    const onBack = vi.fn();

    render(
      <ScreenPlayer
        screen={makeScreen({ ui: "short-text" })}
        isNarrationPlaying={false}
        hasNarrationEnded={true}
        getNarrationTime={() => 0}
        isNarrationMuted={false}
        onToggleNarrationMute={vi.fn()}
        onSkipNarration={vi.fn()}
        onComplete={vi.fn()}
        onBack={onBack}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /back/i }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe("ScreenPlayer Motion Ownership & Layout", () => {
  it("renders PaperShimmer when video is disabled", () => {
    render(
      <ScreenPlayer
        screen={makeScreen({ video: undefined })}
        isNarrationPlaying={false}
        hasNarrationEnded={true}
        getNarrationTime={() => 0}
        isNarrationMuted={false}
        onToggleNarrationMute={vi.fn()}
        onSkipNarration={vi.fn()}
        onComplete={vi.fn()}
      />,
    );
    expect(screen.queryByTestId("paper-shimmer")).not.toBeNull();
  });

  it("kills PaperShimmer when a video is provided", () => {
    render(
      <ScreenPlayer
        screen={makeScreen({ video: "/videos/test.mp4" })}
        isNarrationPlaying={false}
        hasNarrationEnded={true}
        getNarrationTime={() => 0}
        isNarrationMuted={false}
        onToggleNarrationMute={vi.fn()}
        onSkipNarration={vi.fn()}
        onComplete={vi.fn()}
      />,
    );
    expect(screen.queryByTestId("paper-shimmer")).toBeNull();
  });

  it("applies items-end class when uiLayout is right", () => {
    // We need to bypass the audio wait to force showUI rendering using skip button
    render(
      <ScreenPlayer
        screen={makeScreen({ uiLayout: "right" })}
        isNarrationPlaying={false}
        hasNarrationEnded={false}
        getNarrationTime={() => 0}
        isNarrationMuted={false}
        onToggleNarrationMute={vi.fn()}
        onSkipNarration={vi.fn()}
        onComplete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getAllByRole("button", { name: /skip/i })[0]);
    
    // Check the wrapper
    const layoutWrapper = screen.getByTestId("layout-wrapper");
    expect(layoutWrapper.className).toContain("items-end");
    expect(layoutWrapper.className).toContain("pr-");
  });

  it("applies mediaPosition correctly to the backdrop", () => {
    const { container } = render(
      <ScreenPlayer
        screen={makeScreen({ mediaPosition: "left top" })}
        isNarrationPlaying={false}
        hasNarrationEnded={true}
        getNarrationTime={() => 0}
        isNarrationMuted={false}
        onToggleNarrationMute={vi.fn()}
        onSkipNarration={vi.fn()}
        onComplete={vi.fn()}
      />,
    );
    
    const section = container.querySelector("section[aria-label='Cold Open']") as HTMLElement;
    expect(section.style.backgroundPosition).toBe("left top");
  });
});

