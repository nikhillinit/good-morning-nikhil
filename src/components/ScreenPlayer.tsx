"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Screen } from "@/data/screens";
import { useCaptions } from "@/hooks/useCaptions";
import { screenEnter, uiReveal } from "@/lib/animations";
import { PaperShimmer } from "./ambient/PaperShimmer";
import { getAmbientLayer } from "@/lib/ambient-map";
import { Captions } from "./Captions";
import { BroadcastTimeline } from "./BroadcastTimeline";
import { SkipButton } from "./SkipButton";
import { UIInput } from "./ui-inputs";
import { MuteToggle } from "./MuteToggle";
import { QuestionPrompt } from "./QuestionPrompt";
import { VideoBackground } from "./VideoBackground";
import { CRTScreen } from "./ambient/CRTScreen";
import { TelevisionFrame } from "./ambient/TelevisionFrame";

/** Segment spotlight configurations using CSS variable tokens */
const SEGMENT_SPOTLIGHTS: Record<string, { color: string; position: string; alphaBoost?: number }> = {
  "intro": { color: "var(--segment-intro)", position: "center" },
  "gmn": { color: "var(--segment-gmn)", position: "top" },
  "feud": { color: "var(--segment-feud)", position: "center" },
  "bachelor": { color: "var(--segment-bachelor)", position: "bottom" },
  "shark": { color: "var(--segment-shark)", position: "center" },
  "maury": { color: "var(--segment-maury)", position: "center" },
  "survivor": { color: "var(--segment-survivor)", position: "top", alphaBoost: 0.1 },
  "producer": { color: "var(--segment-gmn)", position: "top" },
  "credits": { color: "var(--segment-gmn)", position: "center" },
};

const getSegmentKey = (id: string): string | null => {
  if (id.startsWith("intro-tv")) return "intro";
  if (id.startsWith("gmn-feud-kickoff") || id.startsWith("producer-notes")) return "gmn";
  if (id.startsWith("feud-")) return "feud";
  if (id.startsWith("bachelor-")) return "bachelor";
  if (id.startsWith("shark-")) return "shark";
  if (id.startsWith("maury")) return "maury";
  if (id.startsWith("survivor")) return "survivor";
  if (id.startsWith("credits") || id.startsWith("post-credits")) return "credits";
  return null;
};

const getSpotlightGradient = (id: string, hasVideo: boolean) => {
  const baseAlpha = hasVideo ? 0.6 : 0.4;
  const edgeAlpha = hasVideo ? 0.8 : 0.7;

  const segmentKey = getSegmentKey(id);
  if (!segmentKey) {
    return `radial-gradient(circle at center, transparent, rgba(0,0,0,${baseAlpha}) 50%, rgba(0,0,0,${edgeAlpha}) 100%)`;
  }

  const config = SEGMENT_SPOTLIGHTS[segmentKey];
  const boost = config.alphaBoost ?? 0;
  const shape = config.position === "center" ? "circle" : "ellipse";

  return `radial-gradient(${shape} at ${config.position}, ${config.color}, rgba(0,0,0,${baseAlpha + boost}) 60%, rgba(0,0,0,${edgeAlpha + boost}) 100%)`;
};

interface ScreenPlayerProps {
  screen: Screen;
  initialValue?: unknown;
  screenIndex?: number;
  totalScreens?: number;
  isNarrationPlaying: boolean;
  hasNarrationEnded: boolean;
  getNarrationTime: () => number;
  isNarrationMuted: boolean;
  onToggleNarrationMute: () => void;
  onSkipNarration: () => void;
  onComplete: (value: unknown) => void;
  onBack?: () => void;
}

export function ScreenPlayer({
  screen,
  initialValue,
  screenIndex,
  totalScreens,
  isNarrationPlaying,
  hasNarrationEnded,
  getNarrationTime,
  isNarrationMuted,
  onToggleNarrationMute,
  onSkipNarration,
  onComplete,
  onBack,
}: ScreenPlayerProps) {
  const [skipped, setSkipped] = useState(false);
  const [timedReveal, setTimedReveal] = useState(false);
  const { currentCaption } = useCaptions(
    screen.id,
    isNarrationPlaying ? getNarrationTime : null,
  );

  const showUI = hasNarrationEnded || skipped || timedReveal;
  const promptOverride =
    typeof screen.uiConfig?.prompt === "string" ? screen.uiConfig.prompt : undefined;
  const showContentCard =
    screen.ui !== "start-button" &&
    screen.ui !== "continue-button" &&
    screen.ui !== "submit-button" &&
    screen.id !== "intro-tv";

  const layoutClass =
    screen.uiLayout === "right"
      ? "items-end pr-4 sm:pr-12 md:pr-24"
      : screen.uiLayout === "left"
      ? "items-start pl-4 sm:pl-12 md:pl-24"
      : "items-center";

  useEffect(() => {
    if (!screen.uiRevealAt || !isNarrationPlaying) return;
    const timer = setTimeout(() => setTimedReveal(true), screen.uiRevealAt * 1000);
    return () => clearTimeout(timer);
  }, [screen.id, screen.uiRevealAt, isNarrationPlaying]);

  const handleSkip = useCallback(() => {
    onSkipNarration();
    setSkipped(true);
  }, [onSkipNarration]);

  const handleComplete = useCallback(
    (value: unknown) => {
      void onComplete(value);
    },
    [onComplete],
  );

  const handleBack = useCallback(() => {
    onBack?.();
  }, [onBack]);

  const hasVideo = !!screen.video;

  const playerContent = (
    <motion.section
      key={screen.id}
      aria-label={screen.show}
      {...screenEnter}
      className="relative flex flex-col justify-center bg-black h-full w-full"
      style={screen.bg !== "crt" ? {
        backgroundImage: `url(${screen.bg})`,
        backgroundSize: "cover",
        backgroundPosition: screen.mediaPosition || "center 20%",
      } : {}}
    >
      {screen.bg === "crt" && <CRTScreen />}

      {screen.bg !== "crt" && (
        <VideoBackground videoSrc={screen.video} poster={screen.bg} showUI={showUI} behavior={screen.videoBehavior} mediaPosition={screen.mediaPosition} />
      )}

      {screen.bg !== "crt" && !hasVideo && (
        <>
          <PaperShimmer />
          {getAmbientLayer(screen.bg)}
        </>
      )}

      {screen.bg !== "crt" && (
        <>
          <div 
            className="absolute inset-0 z-0 pointer-events-none" 
            style={{ background: getSpotlightGradient(screen.id, hasVideo) }} 
          />
          <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none" />
        </>
      )}
      <MuteToggle isMuted={isNarrationMuted} onToggle={onToggleNarrationMute} />

      <BroadcastTimeline currentPhase={screenIndex ?? 0} totalPhases={totalScreens ?? 0} />

      <main className="screen-player-main relative z-10 flex w-full flex-col px-4 h-full" style={{ perspective: "1000px" }}>
        <SkipButton visible={!showUI} onClick={handleSkip} />

        <Captions
          caption={currentCaption}
          visible={isNarrationPlaying && !hasNarrationEnded}
        />

        {onBack && (
          <button
            onClick={handleBack}
            className="absolute bottom-8 left-4 z-20 flex min-h-[48px] items-center gap-2 rounded-full border border-white/10 bg-black/70 px-4 py-2 text-sm text-white safe-bottom backdrop-blur-sm transition-colors hover:bg-black/85"
          >
            ← Back
          </button>
        )}

        <AnimatePresence>
          {showUI && (
            <motion.div
              {...uiReveal}
              data-testid="layout-wrapper"
              className={`flex w-full flex-col ${layoutClass}`}
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
                  onSubmit={handleComplete}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </motion.section>
  );

  return (
    <TelevisionFrame zoomedIn={screen.hideTvFrame === true}>
      {playerContent}
    </TelevisionFrame>
  );
}
