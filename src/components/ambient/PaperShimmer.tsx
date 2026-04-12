"use client";

import { motion } from "framer-motion";
import { EASE_BREATHE } from "@/lib/animations";

export function PaperShimmer() {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-[5] bg-repeat mix-blend-overlay"
      style={{
        backgroundImage: "url('/textures/paper-grain-tile.png')",
        backgroundSize: "256px 256px",
      }}
      animate={{ opacity: [0.03, 0.08] }}
      transition={{
        duration: 6,
        ease: EASE_BREATHE,
        repeat: Infinity,
        repeatType: "mirror",
      }}
    />
  );
}
