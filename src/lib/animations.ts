/**
 * Shared Framer Motion presets for Good Morning, Nikhil
 *
 * All motion in the app flows through these presets.
 * Duration scale: 0.2s (micro) → 0.3s (standard) → 0.5s (dramatic)
 */

import type { Variants, Transition } from "framer-motion";

// ── Shared easing ─────────────────────────────────────────────────

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const EASE_IN = [0.6, 0, 0.85, 0] as const;

// ── Screen transitions ────────────────────────────────────────────

/** Full-screen fade for ScreenPlayer wrapper */
export const screenEnter = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3, ease: EASE_OUT },
};

// ── UI reveals (form inputs, buttons after audio) ─────────────────

/** Standard entrance for UI input groups */
export const uiReveal = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: EASE_OUT },
};

// ── Captions ──────────────────────────────────────────────────────

/** Caption text swap */
export const captionSwap = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: { duration: 0.2, ease: EASE_OUT },
};

// ── Badge / chip entrance ──────────────────────────────────────────

export const badgeEnter = {
  initial: { opacity: 0, scale: 0.85 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.3, ease: EASE_OUT },
};

// ── Fade only (used for skip button, overlays) ─────────────────────

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 0.8 },
  exit: { opacity: 0 },
  transition: { duration: 0.2, ease: EASE_OUT },
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
