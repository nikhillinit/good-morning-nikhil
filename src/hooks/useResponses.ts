"use client";

import { useCallback, useRef } from "react";

export interface ResponseData {
  screenId: string;
  value: unknown;
  timestamp: string;
}

export function useResponses() {
  const responses = useRef<Map<string, ResponseData>>(new Map());

  const setResponse = useCallback((screenId: string, value: unknown) => {
    responses.current.set(screenId, {
      screenId,
      value,
      timestamp: new Date().toISOString(),
    });
  }, []);

  const getResponse = useCallback((screenId: string) => {
    return responses.current.get(screenId);
  }, []);

  const getAllResponses = useCallback(() => {
    return Object.fromEntries(responses.current);
  }, []);

  return { setResponse, getResponse, getAllResponses };
}
