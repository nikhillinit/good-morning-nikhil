/**
 * Shared Framer Motion variants for Good Morning, Nikhil
 */

import type { Variants, Transition } from "framer-motion";

type Ease = "easeIn" | "easeOut" | "easeInOut";
const EASE_OUT: Ease = "easeOut";
const EASE_IN: Ease = "easeIn";

// ── Fade ────────────────────────────────────────────────────────

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease: EASE_OUT } },
};

export const fadeOut: Variants = {
  visible: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0.2, ease: EASE_IN } },
};

// ── Slide ───────────────────────────────────────────────────────

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: EASE_OUT },
  },
};

export const slideDown: Variants = {
  hidden: { opacity: 0, y: -40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: EASE_OUT },
  },
};

// ── Card select / deselect ──────────────────────────────────────

export const cardSelect: Variants = {
  idle: { scale: 1 },
  selected: {
    scale: [1, 1.04, 1.0],
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 15,
      mass: 0.8,
    },
  },
};

export const cardDeselect: Variants = {
  selected: { scale: 1.0 },
  idle: {
    scale: [1.0, 0.97, 1.0],
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
    },
  },
};

// ── Eliminate card (Bachelor screen) ────────────────────────────

export const eliminateCard: Variants = {
  visible: { opacity: 1, x: 0 },
  exit: {
    opacity: 0,
    x: -200,
    transition: { duration: 0.4, ease: EASE_IN },
  },
};

// ── Stagger children container ──────────────────────────────────

export const staggerChildren: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05 },
  },
};

// ── UI reveal (generic entrance) ────────────────────────────────

export const uiReveal: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: EASE_OUT },
  },
};

// ── Interactive element state transitions ───────────────────────

export const interactiveScale: Variants = {
  idle: { scale: 1 },
  hover: { scale: 1.02, transition: { duration: 0.1, ease: EASE_OUT } },
  tap: { scale: 0.98, transition: { duration: 0.05, ease: EASE_IN } },
  selected: {
    scale: 1.0,
    transition: { duration: 0.2, ease: EASE_OUT },
  },
};

// ── Shared spring config ────────────────────────────────────────

export const gentleSpring: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 25,
  mass: 0.8,
};
