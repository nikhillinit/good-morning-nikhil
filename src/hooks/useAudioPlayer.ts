"use client";

import { useCallback, useRef, useState } from "react";
import { Howl } from "howler";

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
    }

    setHasEnded(false);
    setIsPlaying(true);

    const howl = new Howl({
      src: [src],
      html5: true,
      onend: () => {
        setIsPlaying(false);
        setHasEnded(true);
        onEnd?.();
      },
      onloaderror: () => {
        // If audio fails to load, skip to UI reveal
        setIsPlaying(false);
        setHasEnded(true);
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
    }
    setIsPlaying(false);
    setHasEnded(true);
  }, []);

  const stop = useCallback(() => {
    if (howlRef.current) {
      howlRef.current.stop();
      howlRef.current.unload();
    }
    setIsPlaying(false);
    setHasEnded(false);
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
