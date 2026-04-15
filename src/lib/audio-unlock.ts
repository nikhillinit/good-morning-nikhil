"use client";

import { Howler } from "howler";

type HowlerWithUnlock = typeof Howler & {
  _unlockAudio?: () => void;
  ctx?: AudioContext | null;
};

export async function unlockAudioPlayback(): Promise<void> {
  const howler = Howler as HowlerWithUnlock;

  try {
    // Force Howler to initialize its AudioContext while we're still inside
    // the user gesture, otherwise a later resume attempt is a no-op.
    howler.volume(howler.volume());
    howler._unlockAudio?.();

    if (howler.ctx && typeof howler.ctx.resume === "function" && howler.ctx.state !== "running") {
      await howler.ctx.resume();
    }
  } catch (error) {
    console.warn("[AudioUnlock] Unable to unlock audio playback", error);
  }
}
