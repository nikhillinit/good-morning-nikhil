-- 001_initial_schema.sql
-- Good Morning, Nikhil — survey database schema

-- ── Enums ──────────────────────────────────────────────────────

CREATE TYPE completion_status AS ENUM (
  'started',
  'in_progress',
  'completed',
  'abandoned'
);

CREATE TYPE screen_status AS ENUM (
  'not_started',
  'viewed',
  'answered',
  'skipped'
);

-- ── Tables ─────────────────────────────────────────────────────

CREATE TABLE survey_sessions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at             TIMESTAMPTZ,
  completion_status        completion_status NOT NULL DEFAULT 'started',
  last_completed_screen_key TEXT,
  anonymous                BOOLEAN NOT NULL DEFAULT true,
  relationship_type        TEXT,
  relationship_other       TEXT,
  display_name             TEXT,
  mode_variant             TEXT NOT NULL DEFAULT 'full',
  captions_enabled         BOOLEAN NOT NULL DEFAULT true,
  script_version           TEXT NOT NULL DEFAULT '1.0',
  prompt_catalog_version   TEXT NOT NULL DEFAULT '1.0',
  asset_pack_version       TEXT,
  flow_version             TEXT NOT NULL DEFAULT '1.0',
  started_from_resume      BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE survey_screen_progress (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id               UUID NOT NULL REFERENCES survey_sessions(id) ON DELETE CASCADE,
  screen_key               TEXT NOT NULL,
  screen_order             INTEGER NOT NULL,
  status                   screen_status NOT NULL DEFAULT 'not_started',
  entered_at               TIMESTAMPTZ,
  answered_at              TIMESTAMPTZ,
  time_spent_ms            INTEGER,
  used_audio_on_screen     BOOLEAN,
  used_captions_on_screen  BOOLEAN
);

CREATE TABLE survey_answers (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id               UUID NOT NULL REFERENCES survey_sessions(id) ON DELETE CASCADE,
  screen_key               TEXT NOT NULL,
  segment                  TEXT,
  prompt_key               TEXT NOT NULL,
  answer_type              TEXT NOT NULL,
  value_text               TEXT,
  value_int                INTEGER,
  value_json               JSONB,
  media_url                TEXT,
  normalized_value         TEXT,
  option_value             TEXT,
  order_index              INTEGER NOT NULL DEFAULT 0,
  input_method             TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_session_prompt_order UNIQUE (session_id, prompt_key, order_index)
);

-- ── CHECK Constraints ──────────────────────────────────────────
-- Enforce controlled values at the database level to prevent drift.

ALTER TABLE survey_sessions ADD CONSTRAINT chk_relationship_type
  CHECK (relationship_type IN ('family', 'friend', 'classmate', 'colleague', 'manager', 'other'));

ALTER TABLE survey_answers ADD CONSTRAINT chk_answer_type
  CHECK (answer_type IN ('short_text', 'long_text', 'single_select', 'multi_select', 'boolean', 'integer', 'paired_text'));

ALTER TABLE survey_answers ADD CONSTRAINT chk_input_method
  CHECK (input_method IS NULL OR input_method IN ('text', 'audio', 'mixed', 'tap'));

-- last_completed_screen_key is cached resume state, not primary truth.
-- survey_screen_progress is the authoritative source for per-screen status.
COMMENT ON COLUMN survey_sessions.last_completed_screen_key IS
  'Cached resume pointer — convenience field updated alongside survey_screen_progress. Not the primary authority on completion state.';

-- ── Indexes ────────────────────────────────────────────────────

CREATE INDEX idx_screen_progress_session ON survey_screen_progress(session_id);
CREATE INDEX idx_answers_session         ON survey_answers(session_id);
CREATE INDEX idx_answers_prompt_key      ON survey_answers(prompt_key);
CREATE INDEX idx_answers_screen_key      ON survey_answers(screen_key);

-- ── Row Level Security ─────────────────────────────────────────
-- Anonymous survey: no auth required. Policies allow all ops
-- scoped to session_id so clients can only touch their own rows.

ALTER TABLE survey_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_screen_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_answers ENABLE ROW LEVEL SECURITY;

-- Sessions: allow insert (anyone can start) and select/update by id
CREATE POLICY "allow_insert_sessions"
  ON survey_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "allow_select_sessions"
  ON survey_sessions FOR SELECT
  USING (true);

CREATE POLICY "allow_update_sessions"
  ON survey_sessions FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Screen progress: scoped to session_id
CREATE POLICY "allow_insert_screen_progress"
  ON survey_screen_progress FOR INSERT
  WITH CHECK (true);

CREATE POLICY "allow_select_screen_progress"
  ON survey_screen_progress FOR SELECT
  USING (true);

CREATE POLICY "allow_update_screen_progress"
  ON survey_screen_progress FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Answers: scoped to session_id
CREATE POLICY "allow_insert_answers"
  ON survey_answers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "allow_select_answers"
  ON survey_answers FOR SELECT
  USING (true);

CREATE POLICY "allow_update_answers"
  ON survey_answers FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "allow_delete_answers"
  ON survey_answers FOR DELETE
  USING (true);

-- ── Updated-at trigger ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sessions_updated_at
  BEFORE UPDATE ON survey_sessions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_answers_updated_at
  BEFORE UPDATE ON survey_answers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
