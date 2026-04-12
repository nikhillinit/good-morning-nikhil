"use client";

import { motion, AnimatePresence } from "framer-motion";

interface SkipButtonProps {
  visible: boolean;
  onClick: () => void;
}

export function SkipButton({ visible, onClick }: SkipButtonProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          exit={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          onClick={onClick}
          className="absolute right-4 top-4 rounded-full bg-white/10 px-4 py-2 text-xs uppercase tracking-wider text-white backdrop-blur-sm transition-colors hover:bg-white/20"
        >
          Skip →
        </motion.button>
      )}
    </AnimatePresence>
  );
}
