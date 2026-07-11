"use client";

import { cn } from "@/lib/utils";

export function ActionCard({
  tone,
  icon,
  title,
  subtitle,
  meta,
  action,
  message,
}: {
  tone: "primary" | "violet";
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  meta: { label: string; value: string }[];
  action: React.ReactNode;
  message?: { kind: "ok" | "err"; text: string } | null;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-surface p-5",
        "animate-[fade-in-up_var(--duration-base)_var(--ease-premium)_both]",
        tone === "primary" ? "border-primary/25" : "border-violet/25",
      )}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full blur-2xl",
          tone === "primary" ? "bg-primary/15" : "bg-violet/15",
        )}
      />
      <div className="relative space-y-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-lg ring-1",
              tone === "primary"
                ? "bg-primary/15 text-primary ring-primary/30"
                : "bg-violet/15 text-violet ring-violet/30",
            )}
          >
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-h3 font-semibold text-fg">{title}</h3>
            <p className="text-caption text-muted">{subtitle}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {meta.map((m) => (
            <div
              key={m.label}
              className="rounded-md border border-border-soft bg-surface-2 px-2 py-1 text-caption"
            >
              <span className="text-faint">{m.label}: </span>
              <span className="font-medium text-fg">{m.value}</span>
            </div>
          ))}
        </div>

        <div>{action}</div>

        {message && (
          <p
            className={cn(
              "rounded-md border px-3 py-1.5 text-xs",
              message.kind === "ok"
                ? "border-success/30 bg-success/10 text-success"
                : "border-danger/30 bg-danger/10 text-danger",
            )}
          >
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}
