"use client";

import { motion } from "framer-motion";
import { EASE_BREATHE } from "@/lib/animations";

export function SpotlightPulse() {
  return (
    <motion.div
      className="pointer-events-none absolute z-[5]"
      style={{
        left: "42%",
        top: "30%",
        width: "16%",
        height: "25%",
        background:
          "radial-gradient(ellipse, rgba(255,252,240,0.12) 0%, transparent 70%)",
        borderRadius: "50%",
      }}
      animate={{ opacity: [0.92, 1.0] }}
      transition={{
        duration: 8,
        ease: EASE_BREATHE,
        repeat: Infinity,
        repeatType: "mirror",
      }}
    />
  );
}
