import type { Screen } from "@/data/screens";
import {
  AnswerType,
  InputMethod,
  RelationshipType,
  type SurveyAnswer,
  type SurveySession,
} from "@/types";

interface SerializedScreenResponse {
  answers: Partial<SurveyAnswer>[];
  sessionPatch: Partial<SurveySession>;
  reviewValue: unknown;
}

function normalizeChoice(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function isViewOnlyScreen(screen: Screen): boolean {
  return (
    screen.ui === "none" ||
    screen.ui === "start-button" ||
    screen.ui === "continue-button" ||
    screen.ui === "submit-button"
  );
}

function serializeTextAnswer(
  screen: Screen,
  promptKey: string,
  value: string,
  answerType: AnswerType,
): Partial<SurveyAnswer> {
  return {
    screen_key: screen.id,
    prompt_key: promptKey,
    answer_type: answerType,
    value_text: value,
    input_method: InputMethod.TEXT,
    order_index: 0,
  };
}

function coerceRelationshipType(value: string): SurveySession["relationship_type"] {
  const normalized = normalizeChoice(value);
  switch (normalized) {
    case "family":
      return RelationshipType.FAMILY;
    case "friend":
      return RelationshipType.FRIEND;
    case "classmate":
      return RelationshipType.CLASSMATE;
    case "colleague":
      return RelationshipType.COLLEAGUE;
    case "manager":
      return RelationshipType.MANAGER;
    default:
      return RelationshipType.OTHER;
  }
}

export function serializeScreenResponse(
  screen: Screen,
  value: unknown,
): SerializedScreenResponse {
  if (value === null || value === undefined || isViewOnlyScreen(screen)) {
    return {
      answers: [],
      sessionPatch: {},
      reviewValue: undefined,
    };
  }

  switch (screen.ui) {
    case "relationship-picker": {
      const relationshipValue =
        typeof value === "object" && value !== null && "relationship" in value
          ? String((value as { relationship: unknown }).relationship)
          : "";
      const anonymous =
        typeof value === "object" && value !== null && "anonymous" in value
          ? Boolean((value as { anonymous: unknown }).anonymous)
          : true;
      const relationship = relationshipValue.trim();
      const normalized = normalizeChoice(relationship);

      return {
        answers: relationship
          ? [
              {
                screen_key: screen.id,
                prompt_key: `${screen.id}.relationship`,
                answer_type: AnswerType.SINGLE_SELECT,
                value_text: relationship,
                option_value: relationship,
                normalized_value: normalized,
                input_method: InputMethod.TAP,
                order_index: 0,
              },
            ]
          : [],
        sessionPatch: {
          anonymous,
          relationship_type: relationship ? coerceRelationshipType(relationship) : null,
          relationship_other: normalized === "other" ? relationship : null,
        },
        reviewValue: relationship
          ? {
              relationship,
              anonymous,
            }
          : undefined,
      };
    }

    case "three-text": {
      const answers = Array.isArray(value)
        ? value
            .map((entry, index) => [String(entry ?? "").trim(), index] as const)
            .filter(([entry]) => entry.length > 0)
            .map(([entry, index]) => ({
              screen_key: screen.id,
              prompt_key: `${screen.id}.item`,
              answer_type: AnswerType.SHORT_TEXT,
              value_text: entry,
              input_method: InputMethod.TEXT,
              order_index: index,
              segment: `item_${index + 1}`,
            }))
        : [];

      return {
        answers,
        sessionPatch: {},
        reviewValue: answers.map((answer) => answer.value_text),
      };
    }

    case "two-text": {
      const labels = (screen.uiConfig?.labels as string[] | undefined) ?? ["First", "Second"];
      const values = Array.isArray(value)
        ? value.map((entry) => String(entry ?? "").trim())
        : ["", ""];

      return {
        answers: values.some((entry) => entry.length > 0)
          ? [
              {
                screen_key: screen.id,
                prompt_key: `${screen.id}.pair`,
                answer_type: AnswerType.PAIRED_TEXT,
                value_json: {
                  labels,
                  values,
                },
                input_method: InputMethod.TEXT,
                order_index: 0,
              },
            ]
          : [],
        sessionPatch: {},
        reviewValue: values,
      };
    }

    case "multi-select": {
      const selected = Array.isArray(value)
        ? value.map((entry) => String(entry ?? "").trim()).filter(Boolean)
        : [];
      const normalized = selected.map(normalizeChoice);

      return {
        answers: selected.length
          ? [
              {
                screen_key: screen.id,
                prompt_key: `${screen.id}.choices`,
                answer_type: AnswerType.MULTI_SELECT,
                value_json: { selections: selected },
                option_value: selected.join("|"),
                normalized_value: normalized.join("|"),
                input_method: InputMethod.TAP,
                order_index: 0,
              },
            ]
          : [],
        sessionPatch: {},
        reviewValue: selected,
      };
    }

    case "single-select": {
      const selected = String(value).trim();
      const normalized = normalizeChoice(selected);

      return {
        answers: selected
          ? [
              {
                screen_key: screen.id,
                prompt_key: `${screen.id}.choice`,
                answer_type: AnswerType.SINGLE_SELECT,
                value_text: selected,
                option_value: selected,
                normalized_value: normalized,
                input_method: InputMethod.TAP,
                order_index: 0,
              },
            ]
          : [],
        sessionPatch: {},
        reviewValue: selected || undefined,
      };
    }

    case "invest-or-pass": {
      const choice =
        typeof value === "object" && value !== null && "choice" in value
          ? String((value as { choice: unknown }).choice).trim()
          : "";
      const normalized = normalizeChoice(choice);

      return {
        answers: choice
          ? [
              {
                screen_key: screen.id,
                prompt_key: `${screen.id}.decision`,
                answer_type: AnswerType.SINGLE_SELECT,
                value_text: choice,
                option_value: choice,
                normalized_value: normalized,
                input_method: InputMethod.TAP,
                order_index: 0,
              },
            ]
          : [],
        sessionPatch: {},
        reviewValue: choice ? { choice } : undefined,
      };
    }

    case "short-text":
    case "mad-lib": {
      const text = String(value).trim();
      return {
        answers: text
          ? [
              serializeTextAnswer(
                screen,
                `${screen.id}.response`,
                text,
                AnswerType.SHORT_TEXT,
              ),
            ]
          : [],
        sessionPatch: {},
        reviewValue: text || undefined,
      };
    }

    case "text-area":
    case "long-text-with-audio": {
      const text = String(value).trim();
      return {
        answers: text
          ? [
              serializeTextAnswer(
                screen,
                `${screen.id}.response`,
                text,
                AnswerType.LONG_TEXT,
              ),
            ]
          : [],
        sessionPatch: {},
        reviewValue: text || undefined,
      };
    }

    default:
      return {
        answers: [],
        sessionPatch: {},
        reviewValue: undefined,
      };
  }
}

function getScreenAnswers(screenId: string, answers: SurveyAnswer[]): SurveyAnswer[] {
  return answers
    .filter((answer) => answer.screen_key === screenId)
    .sort((left, right) => (left.order_index ?? 0) - (right.order_index ?? 0));
}

function resolveRelationshipLabel(
  screen: Screen,
  session: SurveySession,
  answers: SurveyAnswer[],
): string | null {
  const answer = answers[0];
  if (answer?.value_text) {
    return answer.value_text;
  }

  if (!session.relationship_type) {
    return null;
  }

  const options = (screen.uiConfig?.options as string[] | undefined) ?? [];
  const match = options.find(
    (option) => normalizeChoice(option) === session.relationship_type,
  );

  return match ?? session.relationship_type;
}

export function hydrateScreenResponse(
  screen: Screen,
  answers: SurveyAnswer[],
  session: SurveySession,
): unknown {
  const screenAnswers = getScreenAnswers(screen.id, answers);

  if (isViewOnlyScreen(screen)) {
    return undefined;
  }

  switch (screen.ui) {
    case "relationship-picker": {
      const relationship = resolveRelationshipLabel(screen, session, screenAnswers);
      if (!relationship) {
        return undefined;
      }

      return {
        relationship,
        anonymous: session.anonymous,
      };
    }

    case "three-text": {
      const values = screenAnswers
        .map((answer) => answer.value_text ?? "")
        .filter((entry) => entry.length > 0);
      return values.length ? values : undefined;
    }

    case "two-text": {
      const pair = screenAnswers[0]?.value_json;
      if (
        pair &&
        typeof pair === "object" &&
        "values" in pair &&
        Array.isArray((pair as { values: unknown }).values)
      ) {
        return (pair as { values: unknown[] }).values.map((entry) =>
          String(entry ?? ""),
        );
      }

      return undefined;
    }

    case "multi-select": {
      const selected = screenAnswers[0]?.value_json;
      if (
        selected &&
        typeof selected === "object" &&
        "selections" in selected &&
        Array.isArray((selected as { selections: unknown }).selections)
      ) {
        return (selected as { selections: unknown[] }).selections.map((entry) =>
          String(entry ?? ""),
        );
      }

      return undefined;
    }

    case "single-select":
      return screenAnswers[0]?.value_text ?? screenAnswers[0]?.option_value ?? undefined;

    case "invest-or-pass": {
      const choice = screenAnswers[0]?.value_text ?? screenAnswers[0]?.option_value;
      return choice ? { choice } : undefined;
    }

    case "short-text":
    case "mad-lib":
    case "text-area":
    case "long-text-with-audio":
      return screenAnswers[0]?.value_text ?? undefined;

    default:
      return undefined;
  }
}

export function hydrateAllResponses(
  screens: Screen[],
  answers: SurveyAnswer[],
  session: SurveySession,
): Record<string, unknown> {
  return Object.fromEntries(
    screens
      .map((screen) => [screen.id, hydrateScreenResponse(screen, answers, session)] as const)
      .filter((entry): entry is readonly [string, unknown] => entry[1] !== undefined),
  );
}

export function getReviewableScreenCount(screens: Screen[]): number {
  return screens.filter((screen) => !isViewOnlyScreen(screen)).length;
}
