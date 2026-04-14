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

  return (
    <AnimatePresence mode="wait">
      {visible && resolvedPrompt && (
        <motion.div
          key="chyron"
          initial={{ opacity: 0, y: 50, rotateX: -20 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          exit={{ opacity: 0, y: 20, rotateX: 10, transition: { duration: 0.3, ease: [0.32, 0, 0.67, 0] } }} // Clean dropout exit
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} // Antigravity spring
          className="w-full max-w-2xl px-4 mb-4 relative z-50 transform-gpu"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Antigravity Glassmorphic Lower-Third Chyron */}
          <div className="relative overflow-hidden rounded-xl border border-card-border bg-screen-card backdrop-blur-xl p-4 sm:p-6 shadow-2xl">
            {/* Glass shine */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
            
            <div className="flex border-l-4 border-accent pl-4 py-1">
              <p className="text-prompt font-medium text-shadow-sm">
                {resolvedPrompt}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
