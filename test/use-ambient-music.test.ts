import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Capture Howl constructor args
let capturedHowlOptions: Record<string, unknown> = {};

const mockHowlInstance = {
  once: vi.fn(),
  play: vi.fn(),
  mute: vi.fn(),
  stop: vi.fn(),
  unload: vi.fn(),
  volume: vi.fn(),
  fade: vi.fn(),
  playing: vi.fn(() => false),
  _src: undefined as string | undefined,
};

vi.mock("howler", () => {
  const HowlMock = vi.fn(function (this: Record<string, unknown>, options: Record<string, unknown>) {
    capturedHowlOptions = options;
    Object.assign(this, mockHowlInstance);
  });
  return { Howl: HowlMock };
});

import { useAmbientMusic } from "@/hooks/useAmbientMusic";

describe("useAmbientMusic – Howler event handlers", () => {
  beforeEach(() => {
    capturedHowlOptions = {};
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function renderWithSrc(src = "/audio/ambient/test.mp3") {
    renderHook(() => useAmbientMusic(src, 0.3, false));
  }

  it("creates Howl with onloaderror handler", () => {
    renderWithSrc();
    expect(typeof capturedHowlOptions.onloaderror).toBe("function");
  });

  it("creates Howl with onplayerror handler", () => {
    renderWithSrc();
    expect(typeof capturedHowlOptions.onplayerror).toBe("function");
  });

  it("creates Howl with onload handler", () => {
    renderWithSrc();
    expect(typeof capturedHowlOptions.onload).toBe("function");
  });

  it("creates Howl with onplay handler", () => {
    renderWithSrc();
    expect(typeof capturedHowlOptions.onplay).toBe("function");
  });

  it("passes an explicit format derived from the source path", () => {
    renderWithSrc("/audio/test-track.wav?v=2");
    expect(capturedHowlOptions.format).toEqual(["wav"]);
  });

  it("onloaderror logs console.error with [AmbientMusic] prefix", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    renderWithSrc("/audio/test.mp3");
    const handler = capturedHowlOptions.onloaderror as (_id: unknown, error: unknown) => void;
    handler(1, "network error");
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("[AmbientMusic]"),
      expect.anything()
    );
  });

  it("onplayerror logs console.error with [AmbientMusic] prefix", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    renderWithSrc("/audio/test.mp3");
    const handler = capturedHowlOptions.onplayerror as (_id: unknown, error: unknown) => void;
    handler(1, "decode error");
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("[AmbientMusic]"),
      expect.anything()
    );
  });

  it("onload logs console.log with [AmbientMusic] prefix", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    renderWithSrc("/audio/test.mp3");
    const handler = capturedHowlOptions.onload as () => void;
    handler();
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("[AmbientMusic]"),
      expect.anything()
    );
  });

  it("onplay logs console.log with [AmbientMusic] prefix", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    renderWithSrc("/audio/test.mp3");
    const handler = capturedHowlOptions.onplay as () => void;
    handler();
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("[AmbientMusic]"),
      expect.anything()
    );
  });

  it("unloads the current howl after a play error", () => {
    renderWithSrc("/audio/test.mp3");
    const handler = capturedHowlOptions.onplayerror as (_id: unknown, error: unknown) => void;
    handler(1, "autoplay blocked");

    expect(mockHowlInstance.stop).toHaveBeenCalledTimes(1);
    expect(mockHowlInstance.unload).toHaveBeenCalledTimes(1);
  });
});
