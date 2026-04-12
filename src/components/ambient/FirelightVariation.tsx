"use client";

import { motion } from "framer-motion";
import { EASE_ORGANIC } from "@/lib/animations";

export function FirelightVariation() {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-[5]"
      style={{
        background:
          "linear-gradient(90deg, rgba(255,240,210,0.08) 0%, rgba(255,240,210,0.03) 35%, transparent 60%)",
      }}
      animate={{ opacity: [0.75, 1.0] }}
      transition={{
        duration: 5,
        ease: EASE_ORGANIC,
        repeat: Infinity,
        repeatType: "mirror",
      }}
    />
  );
}
