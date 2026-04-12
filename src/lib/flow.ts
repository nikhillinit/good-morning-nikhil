import type { Screen } from "@/data/screens";

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
