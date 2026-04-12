"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { screens } from "@/data/screens";
import { useResponses } from "@/hooks/useResponses";
import { ScreenPlayer } from "@/components/ScreenPlayer";
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

function SurveyFlow() {
  const [currentScreenId, setCurrentScreenId] = useState(screens[0].id);
  const [submitted, setSubmitted] = useState(false);
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

        const progressRows = await getScreenProgress(activeSession.id);
        if (cancelled) return;

        const resumeTarget = getResumeScreen(progressRows, screens);
        if (resumeTarget) {
          setCurrentScreenId(resumeTarget);
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
      } else {
        // Final screen — submit
        try {
          if (session?.id) {
            await submitSession(session.id);
          }
        } catch {
          console.log("Responses:", JSON.stringify(getAllResponses(), null, 2));
        }
        setSubmitted(true);
      }
    },
    [
      activeIndex,
      currentScreen,
      currentScreenCompletionStatus,
      currentScreenId,
      getAllResponses,
      session,
      setResponse,
    ],
  );

  if (!sessionBootstrapped) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
          Loading episode…
        </p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black text-center">
        <p className="text-4xl">🎬</p>
        <h1 className="mt-4 text-2xl font-bold text-white">
          That&apos;s a wrap.
        </h1>
        <p className="mt-2 text-zinc-400">
          Nikhil will share what everyone said once all responses are in.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <AnimatePresence mode="wait">
        <ScreenPlayer
          key={currentScreen.id}
          screen={currentScreen}
          onComplete={handleComplete}
        />
      </AnimatePresence>

      {/* Progress bar */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-zinc-800 safe-bottom">
        <div
          className="h-full bg-yellow-500 transition-all duration-500"
          style={{
            width: `${((currentIndex + 1) / total) * 100}%`,
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
