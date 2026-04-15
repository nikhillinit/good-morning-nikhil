import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";

const howlState = vi.hoisted(() => {
  const stop = vi.fn();
  const unload = vi.fn();
  const play = vi.fn();
  const mute = vi.fn();
  const seek = vi.fn(() => 0);
  const Howl = vi.fn().mockImplementation(function MockHowl() {
    return {
      stop,
      unload,
      play,
      mute,
      seek,
    };
  });

  return { stop, unload, play, mute, seek, Howl };
});

vi.mock("howler", () => ({
  Howl: howlState.Howl,
}));

describe("useAudioPlayer", () => {
  beforeEach(() => {
    howlState.Howl.mockClear();
    howlState.stop.mockClear();
    howlState.unload.mockClear();
    howlState.play.mockClear();
    howlState.mute.mockClear();
    howlState.seek.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("stops and unloads the active howl on unmount", () => {
    const { result, unmount } = renderHook(() => useAudioPlayer());

    act(() => {
      result.current.play("/vo/test.mp3?v=2");
    });

    unmount();

    expect(howlState.stop).toHaveBeenCalledTimes(1);
    expect(howlState.unload).toHaveBeenCalledTimes(1);
  });
});
