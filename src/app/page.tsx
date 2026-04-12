"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { screens } from "@/data/screens";
import { useResponses } from "@/hooks/useResponses";
import { ScreenPlayer } from "@/components/ScreenPlayer";
import { ReviewScreen } from "@/components/ReviewScreen";
import { SessionProvider, useSession } from "@/hooks/useSession";
import {
  getCompletionStatusForScreen,
  getNextScreen,
  getResumeScreen,
  getScreenIndex,
  getTotalScreens,
} from "@/lib/flow";
import { updateSession, submitSession } from "@/lib/session";
import {
  completeScreenProgress,
  getScreenProgress,
  trackScreenEntry,
} from "@/lib/screen-progress";
import { CompletionStatus } from "@/types";

const HAS_SUPABASE =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

/** Map screen IDs to human-readable labels for the review screen */
const screenLabels = Object.fromEntries(
  screens.map((s) => [s.id, s.show]),
);

function SurveyFlow() {
  const [currentScreenId, setCurrentScreenId] = useState(screens[0].id);
  const [history, setHistory] = useState<string[]>([screens[0].id]);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [resumedFrom, setResumedFrom] = useState<string | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [sessionBootstrapped, setSessionBootstrapped] = useState(!HAS_SUPABASE);
  const { setResponse, getAllResponses } = useResponses();
  const { session, createNewSession, loading } = useSession();
  const entryStartedAtRef = useRef(0);

  const currentIndex = getScreenIndex(currentScreenId, screens);
  const activeIndex = currentIndex === -1 ? 0 : currentIndex;
  const currentScreen = screens[activeIndex];
  const total = getTotalScreens(screens);
  const currentScreenCompletionStatus = getCompletionStatusForScreen(currentScreen);

  useEffect(() => {
    if (!HAS_SUPABASE) return;
    if (loading) return;

    let cancelled = false;

    async function bootstrapSession() {
      try {
        const activeSession = session ?? (await createNewSession());
        if (cancelled) return;

        if (activeSession.completion_status === CompletionStatus.COMPLETED) {
          setSubmitted(true);
          setSessionBootstrapped(true);
          return;
        }

        // Restore anonymous preference from session
        setAnonymous(activeSession.anonymous ?? false);

        const progressRows = await getScreenProgress(activeSession.id);
        if (cancelled) return;

        const resumeTarget = getResumeScreen(progressRows, screens);
        if (resumeTarget) {
          setCurrentScreenId(resumeTarget);
          const resumeScreen = screens.find(s => s.id === resumeTarget);
          if (resumeScreen) {
            setResumedFrom(resumeScreen.show);
          }
        } else if (progressRows.length > 0) {
          setCurrentScreenId(screens[screens.length - 1].id);
        }

        setSessionBootstrapped(true);
      } catch (error) {
        console.error("Failed to bootstrap survey session", error);
        if (!cancelled) {
          setSessionBootstrapped(true);
        }
      }
    }

    void bootstrapSession();

    return () => {
      cancelled = true;
    };
  }, [createNewSession, loading, session]);

  useEffect(() => {
    if (!HAS_SUPABASE || !session?.id || !sessionBootstrapped || submitted) return;

    entryStartedAtRef.current = Date.now();
    void trackScreenEntry(session.id, currentScreenId, activeIndex).catch((error) => {
      console.error("Failed to track screen entry", error);
    });
  }, [activeIndex, currentScreenId, session?.id, sessionBootstrapped, submitted]);

  const handleBack = useCallback(() => {
    if (history.length <= 1) return;
    const newHistory = history.slice(0, -1);
    setHistory(newHistory);
    setCurrentScreenId(newHistory[newHistory.length - 1]);
  }, [history]);

  const handleToggleAnonymous = useCallback(() => {
    setAnonymous((prev) => {
      const next = !prev;
      if (session?.id) {
        void updateSession(session.id, { anonymous: next }).catch((err) => {
          console.error("Failed to update anonymous preference", err);
        });
      }
      return next;
    });
  }, [session]);

  const handleComplete = useCallback(
    async (value: unknown) => {
      setResponse(currentScreen.id, value);

      const nextId = getNextScreen(currentScreenId, screens);
      const timeSpentMs = Math.max(0, Date.now() - entryStartedAtRef.current);

      // Persist progress if session exists
      try {
        const sid = session?.id;
        if (sid) {
          await completeScreenProgress(
            sid,
            currentScreenId,
            activeIndex,
            {
              status: currentScreenCompletionStatus,
              timeSpentMs,
            },
          );
          await updateSession(sid, {
            last_completed_screen_key: currentScreenId,
            completion_status: CompletionStatus.IN_PROGRESS,
          });
        }
      } catch (error) {
        console.error("Failed to persist survey progress", error);
      }

      if (nextId) {
        setCurrentScreenId(nextId);
        setHistory((prev) => [...prev, nextId]);
      } else {
        // Show review screen before final submit
        setShowReview(true);
      }
    },
    [
      activeIndex,
      currentScreen,
      currentScreenCompletionStatus,
      currentScreenId,
      session,
      setResponse,
    ],
  );

  const handleFinalSubmit = useCallback(async () => {
    try {
      if (session?.id) {
        await submitSession(session.id);
      }
      setSubmitted(true);
    } catch {
      setSubmitError(true);
    }
  }, [session]);

  if (showReview) {
    return (
      <ReviewScreen
        responses={getAllResponses()}
        screenLabels={screenLabels}
        anonymous={anonymous}
        onSubmit={handleFinalSubmit}
        onBack={() => setShowReview(false)}
        onToggleAnonymous={handleToggleAnonymous}
      />
    );
  }

  if (!sessionBootstrapped) {
    return (
      <div className="flex h-screen-safe flex-col items-center justify-center bg-black text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <h1 className="font-display text-3xl text-yellow-500">
            Good Morning, Nikhil
          </h1>
          <div className="flex items-center justify-center gap-2">
            <motion.span
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-sm uppercase tracking-[0.2em] text-zinc-500"
            >
              Loading episode
            </motion.span>
          </div>
        </motion.div>
      </div>
    );
  }

  if (submitError) {
    return (
      <div className="flex h-screen-safe flex-col items-center justify-center bg-black text-center px-6">
        <h1 className="font-display text-2xl text-white">
          Couldn&apos;t submit
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Your answers are saved locally. Try again.
        </p>
        <button
          onClick={async () => {
            setSubmitError(false);
            try {
              if (session?.id) {
                await submitSession(session.id);
              }
              setSubmitted(true);
            } catch {
              setSubmitError(true);
            }
          }}
          className="mt-6 rounded-lg bg-yellow-500 px-8 py-3 font-bold text-black hover:bg-yellow-400 glow-accent"
        >
          Retry
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex h-screen-safe flex-col items-center justify-center bg-black text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <h1 className="font-display text-4xl text-yellow-500">
            That&apos;s a wrap
          </h1>
          <p className="text-zinc-400">
            Nikhil will share what everyone said once all responses are in.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen-safe bg-black">
      {resumedFrom && (
        <div className="fixed top-0 left-0 right-0 z-30 safe-top">
          <div className="mx-auto max-w-md px-4 pt-3 pb-2">
            <div className="flex items-center justify-between rounded-lg bg-zinc-800/90 px-4 py-2 backdrop-blur-sm">
              <p className="text-xs text-zinc-300">
                Picking up where you left off — <span className="text-yellow-400">{resumedFrom}</span>
              </p>
              <button
                onClick={() => setResumedFrom(null)}
                className="ml-3 text-xs text-zinc-500 hover:text-zinc-300"
                aria-label="Dismiss resume notice"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
      <AnimatePresence mode="wait">
        <ScreenPlayer
          key={currentScreen.id}
          screen={currentScreen}
          onComplete={handleComplete}
          onBack={history.length > 1 ? handleBack : undefined}
        />
      </AnimatePresence>

      {/* Progress bar */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-zinc-800 safe-bottom" role="progressbar" aria-valuenow={Math.max(0, history.length - 1)} aria-valuemin={0} aria-valuemax={total - 1}>
        <div
          className="h-full bg-yellow-500 transition-all duration-500"
          style={{
            width: `${(Math.max(0, history.length - 1) / (total - 1)) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <SessionProvider>
      <SurveyFlow />
    </SessionProvider>
  );
}
