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
import { MuteToggle } from "./MuteToggle";
import { QuestionPrompt } from "./QuestionPrompt";
import { VideoBackground } from "./VideoBackground";

interface ScreenPlayerProps {
  screen: Screen;
  nextScreenVideo?: string;
  initialValue?: unknown;
  screenIndex?: number;
  totalScreens?: number;
  onComplete: (value: unknown) => void;
  onBack?: () => void;
}

export function ScreenPlayer({
  screen,
  nextScreenVideo,
  initialValue,
  screenIndex,
  totalScreens,
  onComplete,
  onBack,
}: ScreenPlayerProps) {
  const { play, skip, isPlaying, hasEnded, getCurrentTime, isMuted, toggleMute } = useAudioPlayer();
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
  const promptOverride =
    typeof screen.uiConfig?.prompt === "string" ? screen.uiConfig.prompt : undefined;
  const showContentCard =
    screen.ui !== "start-button" &&
    screen.ui !== "continue-button" &&
    screen.ui !== "submit-button";

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

  useEffect(() => {
    if (!nextScreenVideo) return;

    if (
      typeof navigator !== "undefined" &&
      "connection" in navigator &&
      (navigator as { connection?: { saveData?: boolean } }).connection?.saveData
    ) {
      return;
    }

    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "video";
    link.type = "video/mp4";
    link.href = nextScreenVideo;
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, [nextScreenVideo]);

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
        backgroundPosition: "center 20%",
      }}
    >
      {/* Video background — progressive enhancement */}
      <VideoBackground videoSrc={screen.video} poster={screen.bg} showUI={showUI} />

      {/* Ambient motion layers */}
      <PaperShimmer />
      {getAmbientLayer(screen.bg)}

      {/* Dark overlay */}
      <div className={`absolute inset-0 ${screen.video ? "bg-black/60" : "bg-black/50"}`} />
      <MuteToggle isMuted={isMuted} onToggle={toggleMute} />

      {/* Content layer */}
      <main className="screen-player-main relative z-10 flex w-full flex-col items-center px-4">
        <ShowBadge emoji={screen.showEmoji} name={screen.show} screenIndex={screenIndex} totalScreens={totalScreens} />
        <SkipButton visible={isPlaying} onClick={handleSkip} />

        {/* Captions — shown during audio */}
        <Captions caption={currentCaption} visible={isPlaying && !showUI} />

        {onBack && (
          <button
            onClick={onBack}
            className="absolute bottom-8 left-4 z-20 flex min-h-[48px] items-center gap-2 rounded-full border border-white/10 bg-black/70 px-4 py-2 text-sm text-white safe-bottom backdrop-blur-sm transition-colors hover:bg-black/85"
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
              <div
                className={
                  showContentCard
                    ? "screen-content-card"
                    : "flex w-full max-w-md flex-col items-center"
                }
              >
                <QuestionPrompt
                  screenId={screen.id}
                  prompt={promptOverride}
                  visible={true}
                />
                <UIInput
                  key={`${screen.id}:${JSON.stringify(initialValue ?? null)}`}
                  type={screen.ui}
                  config={screen.uiConfig}
                  initialValue={initialValue}
                  onSubmit={onComplete}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </motion.section>
  );
}
