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
  UIInput: () => <div data-testid="ui-input" />,
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
  play.mockReset();
  skip.mockReset();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  cleanup();
});

describe("ScreenPlayer animation behavior", () => {
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

    fireEvent.click(screen.getAllByRole("button", { name: /skip/i })[0]);

    vi.advanceTimersByTime(300);
    expect(skip).toHaveBeenCalled();
    expect(play).not.toHaveBeenCalled();
  });
});

describe("ScreenPlayer Motion Ownership & Layout", () => {
  it("renders PaperShimmer when video is disabled", () => {
    render(<ScreenPlayer screen={makeScreen({ video: undefined })} onComplete={vi.fn()} />);
    expect(screen.queryByTestId("paper-shimmer")).not.toBeNull();
  });

  it("kills PaperShimmer when a video is provided", () => {
    render(<ScreenPlayer screen={makeScreen({ video: "/videos/test.mp4" })} onComplete={vi.fn()} />);
    expect(screen.queryByTestId("paper-shimmer")).toBeNull();
  });

  it("applies items-end class when uiLayout is right", () => {
    // We need to bypass the audio wait to force showUI rendering using skip button
    render(<ScreenPlayer screen={makeScreen({ uiLayout: "right" })} onComplete={vi.fn()} />);
    fireEvent.click(screen.getAllByRole("button", { name: /skip/i })[0]);
    
    // Check the wrapper
    const layoutWrapper = screen.getByTestId("layout-wrapper");
    expect(layoutWrapper.className).toContain("items-end");
    expect(layoutWrapper.className).toContain("pr-");
  });

  it("applies mediaPosition correctly to the backdrop", () => {
    const { container } = render(<ScreenPlayer screen={makeScreen({ mediaPosition: "left top" })} onComplete={vi.fn()} />);
    
    const section = container.querySelector("section[aria-label='Cold Open']") as HTMLElement;
    expect(section.style.backgroundPosition).toBe("left top");
  });
});

