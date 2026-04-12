"use client";

import { useEffect, useRef, useState } from "react";

interface UseVideoBackgroundOptions {
  videoSrc: string | undefined;
  showUI: boolean;
}

export function useVideoBackground({ videoSrc, showUI }: UseVideoBackgroundOptions) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isVideoActive, setIsVideoActive] = useState(false);

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (!videoSrc || prefersReducedMotion || !videoRef.current) return;

    const video = videoRef.current;
    video.src = videoSrc;
    video.load();

    video.play().then(() => {
      setIsVideoActive(true);
    }).catch(() => {
      setIsVideoActive(false);
    });

    return () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
      setIsVideoActive(false);
    };
  }, [videoSrc, prefersReducedMotion]);

  useEffect(() => {
    if (!videoRef.current || !isVideoActive) return;
    if (showUI) {
      videoRef.current.pause();
    }
  }, [showUI, isVideoActive]);

  const shouldSkip =
    !videoSrc ||
    prefersReducedMotion ||
    (typeof navigator !== "undefined" &&
      "connection" in navigator &&
      (navigator as { connection?: { saveData?: boolean } }).connection?.saveData === true);

  return {
    videoRef,
    isVideoActive: isVideoActive && !shouldSkip,
    shouldSkip,
  };
}
