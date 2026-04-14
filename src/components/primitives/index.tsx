import { ComponentProps, forwardRef } from "react";
import { motion, HTMLMotionProps } from "framer-motion";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/* ── Primary Button ────────────────────────────────────────────── */

export const PrimaryButton = forwardRef<HTMLButtonElement, HTMLMotionProps<"button">>(
  ({ className, children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        className={cn(
          "min-h-[48px] w-full rounded-lg bg-accent px-8 py-3 font-bold text-black shadow-none transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02] hover:bg-accent-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 glow-accent",
          className
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);
PrimaryButton.displayName = "PrimaryButton";

/* ── Secondary Button ──────────────────────────────────────────── */

export const SecondaryButton = forwardRef<HTMLButtonElement, ComponentProps<"button">>(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "flex min-h-[48px] w-full items-center justify-center rounded-lg border border-surface-hover bg-transparent px-8 py-3 text-sm font-medium text-muted transition-colors duration-300 hover:bg-surface hover:text-foreground",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
SecondaryButton.displayName = "SecondaryButton";

/* ── Input Field ───────────────────────────────────────────────── */

export const InputField = forwardRef<HTMLInputElement, ComponentProps<"input">>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "min-h-[48px] w-full rounded-lg border border-surface-hover bg-surface/80 px-4 py-3 text-foreground placeholder-muted transition-all duration-300 ease-out focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/20",
          className
        )}
        {...props}
      />
    );
  }
);
InputField.displayName = "InputField";

/* ── Choice Chip ───────────────────────────────────────────────── */

interface ChoiceChipProps extends HTMLMotionProps<"button"> {
  selected?: boolean;
}

export const ChoiceChip = forwardRef<HTMLButtonElement, ChoiceChipProps>(
  ({ className, selected = false, children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        className={cn(
          "flex min-h-[48px] w-full cursor-pointer items-center justify-center rounded-lg border px-3 py-3 text-sm transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02] active:scale-[0.98]",
          selected
            ? "border-accent bg-accent/20 text-accent shadow-[0_0_15px_var(--color-accent)]"
            : "border-surface-hover bg-surface/80 text-muted hover:border-muted hover:bg-surface",
          className
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);
ChoiceChip.displayName = "ChoiceChip";
