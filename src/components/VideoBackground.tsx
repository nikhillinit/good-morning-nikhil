"use client";

import { useVideoBackground } from "@/hooks/useVideoBackground";

interface VideoBackgroundProps {
  videoSrc: string | undefined;
  poster: string;
  showUI: boolean;
}

export function VideoBackground({ videoSrc, poster, showUI }: VideoBackgroundProps) {
  const { videoRef, shouldSkip } = useVideoBackground({ videoSrc, showUI });

  if (!videoSrc || shouldSkip) return null;

  return (
    <video
      ref={videoRef}
      muted
      autoPlay
      playsInline
      poster={poster}
      preload="metadata"
      className="absolute inset-0 h-full w-full object-cover portrait:object-[center_20%]"
      aria-hidden="true"
    />
  );
}
