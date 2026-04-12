"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Screen } from "@/data/screens";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useCaptions } from "@/hooks/useCaptions";
import { screenEnter, uiReveal } from "@/lib/animations";
import { PaperShimmer } from "./ambient/PaperShimmer";
import { getAmbientLayer } from "@/lib/ambient-map";
import { Captions } from "./Captions";
import { ShowBadge } from "./ShowBadge";
import { SkipButton } from "./SkipButton";
import { UIInput } from "./ui-inputs";

interface ScreenPlayerProps {
  screen: Screen;
  onComplete: (value: unknown) => void;
  onBack?: () => void;
}

export function ScreenPlayer({ screen, onComplete, onBack }: ScreenPlayerProps) {
  const { play, skip, isPlaying, hasEnded, getCurrentTime } = useAudioPlayer();
  const [skipped, setSkipped] = useState(false);
  const [timedReveal, setTimedReveal] = useState(false);
  const [prevScreenId, setPrevScreenId] = useState(screen.id);
  const { currentCaption } = useCaptions(
    screen.id,
    isPlaying ? getCurrentTime : null,
  );

  // Reset on screen change (React 19: state adjustment during render)
  if (screen.id !== prevScreenId) {
    setPrevScreenId(screen.id);
    setSkipped(false);
    setTimedReveal(false);
  }

  const showUI = hasEnded || skipped || timedReveal;

  useEffect(() => {
    if (!screen.uiRevealAt || !isPlaying) return;
    const timer = setTimeout(() => setTimedReveal(true), screen.uiRevealAt * 1000);
    return () => clearTimeout(timer);
  }, [screen.id, screen.uiRevealAt, isPlaying]);

  useEffect(() => {
    const timer = setTimeout(() => {
      play(screen.audio);
    }, 300);
    return () => clearTimeout(timer);
  }, [screen.id, screen.audio, play]);

  const handleSkip = useCallback(() => {
    skip();
    setSkipped(true);
  }, [skip]);

  return (
    <motion.section
      key={screen.id}
      aria-label={screen.show}
      {...screenEnter}
      className="relative flex h-screen-safe flex-col items-center justify-center"
      style={{
        backgroundImage: `url(${screen.bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Ambient motion layers */}
      <PaperShimmer />
      {getAmbientLayer(screen.bg)}

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Content layer */}
      <main className="relative z-10 flex w-full flex-col items-center px-4">
        <ShowBadge emoji={screen.showEmoji} name={screen.show} />
        <SkipButton visible={isPlaying} onClick={handleSkip} />

        {/* Captions — shown during audio */}
        <Captions caption={currentCaption} visible={isPlaying && !showUI} />

        {onBack && (
          <button
            onClick={onBack}
            className="absolute left-4 bottom-8 safe-bottom z-20 rounded-full bg-white/10 px-4 py-2 text-sm text-white/70 backdrop-blur-sm hover:bg-white/20"
          >
            ← Back
          </button>
        )}

        {/* UI Input — revealed after audio ends or skip */}
        <AnimatePresence>
          {showUI && (
            <motion.div
              {...uiReveal}
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
      </main>
    </motion.section>
  );
}
