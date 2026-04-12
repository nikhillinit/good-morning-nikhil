import type { Screen } from "@/data/screens";
import { replaceAnswersForScreen } from "@/lib/answers";
import { updateSession } from "@/lib/session";
import { serializeScreenResponse } from "@/lib/response-contract";

export async function persistScreenResponse(
  sessionId: string,
  screen: Screen,
  value: unknown,
) {
  const serialized = serializeScreenResponse(screen, value);

  await replaceAnswersForScreen(sessionId, screen.id, serialized.answers);

  if (Object.keys(serialized.sessionPatch).length > 0) {
    await updateSession(sessionId, serialized.sessionPatch);
  }

  return serialized;
}
