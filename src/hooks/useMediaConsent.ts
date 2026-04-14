"use client";

import { useCallback, useSyncExternalStore } from "react";

const LS_KEY = "gmn-media-consent";
const consentListeners = new Set<() => void>();

function readConsentSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(LS_KEY) === "1";
  } catch {
    return false;
  }
}

function subscribeToConsent(callback: () => void) {
  consentListeners.add(callback);

  if (typeof window === "undefined") {
    return () => {
      consentListeners.delete(callback);
    };
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === LS_KEY) {
      callback();
    }
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    consentListeners.delete(callback);
    window.removeEventListener("storage", handleStorage);
  };
}

function emitConsentChange() {
  for (const listener of consentListeners) {
    listener();
  }
}

function subscribeToHydration() {
  return () => {};
}

export function useMediaConsent() {
  const hasConsented = useSyncExternalStore(
    subscribeToConsent,
    readConsentSnapshot,
    () => false,
  );
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );

  const grantConsent = useCallback(() => {
    try {
      localStorage.setItem(LS_KEY, "1");
    } catch {
      // Silently fail in private browsing
    }

    emitConsentChange();
  }, []);

  return { hasConsented, grantConsent, hydrated };
}
