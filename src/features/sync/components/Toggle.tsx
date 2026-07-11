"use client";

import { cn } from "@/lib/utils";

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-caption font-medium transition-colors",
        checked
          ? "border-primary/40 bg-primary/12 text-primary"
          : "border-border-soft bg-surface-2 text-muted hover:border-border hover:text-fg",
      )}
    >
      <span
        className={cn(
          "relative inline-flex h-3 w-6 items-center rounded-full transition-colors",
          checked ? "bg-primary" : "bg-surface-3",
        )}
      >
        <span
          className={cn(
            "absolute h-2.5 w-2.5 rounded-full bg-fg transition-transform",
            checked ? "translate-x-3" : "translate-x-0.5",
          )}
        />
      </span>
      {label}
    </button>
  );
}
