"use client";

export const SESSION_KEY = "gmn_session_id";

export function getStoredSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_KEY);
}

export function storeSessionId(id: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_KEY, id);
  }
}

export function clearStoredSessionId(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_KEY);
  }
}
