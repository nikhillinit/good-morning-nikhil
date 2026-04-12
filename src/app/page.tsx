"use client";

import { useCallback, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { screens } from "@/data/screens";
import { useResponses } from "@/hooks/useResponses";
import { ScreenPlayer } from "@/components/ScreenPlayer";
import { SessionProvider, useSession } from "@/hooks/useSession";
import { getNextScreen, getScreenIndex, getTotalScreens } from "@/lib/flow";
import { updateSession, submitSession } from "@/lib/session";

function SurveyFlow() {
  const [currentScreenId, setCurrentScreenId] = useState(screens[0].id);
  const [history, setHistory] = useState<string[]>([screens[0].id]);
  const [submitted, setSubmitted] = useState(false);
  const { setResponse, getAllResponses } = useResponses();
  const { session, createNewSession } = useSession();

  const currentIndex = getScreenIndex(currentScreenId, screens);
  const currentScreen = screens[currentIndex];
  const total = getTotalScreens(screens);

  const handleComplete = useCallback(
    async (value: unknown) => {
      setResponse(currentScreen.id, value);

      const nextId = getNextScreen(currentScreenId, screens);

      // Persist progress if session exists
      try {
        const sid = session?.id;
        if (sid) {
          await updateSession(sid, {
            last_completed_screen_key: currentScreenId,
          });
        }
      } catch {
        // Supabase not configured — continue without persistence
      }

      if (nextId) {
        setCurrentScreenId(nextId);
        setHistory((h) => [...h, nextId]);
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
    [currentScreen.id, currentScreenId, session, setResponse, getAllResponses],
  );

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
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-zinc-800">
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
