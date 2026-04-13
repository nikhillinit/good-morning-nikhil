import { createClient } from "@/lib/supabase/client";

export const VOICE_RESPONSE_BUCKET = "voice-responses";

function inferAudioExtension(blob: Blob): string {
  if (blob.type.includes("ogg")) return "ogg";
  if (blob.type.includes("wav")) return "wav";
  if (blob.type.includes("mpeg")) return "mp3";
  if (blob.type.includes("mp4")) return "m4a";
  return "webm";
}

function sanitizePathSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "-");
}

export async function uploadVoiceResponse(
  sessionId: string,
  screenId: string,
  blob: Blob,
): Promise<string> {
  const supabase = createClient(sessionId);
  const extension = inferAudioExtension(blob);
  const objectPath = `${sanitizePathSegment(sessionId)}/${sanitizePathSegment(
    screenId,
  )}.${extension}`;

  const { error } = await supabase.storage
    .from(VOICE_RESPONSE_BUCKET)
    .upload(objectPath, blob, {
      contentType: blob.type || `audio/${extension}`,
      upsert: true,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from(VOICE_RESPONSE_BUCKET)
    .getPublicUrl(objectPath);

  return data.publicUrl;
}
