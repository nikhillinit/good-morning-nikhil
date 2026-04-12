import { createBrowserClient } from "@supabase/ssr";
import { getStoredSessionId } from "@/lib/session-storage";

export const SESSION_HEADER = "x-survey-session-id";

export function createClient(sessionId?: string) {
  const resolvedSessionId = sessionId ?? getStoredSessionId();

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    resolvedSessionId
      ? {
          global: {
            headers: {
              [SESSION_HEADER]: resolvedSessionId,
            },
          },
        }
      : undefined,
  );
}
