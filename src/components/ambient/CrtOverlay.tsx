"use client";

import { motion } from "framer-motion";
import { EASE_ORGANIC } from "@/lib/animations";

interface CrtOverlayProps {
  active: boolean;
}

export function CrtOverlay({ active }: CrtOverlayProps) {
  if (!active) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[7] overflow-hidden"
      data-testid="crt-overlay"
      aria-hidden="true"
    >
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "repeating-linear-gradient(to bottom, rgba(255,255,255,0.10) 0 1px, rgba(0,0,0,0) 1px 4px)",
          mixBlendMode: "screen",
        }}
        animate={{ opacity: [0.16, 0.28, 0.18], y: [0, 2, 0] }}
        transition={{
          duration: 2.6,
          ease: EASE_ORGANIC,
          repeat: Infinity,
          repeatType: "mirror",
        }}
      />
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 45%, rgba(0,0,0,0.18) 100%)",
        }}
        animate={{ opacity: [0.3, 0.5, 0.34] }}
        transition={{
          duration: 1.8,
          ease: EASE_ORGANIC,
          repeat: Infinity,
          repeatType: "mirror",
        }}
      />
    </div>
  );
}
