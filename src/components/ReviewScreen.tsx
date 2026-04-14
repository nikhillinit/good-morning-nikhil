"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { uiReveal } from "@/lib/animations";
import { PrimaryButton, SecondaryButton } from "@/components/primitives";
import {
  isAudioResponseValue,
  isTextResponseValue,
} from "@/lib/voice-response";

interface ReviewScreenProps {
  responses: Record<string, unknown>;
  screenLabels: Record<string, string>;
  reviewableScreenCount: number;
  anonymous: boolean;
  onSubmit: () => void;
  onBack: () => void;
  onToggleAnonymous: () => void;
}

function formatReviewValue(value: unknown): string {
  if (isTextResponseValue(value)) {
    return value.text;
  }

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => String(entry ?? "")).join(", ");
  }

  if (value && typeof value === "object") {
    if ("relationship" in value) {
      return String((value as { relationship: unknown }).relationship ?? "");
    }

    if ("choice" in value) {
      const choice = String((value as { choice: unknown }).choice ?? "");
      return choice === "in" ? "I'm in" : choice === "out" ? "I'm out" : choice;
    }
  }

  return JSON.stringify(value);
}

export function ReviewScreen({
  responses,
  screenLabels,
  reviewableScreenCount,
  anonymous,
  onSubmit,
  onBack,
  onToggleAnonymous,
}: ReviewScreenProps) {
  const [expanded, setExpanded] = useState(false);
  const entries = Object.entries(responses);
  const answered = entries.filter(([, v]) => v !== undefined && v !== null);
  const skipped = Math.max(0, reviewableScreenCount - answered.length);

  return (
    <motion.div
      {...uiReveal}
      className="flex h-screen-safe flex-col items-center justify-center bg-black px-6 py-12"
    >
      <main className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-display text-3xl text-accent">
            Ready to wrap?
          </h1>
          <p className="mt-2 text-body text-muted">
            {answered.length} answers recorded
            {skipped > 0 && ` · ${skipped} skipped`}
          </p>
        </div>

        {/* Anonymous toggle */}
        <div className="flex items-center justify-between rounded-lg bg-surface px-4 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">Anonymous</p>
            <p className="text-caption text-muted">
              {anonymous ? "Nikhil won't see your name" : "Your name will be visible"}
            </p>
          </div>
          <button
            onClick={onToggleAnonymous}
            role="switch"
            aria-checked={anonymous}
            aria-label="Toggle anonymous submission"
            className="relative flex items-center p-3 -m-3"
          >
            <span
              className={`block h-6 w-11 rounded-full transition-colors relative ${
                anonymous ? "bg-accent" : "bg-surface-hover"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  anonymous ? "translate-x-5" : ""
                }`}
              />
            </span>
          </button>
        </div>

        {/* Expandable answer summary */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full min-h-[48px] rounded-lg border border-surface-hover px-4 py-3 text-left text-sm text-muted hover:border-muted"
        >
          {expanded ? "Hide answers ▲" : "Review your answers ▼"}
        </button>

        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="max-h-64 space-y-2 overflow-y-auto rounded-lg bg-surface/50 p-3"
          >
            {answered.map(([screenId, value]) => (
              <div key={screenId} className="border-b border-surface-hover pb-2 last:border-0">
                <p className="text-caption text-muted">{screenLabels[screenId] ?? screenId}</p>
                {isAudioResponseValue(value) && value.mediaUrl ? (
                  <audio controls preload="metadata" className="mt-2 w-full" src={value.mediaUrl}>
                    Your browser does not support audio playback.
                  </audio>
                ) : (
                  <p className="text-body text-foreground">
                    {formatReviewValue(value)}
                  </p>
                )}
              </div>
            ))}
          </motion.div>
        )}

        <div className="space-y-3">
          <PrimaryButton
            onClick={onSubmit}
            className="py-4 text-xl"
          >
            Submit Episode
          </PrimaryButton>
          <SecondaryButton
            onClick={onBack}
            className="border-none bg-surface/30 hover:bg-surface/50"
          >
            ← Go back and change something
          </SecondaryButton>
        </div>
      </main>
    </motion.div>
  );
}
