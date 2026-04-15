"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Howl } from "howler";

function inferFormat(src: string): string | undefined {
  const normalized = src.split("?")[0]?.split("#")[0] ?? "";
  const ext = normalized.split(".").pop()?.toLowerCase();

  if (!ext) return undefined;
  if (ext === "m4a") return "mp4";
  return ext;
}

export function useAudioPlayer() {
  const howlRef = useRef<Howl | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const mutedRef = useRef(false);
  const [isMuted, setIsMuted] = useState(false);

  const play = useCallback((src: string, onEnd?: () => void) => {
    // Stop any existing audio
    if (howlRef.current) {
      howlRef.current.stop();
      howlRef.current.unload();
      howlRef.current = null;
    }

    setHasEnded(false);
    setIsPlaying(true);

    const format = inferFormat(src);

    const howl = new Howl({
      src: [src],
      format: format ? [format] : undefined,
      onend: () => {
        setIsPlaying(false);
        setHasEnded(true);
        howlRef.current = null;
        onEnd?.();
      },
      onloaderror: () => {
        // If audio fails to load, skip to UI reveal
        setIsPlaying(false);
        setHasEnded(true);
        howlRef.current = null;
        onEnd?.();
      },
    });

    howlRef.current = howl;
    howl.play();
    howl.mute(mutedRef.current);
  }, []);

  const skip = useCallback(() => {
    if (howlRef.current) {
      howlRef.current.stop();
      howlRef.current.unload();
      howlRef.current = null;
    }
    setIsPlaying(false);
    setHasEnded(true);
  }, []);

  const stop = useCallback(() => {
    if (howlRef.current) {
      howlRef.current.stop();
      howlRef.current.unload();
      howlRef.current = null;
    }
    setIsPlaying(false);
    setHasEnded(false);
  }, []);

  useEffect(() => () => {
    if (howlRef.current) {
      howlRef.current.stop();
      howlRef.current.unload();
      howlRef.current = null;
    }
  }, []);

  const getCurrentTime = useCallback((): number => {
    if (!howlRef.current) return 0;
    return howlRef.current.seek() as number;
  }, []);

  const toggleMute = useCallback(() => {
    mutedRef.current = !mutedRef.current;
    setIsMuted(mutedRef.current);
    if (howlRef.current) {
      howlRef.current.mute(mutedRef.current);
    }
  }, []);

  return { play, skip, stop, isPlaying, hasEnded, getCurrentTime, isMuted, toggleMute };
}
