"use client";

import { useKeyboard } from "@/hooks/useKeyboard";

export function ClientShell({ children }: { children: React.ReactNode }) {
  useKeyboard();
  return <>{children}</>;
}
