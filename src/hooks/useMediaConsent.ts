"use client";

import { useCallback, useState } from "react";

const LS_KEY = "gmn-media-consent";

function readConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(LS_KEY) === "1";
  } catch {
    return false;
  }
}

export function useMediaConsent() {
  const [hasConsented, setHasConsented] = useState(readConsent);

  const grantConsent = useCallback(() => {
    setHasConsented(true);
    try {
      localStorage.setItem(LS_KEY, "1");
    } catch {
      // Silently fail in private browsing
    }
  }, []);

  return { hasConsented, grantConsent };
}
