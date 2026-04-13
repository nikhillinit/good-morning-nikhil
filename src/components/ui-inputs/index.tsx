"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { UIType } from "@/data/screens";
import { uiReveal } from "@/lib/animations";
import { isVoiceFirstConfig } from "@/lib/voice-response";
import { VoiceRecorder } from "./VoiceRecorder";

interface UIInputProps {
  type: UIType;
  config?: Record<string, unknown>;
  initialValue?: unknown;
  onSubmit: (value: unknown) => void;
}

/* ── Shared styles ──────────────────────────────────────────────── */

const primaryBtn =
  "w-full rounded-lg bg-yellow-500 py-3 font-bold text-black hover:bg-yellow-400 disabled:opacity-30 disabled:cursor-not-allowed glow-accent";

const inputField =
  "w-full rounded-lg border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-white placeholder-zinc-500 focus:border-yellow-500 focus:outline-none";

const skipBtn =
  "mt-1 py-2 text-sm text-zinc-500 hover:text-zinc-300";

const chipBase =
  "rounded-lg border px-3 py-3 text-sm transition-colors min-h-[48px] flex items-center justify-center";

const chipSelected =
  "border-yellow-500 bg-yellow-500/20 text-yellow-300";

const chipIdle =
  "border-zinc-700 bg-zinc-900/80 text-zinc-300 hover:border-zinc-500";

/* ── Components ─────────────────────────────────────────────────── */

function StartButton({ onSubmit }: { onSubmit: (v: unknown) => void }) {
  return (
    <motion.button
      {...uiReveal}
      onClick={() => onSubmit(true)}
      className="font-display rounded-lg bg-yellow-500 px-10 py-5 text-2xl text-black hover:bg-yellow-400 glow-accent"
    >
      Start Episode
    </motion.button>
  );
}

function ContinueButton({ onSubmit }: { onSubmit: (v: unknown) => void }) {
  return (
    <motion.div {...uiReveal} className="space-y-3 text-center">
      <p className="text-sm text-zinc-400">
        You&apos;ll flip through 7 quick TV-themed segments about Nikhil —
        each one takes about 30 seconds. Tap or record whatever comes to
        mind. There are no wrong answers.
      </p>
      <button
        onClick={() => onSubmit(true)}
        className="rounded-lg bg-white/10 px-8 py-3 font-medium text-white hover:bg-white/20"
      >
        Continue →
      </button>
    </motion.div>
  );
}

function ThreeText({
  config,
  initialValue,
  onSubmit,
}: {
  config?: Record<string, unknown>;
  initialValue?: unknown;
  onSubmit: (v: unknown) => void;
}) {
  const [values, setValues] = useState(() => {
    const initial = Array.isArray(initialValue)
      ? initialValue.map((entry) => String(entry ?? "")).slice(0, 3)
      : [];
    return [...initial, "", "", ""].slice(0, 3);
  });
  const [error, setError] = useState("");
  const placeholders = (config?.placeholder as string[]) ?? [
    "#1",
    "#2",
    "#3",
  ];

  return (
    <motion.div {...uiReveal} className="w-full max-w-md space-y-3">
      {values.map((val, i) => (
        <input
          key={i}
          type="text"
          value={val}
          onChange={(e) => {
            const next = [...values];
            next[i] = e.target.value;
            setValues(next);
          }}
          placeholder={placeholders[i]}
          className={inputField}
        />
      ))}
      <button
        onClick={() => {
          const filled = values.filter((v) => v.trim());
          if (filled.length < 1) {
            setError("Give us at least one");
            return;
          }
          setError("");
          onSubmit(filled);
        }}
        className={primaryBtn}
      >
        Lock it in
      </button>
      {error && (
        <p className="text-center text-sm text-red-400">{error}</p>
      )}
    </motion.div>
  );
}

function ShortText({
  config,
  initialValue,
  onSubmit,
}: {
  config?: Record<string, unknown>;
  initialValue?: unknown;
  onSubmit: (v: unknown) => void;
}) {
  const [value, setValue] = useState(
    typeof initialValue === "string" ? initialValue : "",
  );
  const [error, setError] = useState("");
  const placeholder = (config?.placeholder as string) ?? "";

  return (
    <motion.div {...uiReveal} className="w-full max-w-md space-y-3">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className={inputField}
      />
      <button
        onClick={() => {
          if (!value.trim()) {
            setError("Type something first");
            return;
          }
          setError("");
          onSubmit(value.trim());
        }}
        className={primaryBtn}
      >
        Lock it in
      </button>
      {error && (
        <p className="text-center text-sm text-red-400">{error}</p>
      )}
      <button
        onClick={() => onSubmit(null)}
        className={skipBtn}
      >
        Skip this one →
      </button>
    </motion.div>
  );
}

function TextArea({
  config,
  initialValue,
  onSubmit,
}: {
  config?: Record<string, unknown>;
  initialValue?: unknown;
  onSubmit: (v: unknown) => void;
}) {
  const [value, setValue] = useState(
    typeof initialValue === "string" ? initialValue : "",
  );
  const [error, setError] = useState("");
  const placeholder = (config?.placeholder as string) ?? "";

  return (
    <motion.div {...uiReveal} className="w-full max-w-md space-y-3">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className={inputField}
      />
      <button
        onClick={() => {
          if (!value.trim()) {
            setError("Type something first");
            return;
          }
          setError("");
          onSubmit(value.trim());
        }}
        className={primaryBtn}
      >
        Lock it in
      </button>
      {error && (
        <p className="text-center text-sm text-red-400">{error}</p>
      )}
      <button
        onClick={() => onSubmit(null)}
        className={skipBtn}
      >
        Skip this one →
      </button>
    </motion.div>
  );
}

function MultiSelect({
  config,
  initialValue,
  onSubmit,
}: {
  config?: Record<string, unknown>;
  initialValue?: unknown;
  onSubmit: (v: unknown) => void;
}) {
  const options = (config?.options as string[]) ?? [];
  const maxSelect = (config?.maxSelect as number) ?? 3;
  const label = (config?.label as string) ?? "Select";
  const [selected, setSelected] = useState<string[]>(
    Array.isArray(initialValue)
      ? initialValue.map((entry) => String(entry ?? ""))
      : [],
  );

  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      setSelected(selected.filter((s) => s !== opt));
    } else if (selected.length < maxSelect) {
      setSelected([...selected, opt]);
    }
  };

  return (
    <motion.div {...uiReveal} className="w-full max-w-md space-y-3">
      <p className="text-sm text-zinc-400">
        {label} (pick {maxSelect})
      </p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            className={`${chipBase} ${
              selected.includes(opt) ? chipSelected : chipIdle
            }`}
          >
            {selected.includes(opt) && <span className="mr-1">✓</span>}
            {opt}
          </button>
        ))}
      </div>
      <button
        onClick={() => selected.length === maxSelect && onSubmit(selected)}
        disabled={selected.length !== maxSelect}
        className={primaryBtn}
      >
        Lock it in · {selected.length}/{maxSelect}
      </button>
    </motion.div>
  );
}

function SingleSelect({
  config,
  initialValue,
  onSubmit,
}: {
  config?: Record<string, unknown>;
  initialValue?: unknown;
  onSubmit: (v: unknown) => void;
}) {
  const options = (config?.options as string[]) ?? [];
  const label = (config?.label as string) ?? "Select one";
  const [selected, setSelected] = useState<string | null>(
    typeof initialValue === "string" ? initialValue : null,
  );

  return (
    <motion.div {...uiReveal} className="w-full max-w-md space-y-3">
      <p className="text-sm text-zinc-400">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => setSelected(opt)}
            className={`${chipBase} ${
              selected === opt ? chipSelected : chipIdle
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      <button
        onClick={() => selected && onSubmit(selected)}
        disabled={!selected}
        className={primaryBtn}
      >
        Lock it in
      </button>
    </motion.div>
  );
}

function InvestOrPass({
  initialValue,
  onSubmit,
}: {
  initialValue?: unknown;
  onSubmit: (v: unknown) => void;
}) {
  const [selected, setSelected] = useState<string | null>(
    typeof initialValue === "object" &&
      initialValue !== null &&
      "choice" in initialValue
      ? String((initialValue as { choice: unknown }).choice)
      : null,
  );

  return (
    <motion.div
      {...uiReveal}
      className="flex w-full max-w-md flex-col gap-4"
    >
      <p className="mb-3 text-center text-xs text-zinc-500">Would you invest in Nikhil?</p>
      <div className="flex w-full gap-4">
      <button
        onClick={() => setSelected("in")}
        className={`font-display flex-1 rounded-lg border-2 py-4 text-xl ${
          selected === "in"
            ? "border-green-400 bg-green-500/25 text-green-300"
            : "border-green-500 bg-green-500/10 text-green-400 hover:bg-green-500/20"
        }`}
      >
        I&apos;M IN
      </button>
      <button
        onClick={() => setSelected("out")}
        className={`font-display flex-1 rounded-lg border-2 py-4 text-xl ${
          selected === "out"
            ? "border-red-400 bg-red-500/25 text-red-200"
            : "border-red-500 bg-red-500/10 text-red-400 hover:bg-red-500/20"
        }`}
      >
        I&apos;M OUT
      </button>
      </div>
      <button
        onClick={() => selected && onSubmit({ choice: selected })}
        disabled={!selected}
        className={primaryBtn}
      >
        Lock it in
      </button>
    </motion.div>
  );
}

function MadLib({
  config,
  initialValue,
  onSubmit,
}: {
  config?: Record<string, unknown>;
  initialValue?: unknown;
  onSubmit: (v: unknown) => void;
}) {
  const [value, setValue] = useState(
    typeof initialValue === "string" ? initialValue : "",
  );
  const [error, setError] = useState("");
  const stem = (config?.stem as string) ?? "";

  return (
    <motion.div {...uiReveal} className="w-full max-w-md space-y-3">
      <p className="mb-1 text-xs text-zinc-500">Complete the sentence</p>
      <p className="text-base text-zinc-300">
        <span className="italic">&ldquo;{stem}</span>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="..."
          className="ml-1 inline-block w-full max-w-64 border-b-2 border-yellow-500 bg-transparent text-yellow-300 placeholder-zinc-600 focus:outline-none"
        />
        <span className="italic">&rdquo;</span>
      </p>
      <button
        onClick={() => {
          if (!value.trim()) {
            setError("Complete the thought");
            return;
          }
          setError("");
          onSubmit(value.trim());
        }}
        className={primaryBtn}
      >
        Lock it in
      </button>
      {error && (
        <p className="text-center text-sm text-red-400">{error}</p>
      )}
    </motion.div>
  );
}

function LongTextWithAudio({
  config,
  initialValue,
  onSubmit,
}: {
  config?: Record<string, unknown>;
  initialValue?: unknown;
  onSubmit: (v: unknown) => void;
}) {
  const [value, setValue] = useState(
    typeof initialValue === "string" ? initialValue : "",
  );
  const [error, setError] = useState("");
  const prompt = (config?.prompt as string) ?? "";

  return (
    <motion.div {...uiReveal} className="w-full max-w-md space-y-3">
      <p className="text-base italic text-zinc-400">&ldquo;{prompt}&rdquo;</p>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Say what you've never said..."
        rows={4}
        className={inputField}
      />
      <button
        onClick={() => {
          if (!value.trim()) {
            setError("Say something honest");
            return;
          }
          setError("");
          onSubmit(value.trim());
        }}
        className={primaryBtn}
      >
        Lock it in
      </button>
      {error && (
        <p className="text-center text-sm text-red-400">{error}</p>
      )}
      <button
        onClick={() => onSubmit(null)}
        className={skipBtn}
      >
        Skip this one →
      </button>
    </motion.div>
  );
}

function TwoText({
  config,
  initialValue,
  onSubmit,
}: {
  config?: Record<string, unknown>;
  initialValue?: unknown;
  onSubmit: (v: unknown) => void;
}) {
  const labels = (config?.labels as string[]) ?? ["First", "Second"];
  const [values, setValues] = useState(() => {
    const initial = Array.isArray(initialValue)
      ? initialValue.map((entry) => String(entry ?? "")).slice(0, 2)
      : [];
    return [...initial, "", ""].slice(0, 2);
  });
  const [error, setError] = useState("");

  return (
    <motion.div {...uiReveal} className="w-full max-w-md space-y-4">
      {labels.map((label, i) => (
        <div key={i}>
          <label htmlFor={`two-text-${i}`} className="mb-1 block text-sm text-zinc-400">{label}</label>
          <input
            id={`two-text-${i}`}
            type="text"
            value={values[i]}
            onChange={(e) => {
              const next = [...values];
              next[i] = e.target.value;
              setValues(next);
            }}
            className={inputField}
          />
        </div>
      ))}
      <button
        onClick={() => {
          if (!values.every((v) => v.trim())) {
            setError("Both sides of the story");
            return;
          }
          setError("");
          onSubmit(values);
        }}
        className={primaryBtn}
      >
        Lock it in
      </button>
      {error && (
        <p className="text-center text-sm text-red-400">{error}</p>
      )}
    </motion.div>
  );
}

function RelationshipPicker({
  config,
  initialValue,
  onSubmit,
}: {
  config?: Record<string, unknown>;
  initialValue?: unknown;
  onSubmit: (v: unknown) => void;
}) {
  const options = (config?.options as string[]) ?? [];
  const [anonymous, setAnonymous] = useState(
    typeof initialValue === "object" &&
      initialValue !== null &&
      "anonymous" in initialValue
      ? Boolean((initialValue as { anonymous: unknown }).anonymous)
      : false,
  );
  const [selected, setSelected] = useState<string | null>(
    typeof initialValue === "object" &&
      initialValue !== null &&
      "relationship" in initialValue
      ? String((initialValue as { relationship: unknown }).relationship)
      : null,
  );

  return (
    <motion.div {...uiReveal} className="w-full max-w-md space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => setSelected(opt)}
            className={`${chipBase} ${
              selected === opt ? chipSelected : chipIdle
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2 text-sm text-zinc-400">
        <input
          type="checkbox"
          checked={anonymous}
          onChange={(e) => setAnonymous(e.target.checked)}
          className="rounded"
        />
        Stay anonymous — Nikhil won&apos;t see who submitted
      </label>
      <button
        onClick={() => selected && onSubmit({ relationship: selected, anonymous })}
        disabled={!selected}
        className={primaryBtn}
      >
        Continue
      </button>
    </motion.div>
  );
}

function SubmitButton({ onSubmit }: { onSubmit: (v: unknown) => void }) {
  return (
    <motion.button
      {...uiReveal}
      onClick={() => onSubmit(true)}
      className="font-display rounded-lg bg-yellow-500 px-10 py-5 text-2xl text-black hover:bg-yellow-400 glow-accent"
    >
      Review & Submit
    </motion.button>
  );
}

export function UIInput({ type, config, initialValue, onSubmit }: UIInputProps) {
  const voiceFirstInputTypes = new Set<UIType>([
    "three-text",
    "text-area",
    "short-text",
    "mad-lib",
    "long-text-with-audio",
    "two-text",
  ]);

  if (voiceFirstInputTypes.has(type) && isVoiceFirstConfig(config)) {
    return (
      <VoiceRecorder
        prompt={typeof config.prompt === "string" ? config.prompt : "Record your answer"}
        maxSeconds={config.maxSeconds}
        initialValue={initialValue}
        onSubmit={onSubmit}
      />
    );
  }

  const components: Record<UIType, React.ComponentType<{ config?: Record<string, unknown>; initialValue?: unknown; onSubmit: (v: unknown) => void }>> = {
    none: () => null,
    "start-button": ({ onSubmit: submit }) => <StartButton onSubmit={submit} />,
    "continue-button": ({ onSubmit: submit }) => <ContinueButton onSubmit={submit} />,
    "relationship-picker": RelationshipPicker,
    "three-text": ThreeText,
    "text-area": TextArea,
    "short-text": ShortText,
    "multi-select": MultiSelect,
    "single-select": SingleSelect,
    "mad-lib": MadLib,
    "invest-or-pass": InvestOrPass,
    "long-text-with-audio": LongTextWithAudio,
    "two-text": TwoText,
    "submit-button": ({ onSubmit: submit }) => <SubmitButton onSubmit={submit} />,
  };

  const Component = components[type];
  if (!Component) return null;

  return <Component config={config} initialValue={initialValue} onSubmit={onSubmit} />;
}
