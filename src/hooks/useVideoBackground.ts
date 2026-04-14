"use client";

import { useEffect, useRef, useState } from "react";

interface UseVideoBackgroundOptions {
  videoSrc: string | undefined;
  showUI: boolean;
  behavior?: "loop" | "pause";
}

export function useVideoBackground({ videoSrc, showUI, behavior = "pause" }: UseVideoBackgroundOptions) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [saveData, setSaveData] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
      setPrefersReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    }
    if (typeof navigator !== "undefined" && "connection" in navigator) {
      setSaveData((navigator as { connection?: { saveData?: boolean } }).connection?.saveData === true);
    }
  }, []);

  useEffect(() => {
    if (!videoSrc || prefersReducedMotion || !videoRef.current) return;

    const video = videoRef.current;
    video.src = videoSrc;
    if (behavior === "loop") {
      video.loop = true;
    }
    video.load();

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        setIsVideoActive(true);
      }).catch(() => {
        setIsVideoActive(false);
      });
    }

    return () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
      setIsVideoActive(false);
    };
  }, [videoSrc, prefersReducedMotion, behavior]);

  useEffect(() => {
    if (!videoRef.current || !isVideoActive) return;
    
    // Manage behavior when UI decides to stick
    if (showUI) {
      if (behavior === "pause") {
        videoRef.current.pause();
      }
    } else {
      // Re-play if UI is hidden again (e.g. testing or scrub)
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    }
  }, [showUI, isVideoActive, behavior]);

  const shouldSkip = !videoSrc || prefersReducedMotion || saveData;

  return {
    videoRef,
    isVideoActive: isVideoActive && !shouldSkip,
    shouldSkip,
  };
}
