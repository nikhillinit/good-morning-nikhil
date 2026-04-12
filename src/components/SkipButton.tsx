"use client";

import { motion, AnimatePresence } from "framer-motion";
import { fadeIn } from "@/lib/animations";

interface SkipButtonProps {
  visible: boolean;
  onClick: () => void;
}

export function SkipButton({ visible, onClick }: SkipButtonProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          {...fadeIn}
          whileHover={{ opacity: 1, backgroundColor: "rgba(255,255,255,0.2)" }}
          onClick={onClick}
          className="absolute right-4 top-4 rounded-full bg-white/10 px-4 py-2 text-sm uppercase tracking-wider text-white backdrop-blur-sm"
        >
          Skip →
        </motion.button>
      )}
    </AnimatePresence>
  );
}
