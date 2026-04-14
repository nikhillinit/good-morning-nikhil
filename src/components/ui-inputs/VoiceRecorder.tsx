"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { PrimaryButton, SecondaryButton } from "@/components/primitives";
import { triggerHaptic } from "@/lib/haptics";
import {
  isAudioResponseValue,
  isTextResponseValue,
  type VoiceResponseValue,
} from "@/lib/voice-response";

interface VoiceRecorderProps {
  prompt: string;
  maxSeconds: number;
  initialValue?: unknown;
  onSubmit: (value: VoiceResponseValue | null) => void;
}

function getInitialTextValue(initialValue: unknown): string {
  if (isTextResponseValue(initialValue)) {
    return initialValue.text;
  }

  if (typeof initialValue === "string") {
    return initialValue;
  }

  return "";
}

function getInitialAudioUrl(initialValue: unknown): string | null {
  if (
    isAudioResponseValue(initialValue) &&
    typeof initialValue.mediaUrl === "string" &&
    initialValue.mediaUrl.length > 0
  ) {
    return initialValue.mediaUrl;
  }

  return null;
}

export function VoiceRecorder({
  prompt,
  maxSeconds,
  initialValue,
  onSubmit,
}: VoiceRecorderProps) {
  const initialAudioUrl = getInitialAudioUrl(initialValue);
  const hasAudioInitial = isAudioResponseValue(initialValue);
  const [inputMode, setInputMode] = useState<"type" | "record">(
    hasAudioInitial ? "record" : "type",
  );
  const [typedValue, setTypedValue] = useState(getInitialTextValue(initialValue));
  const [recordedUrl, setRecordedUrl] = useState<string | null>(initialAudioUrl);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(maxSeconds);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generatedObjectUrlRef = useRef<string | null>(null);

  const clearTimers = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const revokeGeneratedUrl = () => {
    if (generatedObjectUrlRef.current) {
      URL.revokeObjectURL(generatedObjectUrlRef.current);
      generatedObjectUrlRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearTimers();
      recorderRef.current?.stream
        ?.getTracks()
        .forEach((track) => track.stop());
      stopTracks();
      revokeGeneratedUrl();
    };
  }, []);

  const resetTake = () => {
    clearTimers();
    setIsRecording(false);
    setTimeRemaining(maxSeconds);
    setError(null);
    setRecordedBlob(null);
    setRecordedUrl(null);
    revokeGeneratedUrl();
  };

  const handleStop = () => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      return;
    }

    clearTimers();
    setIsRecording(false);
    recorder.stop();
  };

  const handleStart = async () => {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setError("Voice recording is not available on this device.");
      return;
    }

    resetTake();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const preferredMimeType =
        typeof MediaRecorder.isTypeSupported === "function" &&
        MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm";

      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, {
          mimeType: preferredMimeType,
        });
      } catch {
        recorder = new MediaRecorder(stream);
      }

      chunksRef.current = [];
      recorderRef.current = recorder;

      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      });

      recorder.addEventListener("stop", () => {
        stopTracks();

        const nextBlob = new Blob(chunksRef.current, {
          type: recorder.mimeType || preferredMimeType,
        });

        if (nextBlob.size === 0) {
          setError("No audio was captured. Try again.");
          return;
        }

        revokeGeneratedUrl();
        const nextUrl = URL.createObjectURL(nextBlob);
        generatedObjectUrlRef.current = nextUrl;
        setRecordedBlob(nextBlob);
        setRecordedUrl(nextUrl);
        triggerHaptic("voiceRecordStop");
      });

      recorder.start();
      setError(null);
      setIsRecording(true);
      setTimeRemaining(maxSeconds);
      triggerHaptic("voiceRecordStart");

      const deadline = Date.now() + maxSeconds * 1000;
      intervalRef.current = setInterval(() => {
        const remainingSeconds = Math.max(
          0,
          Math.ceil((deadline - Date.now()) / 1000),
        );
        setTimeRemaining(remainingSeconds);
      }, 200);

      timeoutRef.current = setTimeout(() => {
        handleStop();
      }, maxSeconds * 1000);
    } catch (recordingError) {
      console.error("Failed to start voice recorder", recordingError);
      stopTracks();
      setIsRecording(false);
      setError("Microphone access is required to record your answer.");
    }
  };

  const handleSubmitAudio = () => {
    if (!recordedUrl) {
      setError("Record a take first.");
      return;
    }

    onSubmit({
      mode: "audio",
      blob: recordedBlob ?? undefined,
      mediaUrl: recordedUrl,
      mimeType: recordedBlob?.type,
    });
  };

  const handleSubmitText = () => {
    const nextText = typedValue.trim();
    if (!nextText) {
      setError("Type something before you continue.");
      return;
    }

    setError(null);
    onSubmit({
      mode: "text",
      text: nextText,
    });
  };

  const modeTabBase =
    "flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors text-center";
  const modeTabActive =
    "bg-accent/15 text-accent border border-accent/40";
  const modeTabInactive =
    "text-muted border border-transparent hover:text-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-xl space-y-4"
    >
      {/* Mode selector — type and record as co-equal options */}
      {!isRecording && (
        <div className="flex gap-2 rounded-xl bg-black/25 p-1 backdrop-blur-sm">
          <button
            onClick={() => { setError(null); setInputMode("type"); }}
            className={`${modeTabBase} ${inputMode === "type" ? modeTabActive : modeTabInactive}`}
            aria-pressed={inputMode === "type"}
          >
            Type
          </button>
          <button
            onClick={() => { setError(null); setInputMode("record"); }}
            className={`${modeTabBase} ${inputMode === "record" ? modeTabActive : modeTabInactive}`}
            aria-pressed={inputMode === "record"}
          >
            Record
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-[var(--input-border)] bg-black/25 p-5 text-center backdrop-blur-sm">
        {inputMode === "type" ? (
          <div className="space-y-3">
            <textarea
              value={typedValue}
              onChange={(event) => setTypedValue(event.target.value)}
              rows={4}
              placeholder="Keep it short and honest."
              className="w-full rounded-lg border border-surface-hover bg-surface/80 px-4 py-3 text-foreground placeholder-muted transition-all duration-300 ease-out focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/20"
            />
            <PrimaryButton onClick={handleSubmitText}>
              Lock it in
            </PrimaryButton>
          </div>
        ) : recordedUrl ? (
          <div className="space-y-4">
            <p className="text-body text-foreground">
              Take ready. Play it back, then send it when it sounds right.
            </p>
            <audio controls preload="metadata" className="w-full" src={recordedUrl}>
              Your browser does not support audio playback.
            </audio>
            <div className="flex flex-col gap-3 sm:flex-row">
              <PrimaryButton onClick={handleSubmitAudio}>
                Use this take
              </PrimaryButton>
              <button
                onClick={handleStart}
                className="w-full rounded-lg border border-surface-hover bg-surface/50 px-4 py-3 text-sm text-foreground transition-colors hover:bg-surface"
              >
                Record again
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mb-2 flex items-center justify-between text-caption uppercase tracking-[0.18em] text-muted">
              <span>{isRecording ? "Recording" : "Voice response"}</span>
              <span>{timeRemaining}s</span>
            </div>
            <motion.button
              whileHover={{ scale: isRecording ? 1 : 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={isRecording ? handleStop : () => void handleStart()}
              aria-label={
                isRecording
                  ? `Stop recording your answer for ${prompt}`
                  : `Start recording your answer for ${prompt}`
              }
              className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/10 text-white shadow-lg transition-colors ${
                isRecording
                  ? "bg-[var(--record)] motion-safe:animate-pulse"
                  : "bg-[var(--nav-control)] hover:bg-black/80"
              }`}
            >
              {isRecording ? (
                <span className="h-7 w-7 rounded-md bg-white" aria-hidden="true" />
              ) : (
                <span className="ml-1 h-0 w-0 border-y-[14px] border-y-transparent border-l-[22px] border-l-white" aria-hidden="true" />
              )}
            </motion.button>
            <div className="space-y-1">
              <p className="text-base font-medium text-foreground">
                {isRecording ? "Recording now..." : "Tap to record"}
              </p>
              <p className="text-body text-muted">
                {isRecording
                  ? `${timeRemaining}s remaining. We will stop automatically.`
                  : `${maxSeconds}s max`}
              </p>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-center text-sm text-error">{error}</p>}

      <SecondaryButton onClick={() => onSubmit(null)}>
        Skip this one →
      </SecondaryButton>
    </motion.div>
  );
}
