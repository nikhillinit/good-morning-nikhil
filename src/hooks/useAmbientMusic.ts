"use client";

import { useEffect, useRef, useState } from "react";
import { Howl } from "howler";

const FADE_DURATION = 1500; // 1.5 seconds crossfade

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
    if (currentHowl.current && currentHowl.current.playing() && (currentHowl.current as any)._src === src) {
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
    const newHowl = new Howl({
      src: [src],
      html5: true,
      loop: true,
      volume: 0,
    });
    
    // Store source for comparison
    (newHowl as any)._src = src;

    newHowl.play();
    newHowl.fade(0, volume, FADE_DURATION);
    newHowl.mute(isMuted);

    currentHowl.current = newHowl;

  }, [src, volume]);

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
