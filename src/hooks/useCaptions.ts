"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type CaptionLine } from "@/lib/captions/parser";
import { SCREEN_CAPTIONS } from "@/lib/captions/data";

const LS_KEY = "gmn-captions-enabled";

function readPreference(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const stored = localStorage.getItem(LS_KEY);
    return stored === null ? true : stored === "1";
  } catch {
    return true;
  }
}

function writePreference(enabled: boolean) {
  try {
    localStorage.setItem(LS_KEY, enabled ? "1" : "0");
  } catch {
    // Silently fail in private browsing
  }
}

export interface UseCaptionsReturn {
  currentCaption: CaptionLine | null;
  allCaptions: CaptionLine[];
  captionsEnabled: boolean;
  toggleCaptions: () => void;
}

export function useCaptions(
  screenKey: string,
  getCurrentTime: (() => number) | null,
): UseCaptionsReturn {
  const allCaptions = useMemo(() => SCREEN_CAPTIONS[screenKey] ?? [], [screenKey]);

  const [currentCaption, setCurrentCaption] = useState<CaptionLine | null>(null);
  const [captionsEnabled, setCaptionsEnabled] = useState(readPreference);

  const rafRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerIndexRef = useRef(0);

  const toggleCaptions = useCallback(() => {
    setCaptionsEnabled((prev) => {
      const next = !prev;
      writePreference(next);
      return next;
    });
  }, []);

  // Sync captions to audio currentTime via rAF
  useEffect(() => {
    if (!captionsEnabled || allCaptions.length === 0 || !getCurrentTime) return;

    function findCaption(timeMs: number): CaptionLine | null {
      for (const cue of allCaptions) {
        if (timeMs >= cue.startMs && timeMs < cue.endMs) return cue;
      }
      return null;
    }

    function tick() {
      const timeS = getCurrentTime!();
      if (timeS > 0) {
        const timeMs = timeS * 1000;
        setCurrentCaption(findCaption(timeMs));
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [captionsEnabled, allCaptions, getCurrentTime]);

  // Fallback: when getCurrentTime is null (audio skipped), step through on timer
  useEffect(() => {
    if (!captionsEnabled || allCaptions.length === 0 || getCurrentTime) return;

    timerIndexRef.current = 0;

    function stepCaption() {
      if (timerIndexRef.current >= allCaptions.length) {
        setCurrentCaption(null);
        return;
      }

      const cue = allCaptions[timerIndexRef.current];
      setCurrentCaption(cue);

      const duration = cue.endMs - cue.startMs;
      timerIndexRef.current++;

      timerRef.current = setTimeout(stepCaption, duration);
    }

    stepCaption();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [captionsEnabled, allCaptions, getCurrentTime, screenKey]);

  return {
    currentCaption: captionsEnabled ? currentCaption : null,
    allCaptions,
    captionsEnabled,
    toggleCaptions,
  };
}
