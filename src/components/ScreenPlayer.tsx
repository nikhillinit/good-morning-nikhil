"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Screen } from "@/data/screens";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useCaptions } from "@/hooks/useCaptions";
import { Captions } from "./Captions";
import { ShowBadge } from "./ShowBadge";
import { SkipButton } from "./SkipButton";
import { UIInput } from "./ui-inputs";

interface ScreenPlayerProps {
  screen: Screen;
  onComplete: (value: unknown) => void;
}

export function ScreenPlayer({ screen, onComplete }: ScreenPlayerProps) {
  const { play, skip, isPlaying, hasEnded, getCurrentTime } = useAudioPlayer();
  const [showUI, setShowUI] = useState(false);
  const { currentCaption } = useCaptions(
    screen.id,
    isPlaying ? getCurrentTime : null,
  );

  useEffect(() => {
    setShowUI(false);
    // Small delay to let the transition settle
    const timer = setTimeout(() => {
      play(screen.audio, () => setShowUI(true));
    }, 300);
    return () => clearTimeout(timer);
  }, [screen.id, screen.audio, play]);

  useEffect(() => {
    if (hasEnded) setShowUI(true);
  }, [hasEnded]);

  const handleSkip = useCallback(() => {
    skip();
    setShowUI(true);
  }, [skip]);

  return (
    <motion.div
      key={screen.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="relative flex min-h-screen flex-col items-center justify-center"
      style={{
        backgroundImage: `url(${screen.bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Content layer */}
      <div className="relative z-10 flex w-full flex-col items-center px-4">
        <ShowBadge emoji={screen.showEmoji} name={screen.show} />
        <SkipButton visible={isPlaying} onClick={handleSkip} />

        {/* Captions — shown during audio */}
        <Captions caption={currentCaption} visible={isPlaying && !showUI} />

        {/* UI Input — revealed after audio ends or skip */}
        <AnimatePresence>
          {showUI && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex w-full flex-col items-center"
            >
              <UIInput
                type={screen.ui}
                config={screen.uiConfig}
                onSubmit={onComplete}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
