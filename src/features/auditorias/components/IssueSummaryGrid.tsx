"use client";

import { num } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AuditResponse } from "@/lib/types";
import { ISSUE_LABELS, SOURCE_STYLE, FALLBACK_META } from "../lib";

/** Resumen de conteos por tipo de issue. */
export function IssueSummaryGrid({
  summary,
  meta,
}: {
  summary: AuditResponse["summary"];
  meta: AuditResponse["meta"];
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Object.entries(summary).map(([key, count]) => {
        const active = count > 0;
        const m = meta?.[key] ?? FALLBACK_META;
        const style = SOURCE_STYLE[m.source];
        return (
          <div
            key={key}
            className={cn(
              "rounded-xl border p-4",
              active
                ? "border-warning/30 bg-surface"
                : "border-border bg-surface/60",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <p
                className={cn(
                  "text-2xl font-semibold",
                  active ? "text-fg" : "text-faint",
                )}
              >
                {num(count)}
              </p>
              {active && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold",
                    style.chip,
                  )}
                  title={style.label}
                >
                  <style.icon className="h-3 w-3" />
                  {style.short}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted">
              {ISSUE_LABELS[key] ?? key}
            </p>
          </div>
        );
      })}
    </div>
  );
}
