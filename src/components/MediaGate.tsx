"use client";

import { motion } from "framer-motion";

interface MediaGateProps {
  hasConsented: boolean;
  onConsent: () => void;
}

export function MediaGate({ hasConsented, onConsent }: MediaGateProps) {
  if (hasConsented) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="media-gate-card space-y-6"
      >
        <h1 className="font-display text-3xl text-yellow-500">
          Good Morning, Nikhil
        </h1>
        <p className="max-w-sm text-sm text-zinc-400">
          This episode has sound. Put your headphones in or turn your volume up.
        </p>
        <p className="orientation-hint-landscape text-xs uppercase tracking-[0.18em] text-zinc-500">
          Landscape works best. The default flow stays tap-and-voice only.
        </p>
        <button
          onClick={onConsent}
          className="font-display rounded-lg bg-yellow-500 px-10 py-5 text-2xl text-black hover:bg-yellow-400 glow-accent"
          aria-label="Start Episode"
        >
          Start Episode
        </button>
      </motion.div>
    </div>
  );
}
