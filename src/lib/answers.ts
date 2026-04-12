import { createClient } from "@/lib/supabase/client";
import type { SurveyAnswer } from "@/types";

export async function saveAnswer(
  answer: Partial<SurveyAnswer>,
): Promise<SurveyAnswer> {
  const supabase = createClient(answer.session_id);
  const { data, error } = await supabase
    .from("survey_answers")
    .upsert(
      {
        session_id: answer.session_id,
        prompt_key: answer.prompt_key,
        order_index: answer.order_index ?? 0,
        screen_key: answer.screen_key,
        segment: answer.segment ?? null,
        answer_type: answer.answer_type,
        value_text: answer.value_text ?? null,
        value_int: answer.value_int ?? null,
        value_json: answer.value_json ?? null,
        media_url: answer.media_url ?? null,
        normalized_value: answer.normalized_value ?? null,
        option_value: answer.option_value ?? null,
        input_method: answer.input_method ?? null,
      },
      { onConflict: "session_id,prompt_key,order_index" },
    )
    .select()
    .single();

  if (error) throw error;
  return data as SurveyAnswer;
}

export async function getAnswers(
  sessionId: string,
): Promise<SurveyAnswer[]> {
  const supabase = createClient(sessionId);
  const { data, error } = await supabase
    .from("survey_answers")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as SurveyAnswer[];
}

export async function getAnswersByScreen(
  sessionId: string,
  screenKey: string,
): Promise<SurveyAnswer[]> {
  const supabase = createClient(sessionId);
  const { data, error } = await supabase
    .from("survey_answers")
    .select("*")
    .eq("session_id", sessionId)
    .eq("screen_key", screenKey)
    .order("order_index", { ascending: true });

  if (error) throw error;
  return (data ?? []) as SurveyAnswer[];
}

export async function deleteAnswer(answerId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("survey_answers")
    .delete()
    .eq("id", answerId);

  if (error) throw error;
}
