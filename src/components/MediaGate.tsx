"use client";

import { motion } from "framer-motion";
import { PrimaryButton } from "@/components/primitives";

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
        <h1 className="text-display text-3xl text-accent">
          Good Morning, Nikhil
        </h1>
        <p className="max-w-sm text-body">
          This episode has sound. Put your headphones in or turn your volume up.
        </p>
        <p className="orientation-hint-landscape text-caption">
          Landscape works best. The default flow stays tap-and-voice only.
        </p>
        <PrimaryButton
          onClick={onConsent}
          className="text-display px-10 py-5 text-2xl"
          aria-label="Start Episode"
        >
          Start Episode
        </PrimaryButton>
      </motion.div>
    </div>
  );
}
