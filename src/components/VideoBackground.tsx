"use client";

import { useVideoBackground } from "@/hooks/useVideoBackground";

interface VideoBackgroundProps {
  videoSrc: string | undefined;
  poster: string;
  showUI: boolean;
  behavior?: "loop" | "pause";
  mediaPosition?: string;
}

export function VideoBackground({ videoSrc, poster, showUI, behavior, mediaPosition }: VideoBackgroundProps) {
  const { videoRef, shouldSkip } = useVideoBackground({ videoSrc, showUI, behavior });

  if (!videoSrc || shouldSkip) return null;

  return (
    <video
      ref={videoRef}
      muted
      autoPlay
      playsInline
      poster={poster}
      preload="metadata"
      className="absolute inset-0 h-full w-full object-cover"
      style={{ objectPosition: mediaPosition || "center 20%" }}
      aria-hidden="true"
    />
  );
}
