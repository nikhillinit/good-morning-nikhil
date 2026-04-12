// ── Enums ──────────────────────────────────────────────────────

export enum CompletionStatus {
  STARTED = "started",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  ABANDONED = "abandoned",
}

export enum ScreenStatus {
  NOT_STARTED = "not_started",
  VIEWED = "viewed",
  ANSWERED = "answered",
  SKIPPED = "skipped",
}

export enum AnswerType {
  SHORT_TEXT = "short_text",
  LONG_TEXT = "long_text",
  SINGLE_SELECT = "single_select",
  MULTI_SELECT = "multi_select",
  BOOLEAN = "boolean",
  INTEGER = "integer",
  PAIRED_TEXT = "paired_text",
}

export enum InputMethod {
  TEXT = "text",
  AUDIO = "audio",
  MIXED = "mixed",
  TAP = "tap",
}

export enum RelationshipType {
  FAMILY = "family",
  FRIEND = "friend",
  CLASSMATE = "classmate",
  COLLEAGUE = "colleague",
  MANAGER = "manager",
  OTHER = "other",
}

// ── Interfaces ─────────────────────────────────────────────────

export interface SurveySession {
  id: string;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  completion_status: CompletionStatus;
  last_completed_screen_key: string | null;
  anonymous: boolean;
  relationship_type: RelationshipType | null;
  relationship_other: string | null;
  display_name: string | null;
  mode_variant: string | null;
  captions_enabled: boolean;
  script_version: string;
  prompt_catalog_version: string;
  asset_pack_version: string;
  flow_version: string;
  started_from_resume: boolean;
}

export interface ScreenProgress {
  id: string;
  session_id: string;
  screen_key: string;
  screen_order: number;
  status: ScreenStatus;
  entered_at: string;
  answered_at: string | null;
  time_spent_ms: number;
  used_audio_on_screen: boolean;
  used_captions_on_screen: boolean;
}

export interface SurveyAnswer {
  id: string;
  session_id: string;
  screen_key: string;
  segment: string | null;
  prompt_key: string;
  answer_type: AnswerType;
  value_text: string | null;
  value_int: number | null;
  value_json: Record<string, unknown> | null;
  media_url: string | null;
  normalized_value: string | null;
  option_value: string | null;
  order_index: number | null;
  input_method: InputMethod;
  created_at: string;
  updated_at: string;
}
