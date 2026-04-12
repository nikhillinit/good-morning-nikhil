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
          className="absolute bottom-24 left-0 right-0 px-6"
          role="status"
          aria-live="polite"
        >
          <div className="mx-auto max-w-2xl rounded-lg bg-black/80 px-6 py-4 backdrop-blur-sm">
            <p
              className={`text-sm leading-relaxed ${
                caption.speaker === "steve"
                  ? "text-yellow-300"
                  : caption.speaker === "jeff"
                    ? "text-blue-300"
                    : "text-white"
              } ${caption.variant === "whisper" ? "italic opacity-80" : ""} ${
                caption.variant === "hero" ? "text-base font-semibold" : ""
              }`}
            >
              {caption.speaker && (
                <span className="mr-1 font-bold uppercase">
                  {caption.speaker}:
                </span>
              )}
              {caption.text}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
