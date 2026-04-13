"use client";

/**
 * useKeyboard — virtual keyboard detection for mobile
 */

import { useEffect } from "react";

export function useKeyboard(): void {
  useEffect(() => {
    if (typeof window === "undefined" || !("ontouchstart" in window)) return;

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        document.body.classList.add("keyboard-active");

        // Scroll the focused element into view after keyboard animates
        setTimeout(() => {
          (e.target as HTMLElement).scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 300);
      }
    };

    const handleFocusOut = () => {
      setTimeout(() => {
        const activeEl = document.activeElement as HTMLElement | null;
        if (
          activeEl?.tagName !== "INPUT" &&
          activeEl?.tagName !== "TEXTAREA" &&
          !activeEl?.isContentEditable
        ) {
          document.body.classList.remove("keyboard-active");
        }
      }, 100);
    };

    const handleResize = () => {
      if (window.visualViewport) {
        const threshold = window.matchMedia("(orientation: landscape)").matches
          ? 0.6
          : 0.75;
        const keyboardVisible =
          window.visualViewport.height < window.innerHeight * threshold;
        document.body.classList.toggle("keyboard-active", keyboardVisible);
      }
    };

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize);
    }

    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleResize);
      }
      document.body.classList.remove("keyboard-active");
    };
  }, []);
}
