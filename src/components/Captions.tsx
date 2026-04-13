"use client";

import { motion, AnimatePresence } from "framer-motion";
import { captionSwap } from "@/lib/animations";
import type { CaptionLine } from "@/lib/captions/parser";

interface CaptionsProps {
  caption: CaptionLine | null;
  visible: boolean;
}

export function Captions({ caption, visible }: CaptionsProps) {
  return (
    <AnimatePresence mode="wait">
      {visible && caption && (
        <motion.div
          key={caption.id}
          {...captionSwap}
          className="caption-shell absolute left-0 right-0 z-20 pb-safe pb-8 pt-24 px-6 flex flex-col items-center justify-end pointer-events-none"
          role="status"
          aria-live="polite"
        >
          <div className="mx-auto max-w-4xl text-center">
            {caption.speaker && (
              <span className={`block mb-1 text-xs md:text-sm font-bold uppercase tracking-[0.2em] opacity-80 text-shadow-overlay ${
                caption.speaker === "steve" ? "text-yellow-400" :
                caption.speaker === "jeff" ? "text-blue-400" : "text-white"
              }`}>
                {caption.speaker}:
              </span>
            )}
            <p
              className={`text-shadow-overlay text-lg md:text-2xl leading-snug tracking-wide font-medium ${
                caption.variant === "whisper" ? "italic opacity-85 text-white" : "text-white"
              } ${caption.variant === "hero" ? "text-xl md:text-3xl font-bold" : ""}`}
            >
              {caption.text}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
