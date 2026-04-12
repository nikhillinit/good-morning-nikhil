"use client";

import { motion } from "framer-motion";

interface ShowBadgeProps {
  emoji: string;
  name: string;
}

export function ShowBadge({ emoji, name }: ShowBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 backdrop-blur-sm"
    >
      <span className="text-xl">{emoji}</span>
      <span className="text-sm font-bold uppercase tracking-wider text-white">
        {name}
      </span>
    </motion.div>
  );
}
