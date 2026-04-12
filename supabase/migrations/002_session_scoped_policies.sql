CREATE OR REPLACE FUNCTION public.request_headers()
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.headers', true), ''),
    '{}'
  )::jsonb;
$$;

CREATE OR REPLACE FUNCTION public.current_survey_session_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(public.request_headers() ->> 'x-survey-session-id', '');
$$;

DROP POLICY IF EXISTS "allow_insert_sessions" ON survey_sessions;
DROP POLICY IF EXISTS "allow_select_sessions" ON survey_sessions;
DROP POLICY IF EXISTS "allow_update_sessions" ON survey_sessions;
DROP POLICY IF EXISTS "allow_insert_screen_progress" ON survey_screen_progress;
DROP POLICY IF EXISTS "allow_select_screen_progress" ON survey_screen_progress;
DROP POLICY IF EXISTS "allow_update_screen_progress" ON survey_screen_progress;
DROP POLICY IF EXISTS "allow_insert_answers" ON survey_answers;
DROP POLICY IF EXISTS "allow_select_answers" ON survey_answers;
DROP POLICY IF EXISTS "allow_update_answers" ON survey_answers;
DROP POLICY IF EXISTS "allow_delete_answers" ON survey_answers;

CREATE POLICY "allow_insert_sessions"
  ON survey_sessions FOR INSERT
  WITH CHECK (id::text = public.current_survey_session_id());

CREATE POLICY "allow_select_sessions"
  ON survey_sessions FOR SELECT
  USING (id::text = public.current_survey_session_id());

CREATE POLICY "allow_update_sessions"
  ON survey_sessions FOR UPDATE
  USING (id::text = public.current_survey_session_id())
  WITH CHECK (id::text = public.current_survey_session_id());

CREATE POLICY "allow_insert_screen_progress"
  ON survey_screen_progress FOR INSERT
  WITH CHECK (session_id::text = public.current_survey_session_id());

CREATE POLICY "allow_select_screen_progress"
  ON survey_screen_progress FOR SELECT
  USING (session_id::text = public.current_survey_session_id());

CREATE POLICY "allow_update_screen_progress"
  ON survey_screen_progress FOR UPDATE
  USING (session_id::text = public.current_survey_session_id())
  WITH CHECK (session_id::text = public.current_survey_session_id());

CREATE POLICY "allow_insert_answers"
  ON survey_answers FOR INSERT
  WITH CHECK (session_id::text = public.current_survey_session_id());

CREATE POLICY "allow_select_answers"
  ON survey_answers FOR SELECT
  USING (session_id::text = public.current_survey_session_id());

CREATE POLICY "allow_update_answers"
  ON survey_answers FOR UPDATE
  USING (session_id::text = public.current_survey_session_id())
  WITH CHECK (session_id::text = public.current_survey_session_id());

CREATE POLICY "allow_delete_answers"
  ON survey_answers FOR DELETE
  USING (session_id::text = public.current_survey_session_id());

INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-memos', 'voice-memos', false)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "allow_insert_voice_memos" ON storage.objects;
DROP POLICY IF EXISTS "allow_select_voice_memos" ON storage.objects;
DROP POLICY IF EXISTS "allow_update_voice_memos" ON storage.objects;

CREATE POLICY "allow_insert_voice_memos"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (
    bucket_id = 'voice-memos'
    AND (storage.foldername(name))[1] = public.current_survey_session_id()
  );

CREATE POLICY "allow_select_voice_memos"
  ON storage.objects FOR SELECT TO anon
  USING (
    bucket_id = 'voice-memos'
    AND (storage.foldername(name))[1] = public.current_survey_session_id()
  );

CREATE POLICY "allow_update_voice_memos"
  ON storage.objects FOR UPDATE TO anon
  USING (
    bucket_id = 'voice-memos'
    AND (storage.foldername(name))[1] = public.current_survey_session_id()
  )
  WITH CHECK (
    bucket_id = 'voice-memos'
    AND (storage.foldername(name))[1] = public.current_survey_session_id()
  );
