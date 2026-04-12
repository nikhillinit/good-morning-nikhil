"use client";

import { motion } from "framer-motion";
import { badgeEnter } from "@/lib/animations";

interface ShowBadgeProps {
  emoji: string;
  name: string;
}

export function ShowBadge({ emoji, name }: ShowBadgeProps) {
  return (
    <motion.div
      {...badgeEnter}
      className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 backdrop-blur-sm"
    >
      <span className="text-xl" aria-hidden="true">{emoji}</span>
      <h2 className="font-display text-sm text-white">
        {name}
      </h2>
    </motion.div>
  );
}
