"use client";

import { useCallback, useState } from "react";

export interface ResponseData {
  screenId: string;
  value: unknown;
  timestamp: string;
}

export function useResponses() {
  const [responses, setResponses] = useState<Record<string, ResponseData>>({});

  const setResponse = useCallback((screenId: string, value: unknown) => {
    setResponses((prev) => {
      if (value === undefined || value === null) {
        const next = { ...prev };
        delete next[screenId];
        return next;
      }

      return {
        ...prev,
        [screenId]: {
          screenId,
          value,
          timestamp: new Date().toISOString(),
        },
      };
    });
  }, []);

  const hydrateResponses = useCallback((values: Record<string, unknown>) => {
    const hydrated = Object.fromEntries(
      Object.entries(values).map(([screenId, value]) => [
        screenId,
        {
          screenId,
          value,
          timestamp: new Date().toISOString(),
        } satisfies ResponseData,
      ]),
    );

    setResponses(hydrated);
  }, []);

  const getResponse = useCallback((screenId: string) => {
    return responses[screenId]?.value;
  }, [responses]);

  const getAllResponses = useCallback(() => {
    return Object.fromEntries(
      Object.entries(responses).map(([screenId, data]) => [screenId, data.value]),
    );
  }, [responses]);

  return { setResponse, hydrateResponses, getResponse, getAllResponses };
}
