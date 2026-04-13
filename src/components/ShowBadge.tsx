"use client";

import { motion } from "framer-motion";
import { badgeEnter } from "@/lib/animations";

interface ShowBadgeProps {
  emoji: string;
  name: string;
  screenIndex?: number;
  totalScreens?: number;
}

export function ShowBadge({ emoji, name, screenIndex, totalScreens }: ShowBadgeProps) {
  return (
    <motion.div
      {...badgeEnter}
      className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-[var(--nav-control)] px-4 py-2 backdrop-blur-sm"
    >
      <span className="text-xl" aria-hidden="true">{emoji}</span>
      <h2
        className="font-display text-sm text-white"
        style={{ textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}
      >
        {name}
      </h2>
      {typeof screenIndex === "number" && typeof totalScreens === "number" && (
        <>
          <span className="mx-1 h-3 w-px bg-white/30" aria-hidden="true" />
          <span className="text-xs text-white/60">{screenIndex + 1}/{totalScreens}</span>
        </>
      )}
    </motion.div>
  );
}
