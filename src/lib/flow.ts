import type { Screen, UIType } from "@/data/screens";
import { ScreenStatus, type ScreenProgress } from "@/types";

export function getNextScreen(
  currentId: string,
  screens: Screen[],
): string | null {
  const idx = screens.findIndex((s) => s.id === currentId);
  if (idx === -1 || idx >= screens.length - 1) return null;
  return screens[idx + 1].id;
}

export function getPrevScreen(
  currentId: string,
  history: string[],
): string | null {
  const idx = history.lastIndexOf(currentId);
  if (idx <= 0) return null;
  return history[idx - 1];
}

export function getScreenIndex(id: string, screens: Screen[]): number {
  return screens.findIndex((s) => s.id === id);
}

export function getTotalScreens(screens: Screen[]): number {
  return screens.length;
}

const VIEW_ONLY_UI_TYPES = new Set<UIType>([
  "none",
  "start-button",
  "continue-button",
  "submit-button",
]);

export function getCompletionStatusForScreen(screen: Screen): ScreenStatus {
  return VIEW_ONLY_UI_TYPES.has(screen.ui)
    ? ScreenStatus.VIEWED
    : ScreenStatus.ANSWERED;
}

export function isScreenComplete(
  screen: Screen,
  status: ScreenStatus,
): boolean {
  if (VIEW_ONLY_UI_TYPES.has(screen.ui)) {
    return status !== ScreenStatus.NOT_STARTED;
  }

  return (
    status === ScreenStatus.ANSWERED || status === ScreenStatus.SKIPPED
  );
}

export function getResumeScreen(
  progressRows: ScreenProgress[],
  screens: Screen[],
): string | null {
  const progressByScreen = new Map(
    progressRows.map((row) => [row.screen_key, row]),
  );

  for (const screen of screens) {
    const progress = progressByScreen.get(screen.id);
    if (!progress) return screen.id;
    if (!isScreenComplete(screen, progress.status)) return screen.id;
  }

  return null;
}
