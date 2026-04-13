import type { Screen } from "@/data/screens";
import { replaceAnswersForScreen } from "@/lib/answers";
import { updateSession } from "@/lib/session";
import { serializeScreenResponse } from "@/lib/response-contract";
import {
  isAudioResponseValue,
  isVoiceFirstConfig,
} from "@/lib/voice-response";
import { uploadVoiceResponse } from "@/lib/supabase/storage";

async function resolvePersistableValue(
  sessionId: string,
  screen: Screen,
  value: unknown,
): Promise<unknown> {
  if (!isVoiceFirstConfig(screen.uiConfig) || !isAudioResponseValue(value)) {
    return value;
  }

  if (value.mediaUrl && !value.blob) {
    return value;
  }

  if (!value.blob) {
    return value;
  }

  const mediaUrl = await uploadVoiceResponse(sessionId, screen.id, value.blob);

  return {
    ...value,
    mediaUrl,
  };
}

export async function persistScreenResponse(
  sessionId: string,
  screen: Screen,
  value: unknown,
) {
  const resolvedValue = await resolvePersistableValue(sessionId, screen, value);
  const serialized = serializeScreenResponse(screen, resolvedValue);

  await replaceAnswersForScreen(sessionId, screen.id, serialized.answers);

  if (Object.keys(serialized.sessionPatch).length > 0) {
    await updateSession(sessionId, serialized.sessionPatch);
  }

  return serialized;
}
