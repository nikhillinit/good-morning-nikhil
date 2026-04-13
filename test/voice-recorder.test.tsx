import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VoiceRecorder } from "@/components/ui-inputs/VoiceRecorder";

class MockMediaRecorder {
  static isTypeSupported = vi.fn(() => true);

  readonly mimeType: string;
  readonly stream: MediaStream;
  state: "inactive" | "recording" = "inactive";
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;

  constructor(stream: MediaStream, options?: { mimeType?: string }) {
    this.stream = stream;
    this.mimeType = options?.mimeType ?? "audio/webm";
  }

  addEventListener(
    type: "dataavailable" | "stop",
    listener: ((event: { data: Blob }) => void) | (() => void),
  ) {
    if (type === "dataavailable") {
      this.ondataavailable = listener as (event: { data: Blob }) => void;
      return;
    }

    this.onstop = listener as () => void;
  }

  start() {
    this.state = "recording";
  }

  stop() {
    this.state = "inactive";
    this.ondataavailable?.({
      data: new Blob(["voice"], { type: this.mimeType }),
    });
    this.onstop?.();
  }
}

describe("VoiceRecorder", () => {
  const getUserMedia = vi.fn();
  const stopTrack = vi.fn();
  const onSubmit = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.restoreAllMocks();
    vi.clearAllMocks();

    Object.defineProperty(globalThis, "MediaRecorder", {
      configurable: true,
      writable: true,
      value: MockMediaRecorder,
    });

    Object.defineProperty(globalThis.navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia,
      },
    });

    Object.defineProperty(globalThis.navigator, "vibrate", {
      configurable: true,
      value: vi.fn(),
    });

    Object.defineProperty(globalThis.URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:voice-preview"),
    });

    Object.defineProperty(globalThis.URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });

    vi
      .spyOn(HTMLMediaElement.prototype, "load")
      .mockImplementation(() => undefined);
    vi
      .spyOn(HTMLMediaElement.prototype, "play")
      .mockImplementation(async () => undefined);
    vi
      .spyOn(HTMLMediaElement.prototype, "pause")
      .mockImplementation(() => undefined);

    getUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: stopTrack }],
    } as unknown as MediaStream);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    cleanup();
  });

  it("records, stops, and submits a voice take", async () => {
    const { container } = render(
      <VoiceRecorder
        prompt="Final words for the tribe."
        maxSeconds={15}
        onSubmit={onSubmit}
      />,
    );

    // Switch to Record tab (Type is the default co-equal mode)
    fireEvent.click(screen.getByRole("button", { name: /record/i }));

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /start recording/i }));
      await Promise.resolve();
    });

    expect(getUserMedia).toHaveBeenCalledOnce();
    expect(screen.getByText(/recording now/i)).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /stop recording/i }));
      await Promise.resolve();
    });

    expect(screen.getByText(/take ready/i)).toBeInTheDocument();
    expect(container.querySelector("audio")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /use this take/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "audio",
        mediaUrl: "blob:voice-preview",
      }),
    );
  });

  it("auto-stops when the countdown expires", async () => {
    render(
      <VoiceRecorder
        prompt="Director's notes."
        maxSeconds={3}
        onSubmit={onSubmit}
      />,
    );

    // Switch to Record tab first
    fireEvent.click(screen.getByRole("button", { name: /record/i }));

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /start recording/i }));
      await Promise.resolve();
    });

    expect(getUserMedia).toHaveBeenCalledOnce();
    await act(async () => {
      vi.advanceTimersByTime(3100);
      await Promise.resolve();
    });

    expect(screen.getByText(/take ready/i)).toBeInTheDocument();
  });

  it("supports skipping without opening the keyboard", () => {
    render(
      <VoiceRecorder
        prompt="The confession."
        maxSeconds={15}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /skip this one/i }));

    expect(onSubmit).toHaveBeenCalledWith(null);
  });
});
