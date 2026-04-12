/**
 * Haptic feedback map for Good Morning, Nikhil
 */

export type HapticAction =
  | "roseSelect"
  | "roseDeselect"
  | "bachelorEliminate"
  | "sharkDecision"
  | "screenAdvance"
  | "voiceRecordStart"
  | "voiceRecordStop"
  | "finalSubmit";

const HAPTIC_MAP: Record<HapticAction, number | number[]> = {
  roseSelect: 10,
  roseDeselect: 10,
  bachelorEliminate: [30, 20, 30],
  sharkDecision: [50, 30, 50],
  screenAdvance: 15,
  voiceRecordStart: 20,
  voiceRecordStop: [20, 50, 20, 50, 80],
  finalSubmit: [20, 50, 20, 50, 80],
};

export function triggerHaptic(action: HapticAction): void {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  try {
    navigator.vibrate(HAPTIC_MAP[action]);
  } catch {
    // Vibration not supported or blocked — fail silently
  }
}
