import type { Screen } from "@/data/screens";
import { replaceAnswersForScreen } from "@/lib/answers";
import { updateSession } from "@/lib/session";
import { serializeScreenResponse } from "@/lib/response-contract";
import {
  isAudioResponseValue,
  isVoiceFirstConfig,
} from "@/lib/voice-response";
import { uploadVoiceResponse } from "@/lib/supabase/storage";
import { enqueueFailedUpload } from "@/lib/voice-queue";

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

  try {
    const mediaUrl = await uploadVoiceResponse(sessionId, screen.id, value.blob);
    return { ...value, mediaUrl };
  } catch (uploadError) {
    console.warn(
      `[voice-queue] Upload failed for ${screen.id}, queuing for retry`,
      uploadError,
    );
    await enqueueFailedUpload(
      sessionId,
      screen.id,
      value.blob,
      value.mimeType || value.blob.type || "audio/webm",
    );
    // Return without mediaUrl so persistence proceeds.
    // serializeVoiceFirstAnswer handles empty mediaUrl by storing an empty
    // answers array — the row gets patched when flushVoiceQueue succeeds later.
    return { ...value, mediaUrl: undefined, blob: undefined };
  }
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
