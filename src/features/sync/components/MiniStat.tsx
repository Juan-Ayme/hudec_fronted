"use client";

import { cn } from "@/lib/utils";

export function MiniStat({
  icon,
  label,
  value,
  tone,
  mono = true,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tone: "success" | "danger" | "info" | "neutral" | "primary";
  mono?: boolean;
}) {
  const ring =
    tone === "success"
      ? "ring-success/30 text-success"
      : tone === "danger"
        ? "ring-danger/30 text-danger"
        : tone === "info"
          ? "ring-info/30 text-info"
          : tone === "primary"
            ? "ring-primary/30 text-primary"
            : "ring-border-soft text-muted";
  return (
    <div
      className={cn(
        "rounded-xl border border-border-soft bg-surface px-3 py-3",
        "animate-[fade-in-up_var(--duration-base)_var(--ease-premium)_both]",
      )}
    >
      <p className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-[0.08em] text-muted">
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-md ring-1",
            ring,
          )}
        >
          {icon}
        </span>
        {label}
      </p>
      <p
        className={cn(
          "mt-2 text-h3 font-semibold text-fg",
          mono && "font-mono tabular-nums",
        )}
      >
        {value}
      </p>
    </div>
  );
}
