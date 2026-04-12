"use client";

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { SurveySession } from "@/types";
import {
  createSession,
  getOrResumeSession,
  updateSession as updateSessionApi,
} from "@/lib/session";

interface UseSessionReturn {
  session: SurveySession | null;
  loading: boolean;
  error: Error | null;
  createNewSession: (data?: Partial<SurveySession>) => Promise<SurveySession>;
  updateSession: (data: Partial<SurveySession>) => Promise<void>;
}

const SessionContext = createContext<UseSessionReturn | null>(null);

function useSessionController(): UseSessionReturn {
  const [session, setSession] = useState<SurveySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function resume() {
      try {
        const existing = await getOrResumeSession();
        if (!cancelled) setSession(existing);
      } catch (err) {
        if (!cancelled) setError(err as Error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    resume();
    return () => {
      cancelled = true;
    };
  }, []);

  const createNewSession = useCallback(
    async (data: Partial<SurveySession> = {}): Promise<SurveySession> => {
      setLoading(true);
      setError(null);
      try {
        const newSession = await createSession(data);
        setSession(newSession);
        return newSession;
      } catch (err) {
        const e = err as Error;
        setError(e);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const updateCurrentSession = useCallback(
    async (data: Partial<SurveySession>): Promise<void> => {
      if (!session) throw new Error("No active session");
      setError(null);
      try {
        await updateSessionApi(session.id, data);
        setSession((prev) => (prev ? { ...prev, ...data } : prev));
      } catch (err) {
        const e = err as Error;
        setError(e);
        throw e;
      }
    },
    [session],
  );

  return {
    session,
    loading,
    error,
    createNewSession,
    updateSession: updateCurrentSession,
  };
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const value = useSessionController();

  return createElement(
    SessionContext.Provider,
    { value },
    children,
  );
}

export function useSession(): UseSessionReturn {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error("useSession must be used within <SessionProvider>");
  }

  return context;
}
