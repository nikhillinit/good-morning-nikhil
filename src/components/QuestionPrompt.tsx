"use client";

import { motion, AnimatePresence } from "framer-motion";
import { getScreenPrompt } from "@/lib/screen-prompts";

interface QuestionPromptProps {
  screenId: string;
  visible: boolean;
}

export function QuestionPrompt({ screenId, visible }: QuestionPromptProps) {
  const prompt = getScreenPrompt(screenId);

  if (!visible || !prompt) return null;

  return (
    <AnimatePresence>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-4 max-w-md px-2 text-center text-sm italic text-zinc-400"
      >
        &ldquo;{prompt}&rdquo;
      </motion.p>
    </AnimatePresence>
  );
}
