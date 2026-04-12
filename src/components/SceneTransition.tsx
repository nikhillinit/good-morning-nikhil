"use client";

import { motion } from "framer-motion";
import type { Screen } from "@/data/screens";

const SAME_SET_PAIRS = new Set([
  "Control Room→Credits",
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

  const useDissolve =
    previousShow !== undefined &&
    SAME_SET_PAIRS.has(transitionKey(previousShow, screen.show));

  return (
    <>
      {isShowChange && !useDissolve && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-50"
          initial={{ opacity: 0.7 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
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
          transition={{ duration: 0.8, ease: [0.45, 0.05, 0.55, 0.95] }}
        />
      )}
      {children}
    </>
  );
}
