"use client";

import { Howler } from "howler";

type HowlerWithUnlock = typeof Howler & {
  _unlockAudio?: () => void;
  ctx?: AudioContext | null;
};

let audioUnlockedInTab = false;

export async function unlockAudioPlayback(): Promise<boolean> {
  const howler = Howler as HowlerWithUnlock;

  try {
    // Force Howler to initialize its AudioContext while we're still inside
    // the user gesture, otherwise a later resume attempt is a no-op.
    howler.volume(howler.volume());
    howler._unlockAudio?.();

    if (howler.ctx && typeof howler.ctx.resume === "function" && howler.ctx.state !== "running") {
      await howler.ctx.resume();
    }

    audioUnlockedInTab = isAudioPlaybackUnlocked();
    return audioUnlockedInTab;
  } catch (error) {
    console.warn("[AudioUnlock] Unable to unlock audio playback", error);
    return false;
  }
}

export function isAudioPlaybackUnlocked(): boolean {
  const howler = Howler as HowlerWithUnlock;
  return howler.ctx?.state === "running";
}

export function hasTabAudioUnlock(): boolean {
  return audioUnlockedInTab || isAudioPlaybackUnlocked();
}
