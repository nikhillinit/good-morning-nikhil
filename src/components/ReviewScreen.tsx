"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { uiReveal } from "@/lib/animations";

interface ReviewScreenProps {
  responses: Record<string, unknown>;
  screenLabels: Record<string, string>;
  anonymous: boolean;
  onSubmit: () => void;
  onBack: () => void;
  onToggleAnonymous: () => void;
}

export function ReviewScreen({
  responses,
  screenLabels,
  anonymous,
  onSubmit,
  onBack,
  onToggleAnonymous,
}: ReviewScreenProps) {
  const [expanded, setExpanded] = useState(false);
  const entries = Object.entries(responses);
  const answered = entries.filter(([, v]) => v !== undefined && v !== null);
  const skipped = entries.length - answered.length;

  return (
    <motion.div
      {...uiReveal}
      className="flex h-screen-safe flex-col items-center justify-center bg-black px-6 py-12"
    >
      <main className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="font-display text-3xl text-yellow-500">
            Ready to wrap?
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            {answered.length} answers recorded
            {skipped > 0 && ` · ${skipped} skipped`}
          </p>
        </div>

        {/* Anonymous toggle */}
        <div className="flex items-center justify-between rounded-lg bg-zinc-900 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-white">Anonymous</p>
            <p className="text-xs text-zinc-500">
              {anonymous ? "Nikhil won't see your name" : "Your name will be visible"}
            </p>
          </div>
          <button
            onClick={onToggleAnonymous}
            role="switch"
            aria-checked={anonymous}
            aria-label="Toggle anonymous submission"
            className={`relative h-6 w-11 rounded-full transition-colors ${
              anonymous ? "bg-yellow-500" : "bg-zinc-700"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                anonymous ? "translate-x-5" : ""
              }`}
            />
          </button>
        </div>

        {/* Expandable answer summary */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full rounded-lg border border-zinc-800 px-4 py-3 text-left text-sm text-zinc-400 hover:border-zinc-600"
        >
          {expanded ? "Hide answers ▲" : "Review your answers ▼"}
        </button>

        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="max-h-64 space-y-2 overflow-y-auto rounded-lg bg-zinc-900/50 p-3"
          >
            {answered.map(([screenId, value]) => (
              <div key={screenId} className="border-b border-zinc-800 pb-2 last:border-0">
                <p className="text-xs text-zinc-500">{screenLabels[screenId] ?? screenId}</p>
                <p className="text-sm text-zinc-300 truncate">
                  {typeof value === "string"
                    ? value
                    : JSON.stringify(value)}
                </p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            onClick={onSubmit}
            className="font-display w-full rounded-lg bg-yellow-500 py-4 text-xl text-black hover:bg-yellow-400 glow-accent"
          >
            Submit Episode
          </button>
          <button
            onClick={onBack}
            className="w-full rounded-lg bg-white/5 py-3 text-sm text-zinc-400 hover:bg-white/10"
          >
            ← Go back and change something
          </button>
        </div>
      </main>
    </motion.div>
  );
}
