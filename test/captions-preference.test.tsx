import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useCaptions } from "@/hooks/useCaptions";

describe("useCaptions preference handling", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("reads the stored captions preference during initial render", () => {
    localStorage.setItem("gmn-captions-enabled", "0");

    const { result } = renderHook(() => useCaptions("intro-tv", null));

    expect(result.current.captionsEnabled).toBe(false);
  });

  it("persists toggled caption preferences", () => {
    const { result } = renderHook(() => useCaptions("intro-tv", null));

    act(() => {
      result.current.toggleCaptions();
    });

    expect(result.current.captionsEnabled).toBe(false);
    expect(localStorage.getItem("gmn-captions-enabled")).toBe("0");
  });
});
