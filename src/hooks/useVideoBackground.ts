"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

interface UseVideoBackgroundOptions {
  videoSrc: string | undefined;
  showUI: boolean;
  behavior?: "loop" | "pause";
}

type SaveDataConnection = EventTarget & {
  saveData?: boolean;
};
type LegacyMediaQueryList = MediaQueryList & {
  addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
  removeListener?: (listener: (event: MediaQueryListEvent) => void) => void;
};

function getReducedMotionSnapshot(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function subscribeToReducedMotion(onStoreChange: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }

  const mediaQuery = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ) as LegacyMediaQueryList;

  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", onStoreChange);
    return () => mediaQuery.removeEventListener("change", onStoreChange);
  }

  if (typeof mediaQuery.addListener === "function") {
    mediaQuery.addListener(onStoreChange);
    return () => mediaQuery.removeListener?.(onStoreChange);
  }

  return () => {};
}

function getSaveDataSnapshot(): boolean {
  if (typeof navigator === "undefined" || !("connection" in navigator)) {
    return false;
  }

  return (
    (navigator as Navigator & { connection?: SaveDataConnection }).connection
      ?.saveData === true
  );
}

function subscribeToSaveData(onStoreChange: () => void): () => void {
  if (typeof navigator === "undefined" || !("connection" in navigator)) {
    return () => {};
  }

  const connection = (navigator as Navigator & { connection?: SaveDataConnection })
    .connection;

  if (!connection?.addEventListener) {
    return () => {};
  }

  connection.addEventListener("change", onStoreChange);
  return () => connection.removeEventListener("change", onStoreChange);
}

export function useVideoBackground({
  videoSrc,
  showUI,
  behavior = "pause",
}: UseVideoBackgroundOptions) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const prefersReducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    () => false,
  );
  const saveData = useSyncExternalStore(
    subscribeToSaveData,
    getSaveDataSnapshot,
    () => false,
  );

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
