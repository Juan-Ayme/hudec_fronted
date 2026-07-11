"use client";

import { num } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { IssueSource } from "@/lib/types";
import { SOURCE_STYLE } from "../lib";

/* ─────────────────────── KPI card por ORIGEN ─────────────────────── */

export function OriginCard({ source, count }: { source: IssueSource; count: number }) {
  const s = SOURCE_STYLE[source];
  const active = count > 0;
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border p-4",
        active ? "bg-surface" : "bg-surface/60 border-border",
        active && source === "bsale" && "border-info/30",
        active && source === "local_db" && "border-violet/30",
        active && source === "both" && "border-warning/30",
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg border",
          s.chip,
        )}
      >
        <s.icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className={cn("text-2xl font-semibold leading-tight", active ? "text-fg" : "text-faint")}>
          {num(count)}
        </p>
        <p className="truncate text-xs text-muted">{s.label}</p>
      </div>
    </div>
  );
}
