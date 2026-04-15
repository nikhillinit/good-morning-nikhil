"use client";

import { useEffect, useRef } from "react";
import { Howl } from "howler";

const FADE_DURATION = 1500; // 1.5 seconds crossfade

type HowlWithSource = Howl & {
  _src?: string;
};

function inferFormat(src: string): string | undefined {
  const normalized = src.split("?")[0]?.split("#")[0] ?? "";
  const ext = normalized.split(".").pop()?.toLowerCase();

  if (!ext) return undefined;
  if (ext === "m4a") return "mp4";
  return ext;
}

export function useAmbientMusic(src?: string, volume: number = 0.3, isMuted: boolean = false) {
  const currentHowl = useRef<Howl | null>(null);
  const fadingHowl = useRef<Howl | null>(null);

  useEffect(() => {
    // If no new source, just fade out current and exit
    if (!src) {
      if (currentHowl.current) {
        const h = currentHowl.current;
        h.fade(h.volume(), 0, FADE_DURATION);
        setTimeout(() => {
          h.stop();
          h.unload();
        }, FADE_DURATION);
        currentHowl.current = null;
      }
      return;
    }

    // New source requested. If it's already playing, do nothing but ensure volume is valid
    const activeHowl = currentHowl.current as HowlWithSource | null;

    if (activeHowl && activeHowl.playing() && activeHowl._src === src) {
      return;
    }

    // Cleanup any currently fading-out howl to prevent memory leaks
    if (fadingHowl.current) {
      fadingHowl.current.stop();
      fadingHowl.current.unload();
    }

    // Move current howl to fading howl
    if (currentHowl.current) {
      const h = currentHowl.current;
      fadingHowl.current = h;
      h.fade(h.volume(), 0, FADE_DURATION);
      setTimeout(() => {
        h.stop();
        h.unload();
        if (fadingHowl.current === h) {
          fadingHowl.current = null;
        }
      }, FADE_DURATION);
    }

    // Instantiate and play new howl
    const format = inferFormat(src);
    const newHowl = new Howl({
      src: [src],
      format: format ? [format] : undefined,
      loop: true,
      volume: volume, // start at target volume if fade fails
      onload: () => {
        console.log(`[AmbientMusic] Loaded:`, src);
        newHowl.volume(0); // initialize to 0 upon load
        newHowl.fade(0, volume, FADE_DURATION); // then fade up
      },
      onloaderror: (_id: number, error: unknown) => {
        console.error(`[AmbientMusic] Load error for ${src}:`, error);
        if (currentHowl.current === newHowl) {
          currentHowl.current = null;
        }
        newHowl.unload();
      },
      onplayerror: (_id: number, error: unknown) => {
        console.error(`[AmbientMusic] Play error for ${src}:`, error);
        if (currentHowl.current === newHowl) {
          currentHowl.current = null;
        }
        newHowl.stop();
        newHowl.unload();
      },
      onplay: () => {
        console.log(`[AmbientMusic] Playing:`, src);
      },
    });
    
    // Store source for comparison
    (newHowl as HowlWithSource)._src = src;

    newHowl.play(); // will queue until loaded
    newHowl.mute(isMuted);

    currentHowl.current = newHowl;

  }, [src, volume, isMuted]);

  useEffect(() => {
    if (currentHowl.current) {
      currentHowl.current.mute(isMuted);
    }
    if (fadingHowl.current) {
      fadingHowl.current.mute(isMuted);
    }
  }, [isMuted]);

  // Cleanup all audio on unmount
  useEffect(() => {
    return () => {
      if (currentHowl.current) {
        currentHowl.current.stop();
        currentHowl.current.unload();
      }
      if (fadingHowl.current) {
        fadingHowl.current.stop();
        fadingHowl.current.unload();
      }
    };
  }, []);
}
