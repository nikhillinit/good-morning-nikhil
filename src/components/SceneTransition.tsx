"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import type { Screen } from "@/data/screens";

/** Screens sharing the same physical set — dissolve instead of static */
const SAME_SET_PAIRS = new Set([
  "Control Room→Credits",  // same Feud set, just emptied
]);

function transitionKey(prev: string, next: string): string {
  return `${prev}→${next}`;
}

interface Props {
  screen: Screen;
  children: React.ReactNode;
}

export function SceneTransition({ screen, children }: Props) {
  const [showStatic, setShowStatic] = useState(false);
  const [showDissolve, setShowDissolve] = useState(false);
  const prevShowRef = useRef(screen.show);

  useEffect(() => {
    const prevShow = prevShowRef.current;
    const isShowChange = prevShow !== screen.show;
    prevShowRef.current = screen.show;

    if (!isShowChange) return;

    // Same-set transitions get a soft dissolve instead of channel static
    if (SAME_SET_PAIRS.has(transitionKey(prevShow, screen.show))) {
      setShowDissolve(true);
      const timer = setTimeout(() => setShowDissolve(false), 800);
      return () => clearTimeout(timer);
    }

    setShowStatic(true);
    const timer = setTimeout(() => setShowStatic(false), 300);
    return () => clearTimeout(timer);
  }, [screen.id, screen.show]);

  return (
    <>
      <AnimatePresence>
        {showStatic && (
          <motion.div
            key="channel-static"
            className="fixed inset-0 z-50 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{
              backgroundImage: "url(/textures/tv-static.png)",
              backgroundSize: "cover",
              mixBlendMode: "screen",
            }}
          />
        )}
        {showDissolve && (
          <motion.div
            key="dissolve"
            className="fixed inset-0 z-50 pointer-events-none bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.45, 0.05, 0.55, 0.95] }}
          />
        )}
      </AnimatePresence>
      {children}
    </>
  );
}
