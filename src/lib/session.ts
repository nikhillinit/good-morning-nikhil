import { createClient } from "@/lib/supabase/client";
import {
  clearStoredSessionId,
  storeSessionId,
} from "@/lib/session-storage";
import type { SurveySession } from "@/types";
import { CompletionStatus } from "@/types";
import { getStoredSessionId } from "@/lib/session-storage";
import { hasSupabaseEnv } from "@/lib/supabase/config";

export async function createSession(
  data: Partial<SurveySession>,
): Promise<SurveySession> {
  const sessionId = data.id ?? crypto.randomUUID();
  const supabase = createClient(sessionId);
  const { data: session, error } = await supabase
    .from("survey_sessions")
    .insert({
      id: sessionId,
      anonymous: data.anonymous ?? true,
      relationship_type: data.relationship_type ?? null,
      relationship_other: data.relationship_other ?? null,
      display_name: data.display_name ?? null,
      mode_variant: data.mode_variant ?? "full",
      captions_enabled: data.captions_enabled ?? true,
      script_version: data.script_version ?? "1.0",
      prompt_catalog_version: data.prompt_catalog_version ?? "1.0",
      asset_pack_version: data.asset_pack_version ?? null,
      flow_version: data.flow_version ?? "1.0",
      started_from_resume: data.started_from_resume ?? false,
    })
    .select()
    .single();

  if (error) throw error;
  storeSessionId(session.id);
  return session as SurveySession;
}

export async function getSession(
  sessionId: string,
): Promise<SurveySession | null> {
  if (!hasSupabaseEnv()) return null;

  const supabase = createClient(sessionId);
  const { data, error } = await supabase
    .from("survey_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as SurveySession;
}

export async function getOrResumeSession(): Promise<SurveySession | null> {
  if (!hasSupabaseEnv()) return null;

  const sessionId = getStoredSessionId();
  if (!sessionId) return null;

  const session = await getSession(sessionId);
  if (!session) {
    clearStoredSessionId();
    return null;
  }
  return session;
}

export async function updateSession(
  sessionId: string,
  data: Partial<SurveySession>,
): Promise<void> {
  const supabase = createClient(sessionId);
  const { error } = await supabase
    .from("survey_sessions")
    .update(data)
    .eq("id", sessionId);

  if (error) throw error;
}

export async function submitSession(sessionId: string): Promise<void> {
  const supabase = createClient(sessionId);
  const { error } = await supabase
    .from("survey_sessions")
    .update({
      submitted_at: new Date().toISOString(),
      completion_status: CompletionStatus.COMPLETED,
    })
    .eq("id", sessionId);

  if (error) throw error;
}
