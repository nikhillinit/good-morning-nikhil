"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { UIType } from "@/data/screens";

interface UIInputProps {
  type: UIType;
  config?: Record<string, unknown>;
  onSubmit: (value: unknown) => void;
}

const inputAnimation = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" as const },
};

function StartButton({ onSubmit }: { onSubmit: (v: unknown) => void }) {
  return (
    <motion.button
      {...inputAnimation}
      onClick={() => onSubmit(true)}
      className="rounded-lg bg-yellow-500 px-8 py-4 text-lg font-bold uppercase tracking-wider text-black transition-colors hover:bg-yellow-400"
    >
      Start Episode
    </motion.button>
  );
}

function ContinueButton({ onSubmit }: { onSubmit: (v: unknown) => void }) {
  return (
    <motion.div {...inputAnimation} className="space-y-3 text-center">
      <p className="text-sm text-zinc-400">
        You&apos;ll flip through 7 quick TV-themed segments about Nikhil —
        each one takes about 30 seconds. Type whatever comes to mind.
        There are no wrong answers.
      </p>
      <button
        onClick={() => onSubmit(true)}
        className="rounded-lg bg-white/10 px-8 py-3 font-medium text-white transition-colors hover:bg-white/20"
      >
        Continue →
      </button>
    </motion.div>
  );
}

function ThreeText({
  config,
  onSubmit,
}: {
  config?: Record<string, unknown>;
  onSubmit: (v: unknown) => void;
}) {
  const [values, setValues] = useState(["", "", ""]);
  const [error, setError] = useState("");
  const placeholders = (config?.placeholder as string[]) ?? [
    "#1",
    "#2",
    "#3",
  ];

  return (
    <motion.div {...inputAnimation} className="w-full max-w-md space-y-3">
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
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-white placeholder-zinc-500 focus:border-yellow-500 focus:outline-none"
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
        className="w-full rounded-lg bg-yellow-500 py-3 font-bold text-black transition-colors hover:bg-yellow-400"
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
  onSubmit,
}: {
  config?: Record<string, unknown>;
  onSubmit: (v: unknown) => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const placeholder = (config?.placeholder as string) ?? "";

  return (
    <motion.div {...inputAnimation} className="w-full max-w-md space-y-3">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-white placeholder-zinc-500 focus:border-yellow-500 focus:outline-none"
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
        className="w-full rounded-lg bg-yellow-500 py-3 font-bold text-black transition-colors hover:bg-yellow-400"
      >
        Next
      </button>
      {error && (
        <p className="text-center text-sm text-red-400">{error}</p>
      )}
      <button
        onClick={() => onSubmit(null)}
        className="mt-1 text-xs text-zinc-600 hover:text-zinc-400"
      >
        Skip this one →
      </button>
    </motion.div>
  );
}

function TextArea({
  config,
  onSubmit,
}: {
  config?: Record<string, unknown>;
  onSubmit: (v: unknown) => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const placeholder = (config?.placeholder as string) ?? "";

  return (
    <motion.div {...inputAnimation} className="w-full max-w-md space-y-3">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-white placeholder-zinc-500 focus:border-yellow-500 focus:outline-none"
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
        className="w-full rounded-lg bg-yellow-500 py-3 font-bold text-black transition-colors hover:bg-yellow-400"
      >
        Next
      </button>
      {error && (
        <p className="text-center text-sm text-red-400">{error}</p>
      )}
      <button
        onClick={() => onSubmit(null)}
        className="mt-1 text-xs text-zinc-600 hover:text-zinc-400"
      >
        Skip this one →
      </button>
    </motion.div>
  );
}

function MultiSelect({
  config,
  onSubmit,
}: {
  config?: Record<string, unknown>;
  onSubmit: (v: unknown) => void;
}) {
  const options = (config?.options as string[]) ?? [];
  const maxSelect = (config?.maxSelect as number) ?? 3;
  const label = (config?.label as string) ?? "Select";
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      setSelected(selected.filter((s) => s !== opt));
    } else if (selected.length < maxSelect) {
      setSelected([...selected, opt]);
    }
  };

  return (
    <motion.div {...inputAnimation} className="w-full max-w-md space-y-3">
      <p className="text-sm text-zinc-400">
        {label} (pick {maxSelect})
      </p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            className={`rounded-lg border px-3 py-3 text-sm transition-colors ${
              selected.includes(opt)
                ? "border-yellow-500 bg-yellow-500/20 text-yellow-300"
                : "border-zinc-700 bg-zinc-900/80 text-zinc-300 hover:border-zinc-500"
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
        className="w-full rounded-lg bg-yellow-500 py-3 font-bold text-black transition-colors hover:bg-yellow-400 disabled:opacity-30"
      >
        Lock it in · {selected.length}/{maxSelect}
      </button>
    </motion.div>
  );
}

function SingleSelect({
  config,
  onSubmit,
}: {
  config?: Record<string, unknown>;
  onSubmit: (v: unknown) => void;
}) {
  const options = (config?.options as string[]) ?? [];
  const label = (config?.label as string) ?? "Select one";
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <motion.div {...inputAnimation} className="w-full max-w-md space-y-3">
      <p className="text-sm text-zinc-400">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => setSelected(opt)}
            className={`rounded-lg border px-3 py-3 text-sm transition-colors ${
              selected === opt
                ? "border-yellow-500 bg-yellow-500/20 text-yellow-300"
                : "border-zinc-700 bg-zinc-900/80 text-zinc-300 hover:border-zinc-500"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      <button
        onClick={() => selected && onSubmit(selected)}
        disabled={!selected}
        className="w-full rounded-lg bg-yellow-500 py-3 font-bold text-black transition-colors hover:bg-yellow-400 disabled:opacity-30"
      >
        Lock it in
      </button>
    </motion.div>
  );
}

function InvestOrPass({ onSubmit }: { onSubmit: (v: unknown) => void }) {
  return (
    <motion.div
      {...inputAnimation}
      className="flex w-full max-w-md flex-col gap-4"
    >
      <p className="mb-3 text-center text-xs text-zinc-500">Would you invest in Nikhil?</p>
      <div className="flex w-full gap-4">
      <button
        onClick={() => onSubmit({ choice: "in" })}
        className="flex-1 rounded-lg border-2 border-green-500 bg-green-500/10 py-4 text-lg font-bold text-green-400 transition-colors hover:bg-green-500/20"
      >
        💰 I&apos;M IN
      </button>
      <button
        onClick={() => onSubmit({ choice: "out" })}
        className="flex-1 rounded-lg border-2 border-red-500 bg-red-500/10 py-4 text-lg font-bold text-red-400 transition-colors hover:bg-red-500/20"
      >
        🚫 I&apos;M OUT
      </button>
      </div>
    </motion.div>
  );
}

function MadLib({
  config,
  onSubmit,
}: {
  config?: Record<string, unknown>;
  onSubmit: (v: unknown) => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const stem = (config?.stem as string) ?? "";

  return (
    <motion.div {...inputAnimation} className="w-full max-w-md space-y-3">
      <p className="mb-1 text-xs text-zinc-500">Complete the sentence</p>
      <p className="text-base text-zinc-300">
        <span className="italic">&ldquo;{stem}</span>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="..."
          className="ml-1 inline-block w-full max-w-48 border-b-2 border-yellow-500 bg-transparent text-yellow-300 placeholder-zinc-600 focus:outline-none"
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
        className="w-full rounded-lg bg-yellow-500 py-3 font-bold text-black transition-colors hover:bg-yellow-400"
      >
        Next
      </button>
      {error && (
        <p className="text-center text-sm text-red-400">{error}</p>
      )}
    </motion.div>
  );
}

function LongTextWithAudio({
  config,
  onSubmit,
}: {
  config?: Record<string, unknown>;
  onSubmit: (v: unknown) => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const prompt = (config?.prompt as string) ?? "";

  return (
    <motion.div {...inputAnimation} className="w-full max-w-md space-y-3">
      <p className="text-base italic text-zinc-400">&ldquo;{prompt}&rdquo;</p>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Say what you've never said..."
        rows={4}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-white placeholder-zinc-500 focus:border-yellow-500 focus:outline-none"
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
        className="w-full rounded-lg bg-yellow-500 py-3 font-bold text-black transition-colors hover:bg-yellow-400"
      >
        Next
      </button>
      {error && (
        <p className="text-center text-sm text-red-400">{error}</p>
      )}
      <button
        onClick={() => onSubmit(null)}
        className="mt-1 text-xs text-zinc-600 hover:text-zinc-400"
      >
        Skip this one →
      </button>
    </motion.div>
  );
}

function TwoText({
  config,
  onSubmit,
}: {
  config?: Record<string, unknown>;
  onSubmit: (v: unknown) => void;
}) {
  const labels = (config?.labels as string[]) ?? ["First", "Second"];
  const [values, setValues] = useState(["", ""]);
  const [error, setError] = useState("");

  return (
    <motion.div {...inputAnimation} className="w-full max-w-md space-y-4">
      {labels.map((label, i) => (
        <div key={i}>
          <label className="mb-1 block text-sm text-zinc-400">{label}</label>
          <input
            type="text"
            value={values[i]}
            onChange={(e) => {
              const next = [...values];
              next[i] = e.target.value;
              setValues(next);
            }}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-white placeholder-zinc-500 focus:border-yellow-500 focus:outline-none"
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
        className="w-full rounded-lg bg-yellow-500 py-3 font-bold text-black transition-colors hover:bg-yellow-400"
      >
        Reveal
      </button>
      {error && (
        <p className="text-center text-sm text-red-400">{error}</p>
      )}
    </motion.div>
  );
}

function RelationshipPicker({
  config,
  onSubmit,
}: {
  config?: Record<string, unknown>;
  onSubmit: (v: unknown) => void;
}) {
  const options = (config?.options as string[]) ?? [];
  const [anonymous, setAnonymous] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <motion.div {...inputAnimation} className="w-full max-w-md space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => setSelected(opt)}
            className={`rounded-lg border px-3 py-3 text-sm transition-colors ${
              selected === opt
                ? "border-yellow-500 bg-yellow-500/20 text-yellow-300"
                : "border-zinc-700 bg-zinc-900/80 text-zinc-300 hover:border-zinc-500"
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
        className="w-full rounded-lg bg-yellow-500 py-3 font-bold text-black transition-colors hover:bg-yellow-400 disabled:opacity-30"
      >
        Continue
      </button>
    </motion.div>
  );
}

function SubmitButton({ onSubmit }: { onSubmit: (v: unknown) => void }) {
  return (
    <motion.button
      {...inputAnimation}
      onClick={() => onSubmit(true)}
      className="rounded-lg bg-yellow-500 px-8 py-4 text-lg font-bold uppercase tracking-wider text-black transition-colors hover:bg-yellow-400"
    >
      Review & Submit
    </motion.button>
  );
}

export function UIInput({ type, config, onSubmit }: UIInputProps) {
  const components: Record<UIType, React.ComponentType<{ config?: Record<string, unknown>; onSubmit: (v: unknown) => void }>> = {
    none: () => null,
    "start-button": StartButton,
    "continue-button": ContinueButton,
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
    "submit-button": SubmitButton,
  };

  const Component = components[type];
  if (!Component) return null;

  return <Component config={config} onSubmit={onSubmit} />;
}
