"use client";

import { motion } from "framer-motion";
import type { Screen } from "@/data/screens";
import { DURATION, EASE_OUT, EASE_BREATHE } from "@/lib/animations";

const SAME_SET_PAIRS = new Set([
  "Control Room→Credits",
]);

/** Show pairs that benefit from a buffer/pause (emotional intensity shift) */
const NEEDS_BUFFER_PAIRS = new Set([
  "Good Morning Nikhil→Family Feud",
  "Commercial Break→The Bachelor",
  "Shark Tank→Survivor",
  "Survivor→Maury",
  "Maury→Control Room",
]);

function transitionKey(previousShow: string, nextShow: string): string {
  return `${previousShow}→${nextShow}`;
}

interface SceneTransitionProps {
  screen: Screen;
  previousShow?: string;
  children: React.ReactNode;
}

export function SceneTransition({
  screen,
  previousShow,
  children,
}: SceneTransitionProps) {
  const isShowChange =
    previousShow !== undefined && previousShow !== screen.show;

  const key = previousShow ? transitionKey(previousShow, screen.show) : "";
  const useDissolve = SAME_SET_PAIRS.has(key);
  const needsBuffer = NEEDS_BUFFER_PAIRS.has(key);

  // Buffer transitions get dramatic timing, standard show changes get screen timing
  const staticDuration = needsBuffer ? DURATION.DRAMATIC : DURATION.SCREEN;

  return (
    <>
      {isShowChange && !useDissolve && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-50"
          initial={{ opacity: needsBuffer ? 0.85 : 0.7 }}
          animate={{ opacity: 0 }}
          transition={{ duration: staticDuration, ease: EASE_OUT }}
          style={{
            backgroundImage: "url(/textures/tv-static.png)",
            backgroundSize: "cover",
            mixBlendMode: "screen",
          }}
        />
      )}
      {isShowChange && useDissolve && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-50 bg-black"
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 0 }}
          transition={{ duration: DURATION.FRAME, ease: EASE_BREATHE }}
        />
      )}
      {children}
    </>
  );
}
