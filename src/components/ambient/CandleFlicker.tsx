"use client";

import { motion } from "framer-motion";
import { EASE_ORGANIC } from "@/lib/animations";

function SconceGlow({ x, y, delay }: { x: string; y: string; delay: number }) {
  return (
    <motion.div
      className="pointer-events-none absolute z-[5]"
      style={{
        left: x,
        top: y,
        width: "8%",
        height: "12%",
        background:
          "radial-gradient(ellipse, rgba(255,235,200,0.12) 0%, transparent 70%)",
        borderRadius: "50%",
      }}
      animate={{ opacity: [0.85, 1.0] }}
      transition={{
        duration: 3,
        ease: EASE_ORGANIC,
        repeat: Infinity,
        repeatType: "mirror",
        delay,
      }}
    />
  );
}

export function CandleFlicker() {
  return (
    <>
      <SconceGlow x="12%" y="15%" delay={0} />
      <SconceGlow x="78%" y="15%" delay={1.4} />
    </>
  );
}
