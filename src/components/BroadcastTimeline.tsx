"use client";

import { motion } from "framer-motion";

interface BroadcastTimelineProps {
  currentPhase: number;
  totalPhases: number;
}

export function BroadcastTimeline({ currentPhase, totalPhases }: BroadcastTimelineProps) {
  if (totalPhases <= 0) return null;
  
  // Calculate width percentage (cap at 100)
  const safeCurrent = Math.min(Math.max(currentPhase, 0), totalPhases);
  const progressPercentage = (safeCurrent / totalPhases) * 100;

  return (
    <div className="absolute bottom-0 left-0 w-full h-1.5 z-40 bg-black/40 backdrop-blur-sm pointer-events-none overflow-hidden">
      <motion.div
        className="h-full bg-gradient-to-r from-progress-start to-progress-end shadow-[0_0_10px_var(--progress-glow)] relative"
        initial={{ width: 0 }}
        animate={{ width: `${progressPercentage}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Antigravity leading edge flare */}
        <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/50 blur-[2px]" />
      </motion.div>
    </div>
  );
}
