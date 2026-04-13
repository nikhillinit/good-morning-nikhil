export interface AudioResponseValue {
  mode: "audio";
  mediaUrl?: string;
  blob?: Blob;
  mimeType?: string;
}

export interface TextResponseValue {
  mode: "text";
  text: string;
}

export type VoiceResponseValue = AudioResponseValue | TextResponseValue;

export function isVoiceFirstConfig(
  config?: Record<string, unknown>,
): config is Record<string, unknown> & { maxSeconds: number } {
  return typeof config?.maxSeconds === "number";
}

export function isAudioResponseValue(
  value: unknown,
): value is AudioResponseValue {
  return (
    typeof value === "object" &&
    value !== null &&
    "mode" in value &&
    (value as { mode?: unknown }).mode === "audio"
  );
}

export function isTextResponseValue(
  value: unknown,
): value is TextResponseValue {
  return (
    typeof value === "object" &&
    value !== null &&
    "mode" in value &&
    (value as { mode?: unknown }).mode === "text" &&
    typeof (value as { text?: unknown }).text === "string"
  );
}

export function isVoiceResponseValue(
  value: unknown,
): value is VoiceResponseValue {
  return isAudioResponseValue(value) || isTextResponseValue(value);
}
