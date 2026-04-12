"use client";

import { motion } from "framer-motion";
import { EASE_BREATHE } from "@/lib/animations";

interface MoteConfig {
  startX: number;
  startY: number;
  size: number;
  delay: number;
}

const STANDARD_MOTES: MoteConfig[] = [
  { startX: -5, startY: 15, size: 2, delay: 0 },
  { startX: -8, startY: 30, size: 1.5, delay: 4 },
  { startX: -3, startY: 22, size: 2.5, delay: 8 },
];

const CLOSING_MOTES: MoteConfig[] = [
  { startX: -5, startY: 12, size: 3, delay: 0 },
  { startX: -8, startY: 25, size: 3.5, delay: 3 },
  { startX: -3, startY: 18, size: 4, delay: 6 },
  { startX: -6, startY: 35, size: 3, delay: 9 },
  { startX: -2, startY: 28, size: 3.5, delay: 12 },
];

function Mote({ startX, startY, size, delay }: MoteConfig) {
  return (
    <motion.div
      className="absolute rounded-full bg-white/20 pointer-events-none"
      style={{
        width: size,
        height: size,
        left: `${startX}%`,
        top: `${startY}%`,
      }}
      animate={{ x: [0, 120], opacity: [0.15, 0.35] }}
      transition={{
        x: { duration: 15, ease: "linear", repeat: Infinity, delay },
        opacity: {
          duration: 7.5,
          ease: EASE_BREATHE,
          repeat: Infinity,
          repeatType: "mirror",
          delay,
        },
      }}
    />
  );
}

export function DustMotes({
  variant = "standard",
}: {
  variant?: "standard" | "closing";
}) {
  const motes = variant === "closing" ? CLOSING_MOTES : STANDARD_MOTES;
  return (
    <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
      {motes.map((m, i) => (
        <Mote key={i} {...m} />
      ))}
    </div>
  );
}
