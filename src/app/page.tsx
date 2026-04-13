"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { screens } from "@/data/screens";
import { useResponses } from "@/hooks/useResponses";
import { ScreenPlayer } from "@/components/ScreenPlayer";
import { SceneTransition } from "@/components/SceneTransition";
import { ReviewScreen } from "@/components/ReviewScreen";
import { SessionProvider, useSession } from "@/hooks/useSession";
import { useMediaConsent } from "@/hooks/useMediaConsent";
import { MediaGate } from "@/components/MediaGate";
import {
  getCompletionStatusForValue,
  getNextScreen,
  getResumeState,
  getScreenIndex,
  getTotalScreens,
} from "@/lib/flow";
import { getAnswers, replaceAnswersForScreen } from "@/lib/answers";
import { updateSession, submitSession } from "@/lib/session";
import { flushVoiceQueue } from "@/lib/voice-queue";
import {
  completeScreenProgress,
  getScreenProgress,
  trackScreenEntry,
} from "@/lib/screen-progress";
import {
  getReviewableScreenCount,
  hydrateAllResponses,
  serializeScreenResponse,
} from "@/lib/response-contract";
import { persistScreenResponse } from "@/lib/screen-response-persistence";
import { AnswerType, CompletionStatus, InputMethod } from "@/types";

const HAS_SUPABASE =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const screenLabels = Object.fromEntries(
  screens.map((screen) => [screen.id, screen.show]),
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
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [bootstrapVersion, setBootstrapVersion] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pendingCompletion, setPendingCompletion] = useState<{
    screenId: string;
    value: unknown;
  } | null>(null);
  const { setResponse, hydrateResponses, getResponse, getAllResponses } = useResponses();
  const { session, createNewSession, loading } = useSession();
  const entryStartedAtRef = useRef(0);
  const { hasConsented, grantConsent } = useMediaConsent();

  const currentIndex = getScreenIndex(currentScreenId, screens);
  const activeIndex = currentIndex === -1 ? 0 : currentIndex;
  const currentScreen = screens[activeIndex];
  const previousScreenId = history.length > 1 ? history[history.length - 2] : undefined;
  const previousScreen = previousScreenId
    ? screens.find((screen) => screen.id === previousScreenId)
    : undefined;
  const total = getTotalScreens(screens);
  const reviewableScreenCount = getReviewableScreenCount(screens);

  useEffect(() => {
    if (!HAS_SUPABASE) return;
    if (loading) return;

    let cancelled = false;

    async function bootstrapSession() {
      setBootstrapError(null);

      try {
        let activeSession = session ?? (await createNewSession());
        if (cancelled) return;

        if (activeSession.completion_status === CompletionStatus.COMPLETED) {
          setSubmitted(true);
          setSessionBootstrapped(true);
          return;
        }

        const [progressRows, answers] = await Promise.all([
          getScreenProgress(activeSession.id),
          getAnswers(activeSession.id),
        ]);
        if (cancelled) return;

        if (progressRows.length > 0 && !activeSession.started_from_resume) {
          await updateSession(activeSession.id, { started_from_resume: true });
          activeSession = { ...activeSession, started_from_resume: true };
        }

        setAnonymous(activeSession.anonymous ?? false);
        hydrateResponses(hydrateAllResponses(screens, answers, activeSession));

        const resumeState = getResumeState(progressRows, screens);
        setCurrentScreenId(resumeState.currentScreenId);
        setHistory(resumeState.history);
        setShowReview(resumeState.showReview);

        if (
          progressRows.length > 0 &&
          !resumeState.showReview &&
          resumeState.currentScreenId !== screens[0].id
        ) {
          const resumeScreen = screens.find(
            (screen) => screen.id === resumeState.currentScreenId,
          );
          setResumedFrom(resumeScreen?.show ?? null);
        } else {
          setResumedFrom(null);
        }

        setSessionBootstrapped(true);
      } catch (error) {
        console.error("Failed to bootstrap survey session", error);
        if (!cancelled) {
          setBootstrapError("Couldn’t load the survey. Please try again.");
          setSessionBootstrapped(false);
        }
      }
    }

    void bootstrapSession();

    return () => {
      cancelled = true;
    };
  }, [bootstrapVersion, createNewSession, hydrateResponses, loading, session]);

  // Flush any voice uploads that were queued during a previous offline session.
  // Runs once on mount and again whenever the network comes back online.
  useEffect(() => {
    if (typeof window === "undefined" || !HAS_SUPABASE) return;

    async function flush() {
      await flushVoiceQueue(async (sessionId, screenId, publicUrl) => {
        await replaceAnswersForScreen(sessionId, screenId, [
          {
            screen_key: screenId,
            prompt_key: `${screenId}.response`,
            answer_type: AnswerType.LONG_TEXT,
            media_url: publicUrl,
            input_method: InputMethod.AUDIO,
            order_index: 0,
          },
        ]);
      });
    }

    void flush();

    const handleOnline = () => void flush();
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  useEffect(() => {
    if (
      !HAS_SUPABASE ||
      !session?.id ||
      !sessionBootstrapped ||
      submitted ||
      showReview
    ) {
      return;
    }

    entryStartedAtRef.current = Date.now();
    void trackScreenEntry(session.id, currentScreenId, activeIndex).catch((error) => {
      console.error("Failed to track screen entry", error);
      setSaveError("Couldn’t sync your progress just yet.");
    });
  }, [
    activeIndex,
    currentScreenId,
    session?.id,
    sessionBootstrapped,
    showReview,
    submitted,
  ]);

  const advanceToNextStep = useCallback((nextId: string | null) => {
    setSaveError(null);
    setPendingCompletion(null);

    if (nextId) {
      setCurrentScreenId(nextId);
      setHistory((prev) => [...prev, nextId]);
      return;
    }

    setShowReview(true);
  }, []);

  const handleBack = useCallback(() => {
    if (history.length <= 1) return;
    const nextHistory = history.slice(0, -1);
    setHistory(nextHistory);
    setCurrentScreenId(nextHistory[nextHistory.length - 1]);
    setShowReview(false);
    setSaveError(null);
  }, [history]);

  const handleToggleAnonymous = useCallback(() => {
    setAnonymous((prev) => {
      const next = !prev;
      if (session?.id) {
        void updateSession(session.id, { anonymous: next }).catch((error) => {
          console.error("Failed to update anonymous preference", error);
          setSaveError("Couldn’t update your anonymity setting.");
        });
      }
      return next;
    });
  }, [session]);

  const persistAndAdvance = useCallback(
    async (value: unknown) => {
      const nextId = getNextScreen(currentScreenId, screens);
      const timeSpentMs = Math.max(0, Date.now() - entryStartedAtRef.current);
      const completionStatus = getCompletionStatusForValue(currentScreen, value);

      setSaveError(null);
      setPendingCompletion({
        screenId: currentScreenId,
        value,
      });

      try {
        let serialized = serializeScreenResponse(currentScreen, value);

        if (session?.id) {
          serialized = await persistScreenResponse(session.id, currentScreen, value);
          await Promise.all([
            completeScreenProgress(session.id, currentScreenId, activeIndex, {
              status: completionStatus,
              timeSpentMs,
            }),
            updateSession(session.id, {
              last_completed_screen_key: currentScreenId,
              completion_status: CompletionStatus.IN_PROGRESS,
            }),
          ]);
        }

        setResponse(currentScreen.id, serialized.reviewValue);

        if (serialized.sessionPatch.anonymous !== undefined) {
          setAnonymous(Boolean(serialized.sessionPatch.anonymous));
        }

        advanceToNextStep(nextId);
      } catch (error) {
        console.error("Failed to persist survey progress", error);
        setSaveError("Couldn’t save your answer. Retry to keep going.");
      }
    },
    [
      activeIndex,
      advanceToNextStep,
      currentScreen,
      currentScreenId,
      session,
      setResponse,
    ],
  );

  const handleComplete = useCallback(
    async (value: unknown) => {
      if (!HAS_SUPABASE || !session?.id) {
        const serialized = serializeScreenResponse(currentScreen, value);
        setResponse(currentScreen.id, serialized.reviewValue);
        if (serialized.sessionPatch.anonymous !== undefined) {
          setAnonymous(Boolean(serialized.sessionPatch.anonymous));
        }
        advanceToNextStep(getNextScreen(currentScreenId, screens));
        return;
      }

      await persistAndAdvance(value);
    },
    [
      advanceToNextStep,
      currentScreen,
      currentScreenId,
      persistAndAdvance,
      session,
      setResponse,
    ],
  );

  const handleRetrySave = useCallback(async () => {
    if (!pendingCompletion || pendingCompletion.screenId !== currentScreenId) {
      return;
    }

    await persistAndAdvance(pendingCompletion.value);
  }, [currentScreenId, pendingCompletion, persistAndAdvance]);

  const handleFinalSubmit = useCallback(async () => {
    try {
      if (session?.id) {
        await submitSession(session.id);
      }
      setShowReview(false);
      setSubmitted(true);
    } catch (error) {
      console.error("Failed to submit session", error);
      setSubmitError(true);
    }
  }, [session]);

  if (!hasConsented) {
    return <MediaGate hasConsented={false} onConsent={grantConsent} />;
  }

  if (bootstrapError) {
    return (
      <div className="flex h-screen-safe flex-col items-center justify-center bg-black px-6 text-center">
        <h1 className="font-display text-3xl text-yellow-500">
          Good Morning, Nikhil
        </h1>
        <p className="mt-4 max-w-sm text-sm text-zinc-400">
          {bootstrapError}
        </p>
        <button
          onClick={() => {
            setBootstrapError(null);
            setSessionBootstrapped(false);
            setBootstrapVersion((version) => version + 1);
          }}
          className="mt-6 min-h-[48px] rounded-lg bg-yellow-500 px-8 py-3 font-bold text-black hover:bg-yellow-400 glow-accent"
        >
          Retry
        </button>
      </div>
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
      <div className="flex h-screen-safe flex-col items-center justify-center bg-black px-6 text-center">
        <h1 className="font-display text-2xl text-white">
          Couldn&apos;t submit
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Your answers are saved. Try again.
        </p>
        <button
          onClick={async () => {
            setSubmitError(false);
            try {
              if (session?.id) {
                await submitSession(session.id);
              }
              setSubmitted(true);
            } catch (error) {
              console.error("Failed to retry final submission", error);
              setSubmitError(true);
            }
          }}
          className="mt-6 min-h-[48px] rounded-lg bg-yellow-500 px-8 py-3 font-bold text-black hover:bg-yellow-400 glow-accent"
        >
          Retry
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex h-screen-safe flex-col items-center justify-center bg-black px-6 text-center">
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

  if (showReview) {
    return (
      <ReviewScreen
        responses={getAllResponses()}
        screenLabels={screenLabels}
        reviewableScreenCount={reviewableScreenCount}
        anonymous={anonymous}
        onSubmit={handleFinalSubmit}
        onBack={() => setShowReview(false)}
        onToggleAnonymous={handleToggleAnonymous}
      />
    );
  }

  const nextScreen = screens[activeIndex + 1];
  const nextScreenVideo = nextScreen?.video;

  return (
    <div className="h-screen-safe bg-black">
      {(resumedFrom || saveError) && (
        <div className="fixed left-0 right-0 top-0 z-30 safe-top">
          <div className="mx-auto flex max-w-md flex-col gap-2 px-4 pb-2 pt-3">
            {resumedFrom && (
              <div className="flex items-center justify-between rounded-lg bg-zinc-800/90 px-4 py-2 backdrop-blur-sm">
                <p className="text-xs text-zinc-300">
                  Picking up where you left off —{" "}
                  <span className="text-yellow-400">{resumedFrom}</span>
                </p>
                <button
                  onClick={() => setResumedFrom(null)}
                  className="ml-3 text-xs text-zinc-500 hover:text-zinc-300"
                  aria-label="Dismiss resume notice"
                >
                  ✕
                </button>
              </div>
            )}
            {saveError && (
              <div className="flex items-center justify-between gap-3 rounded-lg bg-red-950/90 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs text-red-100">{saveError}</p>
                {pendingCompletion?.screenId === currentScreenId && (
                  <button
                    onClick={() => void handleRetrySave()}
                    className="min-h-[48px] rounded-md bg-red-100 px-3 py-1 text-xs font-semibold text-red-950"
                  >
                    Retry
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        <SceneTransition
          key={currentScreen.id}
          screen={currentScreen}
          previousShow={previousScreen?.show}
        >
          <ScreenPlayer
            screen={currentScreen}
            nextScreenVideo={nextScreenVideo}
            initialValue={getResponse(currentScreen.id)}
            screenIndex={activeIndex}
            totalScreens={screens.length}
            onComplete={handleComplete}
            onBack={history.length > 1 ? handleBack : undefined}
          />
        </SceneTransition>
      </AnimatePresence>

      <div
        className="fixed bottom-0 left-0 right-0 h-1 bg-zinc-800 safe-bottom"
        role="progressbar"
        aria-valuenow={Math.max(0, history.length - 1)}
        aria-valuemin={0}
        aria-valuemax={total - 1}
      >
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
