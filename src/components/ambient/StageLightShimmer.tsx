"use client";

import { motion } from "framer-motion";
import { EASE_BREATHE } from "@/lib/animations";

export function StageLightShimmer() {
  return (
    <motion.div
      className="pointer-events-none absolute z-[5]"
      style={{
        left: "25%",
        top: "10%",
        width: "50%",
        height: "30%",
        background:
          "radial-gradient(ellipse, rgba(255,255,255,0.05) 0%, transparent 70%)",
      }}
      animate={{ opacity: [0.90, 1.0] }}
      transition={{
        duration: 10,
        ease: EASE_BREATHE,
        repeat: Infinity,
        repeatType: "mirror",
      }}
    />
  );
}
