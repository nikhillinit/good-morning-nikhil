CREATE UNIQUE INDEX IF NOT EXISTS idx_screen_progress_session_screen
ON survey_screen_progress(session_id, screen_key);
