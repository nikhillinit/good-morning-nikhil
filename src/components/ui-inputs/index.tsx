"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { UIType } from "@/data/screens";
import { uiReveal, errorShake } from "@/lib/animations";

interface UIInputProps {
  type: UIType;
  config?: Record<string, unknown>;
  initialValue?: unknown;
  onSubmit: (value: unknown) => void;
}

import { PrimaryButton, InputField, ChoiceChip, SecondaryButton } from "@/components/primitives";

/* ── Components ─────────────────────────────────────────────────── */

function StartButton({
  config,
  onSubmit,
}: {
  config?: Record<string, unknown>;
  initialValue?: unknown;
  onSubmit: (v: unknown) => void;
}) {
  const label =
    typeof config?.label === "string" ? config.label : "Start Episode";

  return (
    <PrimaryButton
      {...uiReveal}
      onClick={() => onSubmit(true)}
      className="text-display px-10 py-5 text-2xl"
    >
      {label}
    </PrimaryButton>
  );
}

function ContinueButton({
  config,
  onSubmit
}: {
  config?: Record<string, unknown>;
  onSubmit: (v: unknown) => void;
}) {
  const promptText = typeof config?.prompt === "string" ? config.prompt : undefined;
  
  return (
    <motion.div {...uiReveal} className="space-y-3 text-center">
      <SecondaryButton
        onClick={() => onSubmit(true)}
        className="border-accent/20 bg-accent/10 text-accent hover:bg-accent/20 hover:text-accent backdrop-blur-md"
      >
        {typeof config?.label === "string" ? config.label : "Continue →"}
      </SecondaryButton>
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
  const [shakeKey, setShakeKey] = useState(0);
  const placeholders = (config?.placeholder as string[]) ?? ["#1", "#2", "#3"];

  const submitAction = () => {
    const filled = values.filter((v) => v.trim());
    if (filled.length < 1) {
      setError("Give us at least one");
      setShakeKey(prev => prev + 1);
      return;
    }
    setError("");
    onSubmit(filled);
  };

  return (
    <motion.div {...uiReveal} className="w-full max-w-md space-y-4" style={{ perspective: "1000px" }}>
      <motion.div 
        key={shakeKey} 
        variants={errorShake} 
        initial="initial" 
        animate={shakeKey > 0 ? "animate" : "initial"}
        className="space-y-3"
      >
        {values.map((val, i) => (
          <motion.div 
            key={i}
            whileFocus={{ scale: 1.02 }}
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative"
          >
            <InputField
              type="text"
              value={val}
              onChange={(e) => {
                const next = [...values];
                next[i] = e.target.value.toUpperCase();
                setValues(next);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  submitAction();
                }
              }}
              placeholder={placeholders[i]}
              className="px-6 py-4 text-center font-display text-2xl font-black tracking-widest text-accent uppercase"
            />
          </motion.div>
        ))}
      </motion.div>
      <PrimaryButton onClick={submitAction}>
        Lock it in
      </PrimaryButton>
      {error && (
        <p className="text-center font-bold text-sm text-error drop-shadow-md">{error}</p>
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
  const [shakeKey, setShakeKey] = useState(0);
  const placeholder = (config?.placeholder as string) ?? "";

  const submitAction = () => {
    if (!value.trim()) {
      setError("Type something first");
      setShakeKey(prev => prev + 1);
      return;
    }
    setError("");
    onSubmit(value.trim());
  };

  return (
    <motion.div {...uiReveal} className="w-full max-w-md space-y-3">
      <motion.div 
        key={shakeKey} 
        variants={errorShake} 
        initial="initial" 
        animate={shakeKey > 0 ? "animate" : "initial"}
      >
        <InputField
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submitAction();
          }}
          placeholder={placeholder}
        />
      </motion.div>
      <PrimaryButton onClick={submitAction}>
        Lock it in
      </PrimaryButton>
      {error && (
        <p className="text-center text-sm text-error">{error}</p>
      )}
      <SecondaryButton onClick={() => onSubmit(null)}>
        Skip this one →
      </SecondaryButton>
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
  const [shakeKey, setShakeKey] = useState(0);
  const placeholder = (config?.placeholder as string) ?? "";

  const submitAction = () => {
    if (!value.trim()) {
      setError("Type something first");
      setShakeKey(prev => prev + 1);
      return;
    }
    setError("");
    onSubmit(value.trim());
  };

  return (
    <motion.div {...uiReveal} className="w-full max-w-md space-y-3">
      <motion.div 
        key={shakeKey} 
        variants={errorShake} 
        initial="initial" 
        animate={shakeKey > 0 ? "animate" : "initial"}
      >
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
             // In textareas, Shift+Enter usually means new line, but standard Enter means submit. Let's let them type, so Enter is newline. 
             // Gamified mechanic: Ctrl+Enter or Cmd+Enter to submit.
             if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitAction();
          }}
          placeholder={placeholder}
          rows={3}
          className="w-full rounded-lg border border-surface-hover bg-surface/80 px-4 py-3 text-foreground placeholder-muted transition-all duration-300 ease-out focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/20"
        />
      </motion.div>
      <PrimaryButton onClick={submitAction}>
        Lock it in
      </PrimaryButton>
      {error && (
        <p className="text-center text-sm text-error">{error}</p>
      )}
      <SecondaryButton onClick={() => onSubmit(null)}>
        Skip this one →
      </SecondaryButton>
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
      <p className="text-body">
        {label} (pick {maxSelect})
      </p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => (
          <ChoiceChip
            key={opt}
            onClick={() => toggle(opt)}
            selected={selected.includes(opt)}
          >
            {selected.includes(opt) && <span className="mr-1">✓</span>}
            {opt}
          </ChoiceChip>
        ))}
      </div>
      <PrimaryButton
        onClick={() => selected.length === maxSelect && onSubmit(selected)}
        disabled={selected.length !== maxSelect}
      >
        Lock it in · {selected.length}/{maxSelect}
      </PrimaryButton>
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
      <p className="text-body">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => (
          <ChoiceChip
            key={opt}
            onClick={() => setSelected(opt)}
            selected={selected === opt}
          >
            {opt}
          </ChoiceChip>
        ))}
      </div>
      <PrimaryButton
        onClick={() => selected && onSubmit(selected)}
        disabled={!selected}
      >
        Lock it in
      </PrimaryButton>
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
      <p className="mb-3 text-center text-caption text-muted">Would you invest in Nikhil?</p>
      <div className="flex w-full gap-4">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setSelected("in")}
        className={`font-display flex-1 rounded-lg border-2 py-4 text-xl transition-colors ${
          selected === "in"
            ? "border-success bg-success-soft text-foreground"
            : "border-success bg-success-soft/40 text-success hover:bg-success-soft"
        }`}
      >
        I&apos;M IN
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setSelected("out")}
        className={`font-display flex-1 rounded-lg border-2 py-4 text-xl transition-colors ${
          selected === "out"
            ? "border-danger bg-danger-soft text-danger-foreground"
            : "border-danger bg-danger-soft/40 text-danger hover:bg-danger-soft"
        }`}
      >
        I&apos;M OUT
      </motion.button>
      </div>
      <PrimaryButton
        onClick={() => selected && onSubmit({ choice: selected })}
        disabled={!selected}
      >
        Lock it in
      </PrimaryButton>
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
      <p className="mb-1 text-caption text-muted">Complete the sentence</p>
      <p className="text-base text-foreground">
        <span className="italic">&ldquo;{stem}</span>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="..."
          className="ml-1 inline-block w-full max-w-64 border-b-2 border-accent bg-transparent text-accent placeholder-muted focus:outline-none"
        />
        <span className="italic">&rdquo;</span>
      </p>
      <PrimaryButton
        onClick={() => {
          if (!value.trim()) {
            setError("Complete the thought");
            return;
          }
          setError("");
          onSubmit(value.trim());
        }}
      >
        Lock it in
      </PrimaryButton>
      {error && (
        <p className="text-center text-sm text-error">{error}</p>
      )}
    </motion.div>
  );
}

import { VoiceRecorder } from "./VoiceRecorder";

function LongTextWithAudio({
  config,
  initialValue,
  onSubmit,
}: {
  config?: Record<string, unknown>;
  initialValue?: unknown;
  onSubmit: (v: unknown) => void;
}) {
  const prompt = (config?.prompt as string) ?? "Record your answer";
  const maxSeconds = (config?.maxSeconds as number) ?? 15;
  
  return (
    <div className="w-full max-w-md">
      <VoiceRecorder
        prompt={prompt}
        maxSeconds={maxSeconds}
        initialValue={initialValue}
        onSubmit={onSubmit}
      />
    </div>
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
          <label htmlFor={`two-text-${i}`} className="mb-1 block text-body">{label}</label>
          <InputField
            id={`two-text-${i}`}
            type="text"
            value={values[i]}
            onChange={(e) => {
              const next = [...values];
              next[i] = e.target.value;
              setValues(next);
            }}
          />
        </div>
      ))}
      <PrimaryButton
        onClick={() => {
          if (!values.every((v) => v.trim())) {
            setError("Both sides of the story");
            return;
          }
          setError("");
          onSubmit(values);
        }}
      >
        Lock it in
      </PrimaryButton>
      {error && (
        <p className="text-center text-sm text-error">{error}</p>
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
  const showAnonymousToggle =
    typeof config?.showAnonymousToggle === "boolean"
      ? config.showAnonymousToggle
      : true;
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
    <motion.div {...uiReveal} className="w-full max-w-3xl mx-auto space-y-6 font-display uppercase tracking-widest pt-8 sm:pt-12">
      <div className="grid grid-cols-2 gap-x-6 gap-y-6 justify-items-center">
        {options.map((opt) => (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            key={opt}
            onClick={() => setSelected(opt)}
            className={`w-full max-w-[280px] px-4 py-4 rounded-full border-[6px] text-lg sm:text-xl text-center transition-all font-bold ${
              selected === opt 
                ? 'bg-surface border-surface text-accent drop-shadow-[0_4px_0_rgba(0,0,0,0.2)]' 
                : 'bg-transparent border-surface text-foreground hover:bg-surface/30 drop-shadow-none'
            }`}
          >
            {opt}
          </motion.button>
        ))}
      </div>
      
      <div className="flex flex-col items-center gap-5 pt-4">
        {showAnonymousToggle && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => setAnonymous((prev) => !prev)}
            className={`w-full max-w-[320px] px-4 py-3 rounded-full border-[6px] text-sm sm:text-base text-center transition-all font-bold ${
              anonymous 
                ? 'bg-surface border-surface text-accent drop-shadow-[0_4px_0_rgba(0,0,0,0.2)]' 
                : 'bg-transparent border-surface-hover text-muted hover:bg-surface/30 drop-shadow-none'
            }`}
          >
            ANONYMITY: {anonymous ? 'ON' : 'OFF'}
          </motion.button>
        )}

        <PrimaryButton
          onClick={() => selected && onSubmit({ relationship: selected, anonymous })}
          disabled={!selected}
          className="w-full max-w-[320px] rounded-full text-xl sm:text-2xl tracking-[0.2em]"
        >
          {selected ? 'TUNE IN' : 'SELECT TO CONTINUE'}
        </PrimaryButton>
      </div>
    </motion.div>
  );
}

function SubmitButton({ onSubmit }: { onSubmit: (v: unknown) => void }) {
  return (
    <PrimaryButton
      onClick={() => onSubmit(true)}
    >
      Review & Submit
    </PrimaryButton>
  );
}

export function UIInput({ type, config, initialValue, onSubmit }: UIInputProps) {
  const components: Record<UIType, React.ComponentType<{ config?: Record<string, unknown>; initialValue?: unknown; onSubmit: (v: unknown) => void }>> = {
    none: () => null,
    "start-button": StartButton,
    "continue-button": ({ config, onSubmit: submit }) => <ContinueButton config={config} onSubmit={submit} />,
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
