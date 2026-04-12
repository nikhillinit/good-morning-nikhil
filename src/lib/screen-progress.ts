import { createClient } from "@/lib/supabase/client";
import type { ScreenProgress } from "@/types";
import { ScreenStatus } from "@/types";

interface ScreenProgressRow {
  id: string;
  status: ScreenStatus;
  time_spent_ms: number | null;
}

interface ScreenProgressCompletionOptions {
  status: ScreenStatus;
  timeSpentMs?: number;
}

async function ensureScreenProgressRow(
  sessionId: string,
  screenKey: string,
  screenOrder: number,
): Promise<ScreenProgressRow> {
  const supabase = createClient(sessionId);
  const { data: existing, error: existingError } = await supabase
    .from("survey_screen_progress")
    .select("id,status,time_spent_ms")
    .eq("session_id", sessionId)
    .eq("screen_key", screenKey)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) {
    return existing as ScreenProgressRow;
  }

  const { data, error } = await supabase
    .from("survey_screen_progress")
    .insert({
      session_id: sessionId,
      screen_key: screenKey,
      screen_order: screenOrder,
      status: ScreenStatus.NOT_STARTED,
    })
    .select("id,status,time_spent_ms")
    .single();

  if (error) throw error;
  return data as ScreenProgressRow;
}

export async function trackScreenEntry(
  sessionId: string,
  screenKey: string,
  screenOrder: number,
): Promise<void> {
  const supabase = createClient(sessionId);
  const existing = await ensureScreenProgressRow(sessionId, screenKey, screenOrder);
  const nextStatus =
    existing.status === ScreenStatus.ANSWERED ||
    existing.status === ScreenStatus.SKIPPED
      ? existing.status
      : ScreenStatus.VIEWED;

  const { error } = await supabase
    .from("survey_screen_progress")
    .update({
      entered_at: new Date().toISOString(),
      screen_order: screenOrder,
      status: nextStatus,
    })
    .eq("id", existing.id);

  if (error) throw error;
}

export async function completeScreenProgress(
  sessionId: string,
  screenKey: string,
  screenOrder: number,
  options: ScreenProgressCompletionOptions,
): Promise<void> {
  const supabase = createClient(sessionId);
  const existing = await ensureScreenProgressRow(sessionId, screenKey, screenOrder);
  const nextTimeSpent =
    (existing.time_spent_ms ?? 0) + Math.max(0, options.timeSpentMs ?? 0);
  const { error } = await supabase
    .from("survey_screen_progress")
    .update({
      status: options.status,
      answered_at:
        options.status === ScreenStatus.ANSWERED ||
        options.status === ScreenStatus.SKIPPED
          ? new Date().toISOString()
          : null,
      screen_order: screenOrder,
      time_spent_ms: nextTimeSpent,
    })
    .eq("id", existing.id);

  if (error) throw error;
}

export async function getScreenProgress(
  sessionId: string,
): Promise<ScreenProgress[]> {
  const supabase = createClient(sessionId);
  const { data, error } = await supabase
    .from("survey_screen_progress")
    .select("*")
    .eq("session_id", sessionId)
    .order("screen_order", { ascending: true })
    .order("entered_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as ScreenProgress[];
}
