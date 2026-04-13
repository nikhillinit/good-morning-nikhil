import { describe, expect, it } from "vitest";
import { screens } from "@/data/screens";
import type { Screen } from "@/data/screens";
import {
  AnswerType,
  CompletionStatus,
  InputMethod,
  RelationshipType,
} from "@/types";
import {
  getReviewableScreenCount,
  hydrateAllResponses,
  serializeScreenResponse,
} from "@/lib/response-contract";

const relationshipScreen = screens.find((screen) => screen.id === "relationship")!;
const investScreen = screens.find((screen) => screen.id === "shark-invest")!;
const coldOpenScreen = screens.find((screen) => screen.id === "cold-open")!;
const survivorScreen = screens.find((screen) => screen.id === "survivor")!;
const legacyThreeTextScreen: Screen = {
  id: "legacy-three-text",
  show: "Legacy Three Text",
  showEmoji: "",
  audio: "",
  bg: "",
  captions: [],
  ui: "three-text",
  uiConfig: {
    placeholder: ["One", "Two", "Three"],
  },
};
const legacyTwoTextScreen: Screen = {
  id: "legacy-two-text",
  show: "Legacy Two Text",
  showEmoji: "",
  audio: "",
  bg: "",
  captions: [],
  ui: "two-text",
  uiConfig: {
    labels: ["First", "Second"],
  },
};

describe("serializeScreenResponse", () => {
  it("serializes view-only screens to zero answer rows", () => {
    const serialized = serializeScreenResponse(coldOpenScreen, true);

    expect(serialized.answers).toEqual([]);
    expect(serialized.reviewValue).toBeUndefined();
    expect(serialized.sessionPatch).toEqual({});
  });

  it("maps relationship and anonymity into canonical answer + session fields", () => {
    const serialized = serializeScreenResponse(relationshipScreen, {
      relationship: "Friend",
      anonymous: false,
    });

    expect(serialized.answers).toHaveLength(1);
    expect(serialized.answers[0]).toMatchObject({
      screen_key: "relationship",
      prompt_key: "relationship.relationship",
      answer_type: AnswerType.SINGLE_SELECT,
      value_text: "Friend",
      option_value: "Friend",
      normalized_value: "friend",
      input_method: InputMethod.TAP,
    });
    expect(serialized.sessionPatch).toMatchObject({
      relationship_type: "friend",
      anonymous: false,
      relationship_other: null,
    });
  });

  it("serializes three-text answers with deterministic prompt keys and order indices", () => {
    const serialized = serializeScreenResponse(legacyThreeTextScreen, [
      "Curious",
      "Sharp",
      "Calm",
    ]);

    expect(serialized.answers).toHaveLength(3);
    expect(serialized.answers.map((answer) => answer.prompt_key)).toEqual([
      "legacy-three-text.item",
      "legacy-three-text.item",
      "legacy-three-text.item",
    ]);
    expect(serialized.answers.map((answer) => answer.order_index)).toEqual([0, 1, 2]);
    expect(serialized.reviewValue).toEqual(["Curious", "Sharp", "Calm"]);
  });

  it("serializes invest-or-pass as a canonical tap choice", () => {
    const serialized = serializeScreenResponse(investScreen, { choice: "in" });

    expect(serialized.answers).toEqual([
      expect.objectContaining({
        prompt_key: "shark-invest.decision",
        answer_type: AnswerType.SINGLE_SELECT,
        value_text: "in",
        option_value: "in",
        normalized_value: "in",
        input_method: InputMethod.TAP,
      }),
    ]);
    expect(serialized.reviewValue).toEqual({ choice: "in" });
  });

  it("serializes voice-first screens as audio answers when a media URL is present", () => {
    const serialized = serializeScreenResponse(survivorScreen, {
      mode: "audio",
      mediaUrl: "https://example.com/voice-responses/session-1/survivor.webm",
    });

    expect(serialized.answers).toEqual([
      expect.objectContaining({
        prompt_key: "survivor.response",
        answer_type: AnswerType.LONG_TEXT,
        media_url: "https://example.com/voice-responses/session-1/survivor.webm",
        input_method: InputMethod.AUDIO,
      }),
    ]);
    expect(serialized.reviewValue).toEqual({
      mode: "audio",
      mediaUrl: "https://example.com/voice-responses/session-1/survivor.webm",
    });
  });
});

describe("hydrateAllResponses", () => {
  it("hydrates canonical answer rows and session fields into screen values", () => {
    const hydrated = hydrateAllResponses(
      [...screens, legacyTwoTextScreen],
      [
        {
          id: "a1",
          session_id: "s1",
          screen_key: "relationship",
          segment: null,
          prompt_key: "relationship.relationship",
          answer_type: AnswerType.SINGLE_SELECT,
          value_text: "Manager",
          value_int: null,
          value_json: null,
          media_url: null,
          normalized_value: "manager",
          option_value: "Manager",
          order_index: 0,
          input_method: InputMethod.TAP,
          created_at: "",
          updated_at: "",
        },
        {
          id: "a2",
          session_id: "s1",
          screen_key: "legacy-two-text",
          segment: null,
          prompt_key: "legacy-two-text.pair",
          answer_type: AnswerType.PAIRED_TEXT,
          value_text: null,
          value_int: null,
          value_json: {
            labels: ["Projects that he is…", "Actually comes across as…"],
            values: ["Relaxed", "Hyper-prepared"],
          },
          media_url: null,
          normalized_value: null,
          option_value: null,
          order_index: 0,
          input_method: InputMethod.TEXT,
          created_at: "",
          updated_at: "",
        },
        {
          id: "a3",
          session_id: "s1",
          screen_key: "survivor",
          segment: null,
          prompt_key: "survivor.response",
          answer_type: AnswerType.LONG_TEXT,
          value_text: null,
          value_int: null,
          value_json: null,
          media_url: "https://example.com/voice-responses/session-1/survivor.webm",
          normalized_value: null,
          option_value: null,
          order_index: 0,
          input_method: InputMethod.AUDIO,
          created_at: "",
          updated_at: "",
        },
      ],
      {
        id: "s1",
        created_at: "",
        updated_at: "",
        submitted_at: null,
        completion_status: CompletionStatus.STARTED,
        last_completed_screen_key: null,
        anonymous: true,
        relationship_type: RelationshipType.MANAGER,
        relationship_other: null,
        display_name: null,
        mode_variant: "full",
        captions_enabled: true,
        script_version: "1.0",
        prompt_catalog_version: "1.0",
        asset_pack_version: "",
        flow_version: "1.0",
        started_from_resume: true,
      },
    );

    expect(hydrated.relationship).toEqual({
      relationship: "Manager",
      anonymous: true,
    });
    expect(hydrated["legacy-two-text"]).toEqual(["Relaxed", "Hyper-prepared"]);
    expect(hydrated.survivor).toEqual({
      mode: "audio",
      mediaUrl: "https://example.com/voice-responses/session-1/survivor.webm",
    });
    expect(hydrated["cold-open"]).toBeUndefined();
  });
});

describe("getReviewableScreenCount", () => {
  it("counts only non-view-only screens", () => {
    expect(getReviewableScreenCount(screens)).toBe(
      screens.length - 3,
    );
  });
});
