import { createBrowserClient } from "@supabase/ssr";
import { getStoredSessionId } from "@/lib/session-storage";
import { getSupabaseEnv } from "@/lib/supabase/config";

export const SESSION_HEADER = "x-survey-session-id";

export function createClient(sessionId?: string) {
  const resolvedSessionId = sessionId ?? getStoredSessionId();
  const { url, anonKey } = getSupabaseEnv();

  return createBrowserClient(
    url,
    anonKey,
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
