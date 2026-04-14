/**
 * Shared Framer Motion presets for Good Morning, Nikhil
 *
 * All motion in the app flows through these presets.
 *
 * Duration scale (emotional arc aligned):
 *   MICRO    = 0.05s  – instant feedback (tap, error shake)
 *   FAST     = 0.1s   – hover, micro-interactions
 *   STANDARD = 0.2s   – captions, fade overlays
 *   UI       = 0.35s  – form reveals, button transitions
 *   SCREEN   = 0.3s   – screen-to-screen transitions
 *   DRAMATIC = 0.5s   – show changes, emotional beats
 *   FRAME    = 0.8s   – TV frame dissolves, CRT effects
 *   ZOOM     = 1.2s   – TV zoom in/out (immersion shift)
 */

import type { Variants, Transition } from "framer-motion";

// ── Duration scale (exported for CSS var sync) ────────────────────

export const DURATION = {
  MICRO: 0.05,
  FAST: 0.1,
  STANDARD: 0.2,
  UI: 0.35,
  SCREEN: 0.3,
  DRAMATIC: 0.5,
  FRAME: 0.8,
  ZOOM: 1.2,
} as const;

// ── Shared easing ─────────────────────────────────────────────────

export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

// ── Screen transitions ────────────────────────────────────────────

/** Full-screen fade for ScreenPlayer wrapper */
export const screenEnter = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: DURATION.SCREEN, ease: EASE_OUT },
};

// ── UI reveals (form inputs, buttons after audio) ─────────────────

/** Standard entrance for UI input groups */
export const uiReveal = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: DURATION.UI, ease: EASE_OUT },
};

// ── Captions ──────────────────────────────────────────────────────

/** Caption text swap */
export const captionSwap = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: { duration: DURATION.STANDARD, ease: EASE_OUT },
};

// ── Badge / chip entrance ──────────────────────────────────────────

export const badgeEnter = {
  initial: { opacity: 0, scale: 0.85 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: DURATION.SCREEN, ease: EASE_OUT },
};

// ── Fade only (used for skip button, overlays) ─────────────────────

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 0.8 },
  exit: { opacity: 0 },
  transition: { duration: DURATION.STANDARD, ease: EASE_OUT },
};

// ── Physical Error Shake ──────────────────────────────────────────

export const errorShake = {
  initial: { x: 0 },
  animate: { x: [0, -8, 8, -6, 6, 0] },
  transition: { duration: DURATION.DRAMATIC - 0.1, ease: "easeInOut" }
};

// ── Stagger children container ─────────────────────────────────────

export const staggerChildren: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05 },
  },
};

// ── Interactive scale (hover/tap) ──────────────────────────────────

export const interactiveScale: Variants = {
  idle: { scale: 1 },
  hover: { scale: 1.02, transition: { duration: 0.1 } },
  tap: { scale: 0.98, transition: { duration: 0.05 } },
};

// ── Spring config ──────────────────────────────────────────────────

export const gentleSpring: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 25,
  mass: 0.8,
};

// ── Ambient easing (organic loops for living-paper feel) ───────────

/** Slow inhale/exhale rhythm. Used for paper shimmer, spotlight pulse. */
export const EASE_BREATHE = [0.45, 0.05, 0.55, 0.95] as const;

/** Slight organic irregularity. Used for candle flicker, firelight. */
export const EASE_ORGANIC = [0.37, 0.0, 0.63, 1.0] as const;
