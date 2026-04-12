"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { saveAnswer } from "@/lib/answers";
import type { SurveyAnswer } from "@/types";

type AutosaveStatus = "idle" | "saving" | "saved" | "error";

interface UseAutosaveOptions {
  sessionId: string | undefined;
  screenKey: string;
  promptKey: string;
  answerType: string;
  orderIndex?: number;
  debounceMs?: number;
}

interface UseAutosaveReturn {
  status: AutosaveStatus;
  error: Error | null;
  save: (value: string | number | Record<string, unknown>) => void;
  flushPending: () => Promise<void>;
}

export function useAutosave({
  sessionId,
  screenKey,
  promptKey,
  answerType,
  orderIndex = 0,
  debounceMs = 300,
}: UseAutosaveOptions): UseAutosaveReturn {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [error, setError] = useState<Error | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestValueRef = useRef<
    string | number | Record<string, unknown> | undefined
  >(undefined);
  const mountedRef = useRef(true);

  const flush = useCallback(
    async (value: string | number | Record<string, unknown>) => {
      if (!sessionId) return;

      timerRef.current = null;
      if (mountedRef.current) {
        setStatus("saving");
        setError(null);
      }

      const payload: Partial<SurveyAnswer> = {
        session_id: sessionId,
        screen_key: screenKey,
        prompt_key: promptKey,
        answer_type: answerType as SurveyAnswer["answer_type"],
        order_index: orderIndex,
      };

      if (typeof value === "string") {
        payload.value_text = value;
      } else if (typeof value === "number") {
        payload.value_int = value;
      } else {
        payload.value_json = value;
      }

      try {
        await saveAnswer(payload);
        if (mountedRef.current && latestValueRef.current === value) {
          setStatus("saved");
        }
      } catch (err) {
        if (mountedRef.current) {
          setStatus("error");
          setError(err as Error);
        }
      }
    },
    [sessionId, screenKey, promptKey, answerType, orderIndex],
  );

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (latestValueRef.current !== undefined) {
        void flush(latestValueRef.current);
      }
    };
  }, [flush]);

  const flushPending = useCallback(async () => {
    if (latestValueRef.current === undefined) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    await flush(latestValueRef.current);
  }, [flush]);

  const save = useCallback(
    (value: string | number | Record<string, unknown>) => {
      latestValueRef.current = value;
      setStatus("saving");

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => flush(value), debounceMs);
    },
    [flush, debounceMs],
  );

  return { status, error, save, flushPending };
}
