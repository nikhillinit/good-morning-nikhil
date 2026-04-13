"use client";

import { motion, AnimatePresence } from "framer-motion";
import { getScreenPrompt } from "@/lib/screen-prompts";

interface QuestionPromptProps {
  screenId: string;
  prompt?: string;
  visible: boolean;
}

export function QuestionPrompt({
  screenId,
  prompt,
  visible,
}: QuestionPromptProps) {
  const resolvedPrompt = prompt ?? getScreenPrompt(screenId);

  if (!visible || !resolvedPrompt) return null;

  return (
    <AnimatePresence>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-5 max-w-2xl px-3 text-center text-base leading-relaxed italic text-[var(--prompt)]"
      >
        &ldquo;{resolvedPrompt}&rdquo;
      </motion.p>
    </AnimatePresence>
  );
}
