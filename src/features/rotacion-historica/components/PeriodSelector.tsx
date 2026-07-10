"use client";

import type { Dispatch, SetStateAction } from "react";
import { Calendar } from "lucide-react";
import { dateShort } from "@/lib/format";
import { Card, CardBody } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { RotacionHistoricaMeta } from "@/lib/types";
import { CURRENT_YEAR, PRESETS, yearRange } from "../lib";

export function PeriodSelector({
  presetId,
  setPresetId,
  customRange,
  setCustomRange,
  range,
  meta,
}: {
  presetId: string;
  setPresetId: Dispatch<SetStateAction<string>>;
  customRange: { from: string; to: string } | null;
  setCustomRange: Dispatch<SetStateAction<{ from: string; to: string } | null>>;
  range: { from: string; to: string };
  meta: RotacionHistoricaMeta | undefined;
}) {
  return (
    <Card className="mb-6">
      <CardBody className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-[0.08em] text-muted">
            <Calendar className="h-3.5 w-3.5" />
            Período
          </span>
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setPresetId(p.id);
                setCustomRange(null);
              }}
              className={cn(
                "rounded-md border px-3 py-1 text-xs font-medium transition-colors",
                presetId === p.id
                  ? "border-primary/40 bg-primary/12 text-primary"
                  : "border-border-soft bg-surface-2 text-muted hover:border-border hover:text-fg",
              )}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={() => {
              if (presetId !== "custom") {
                // Inicializar custom con la ventana actual
                const cur = PRESETS.find((p) => p.id === presetId)?.range();
                setCustomRange(cur ?? yearRange(CURRENT_YEAR - 1));
                setPresetId("custom");
              }
            }}
            className={cn(
              "rounded-md border px-3 py-1 text-xs font-medium transition-colors",
              presetId === "custom"
                ? "border-primary/40 bg-primary/12 text-primary"
                : "border-border-soft bg-surface-2 text-muted hover:border-border hover:text-fg",
            )}
          >
            Custom
          </button>
        </div>

        {presetId === "custom" && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <label className="flex items-center gap-1.5 text-muted">
              Desde
              <input
                type="date"
                value={customRange?.from ?? ""}
                onChange={(e) =>
                  setCustomRange((c) => ({
                    from: e.target.value,
                    to: c?.to ?? e.target.value,
                  }))
                }
                className="rounded-md border border-border-soft bg-surface-2 px-2 py-1 text-fg"
              />
            </label>
            <label className="flex items-center gap-1.5 text-muted">
              Hasta
              <input
                type="date"
                value={customRange?.to ?? ""}
                onChange={(e) =>
                  setCustomRange((c) => ({
                    from: c?.from ?? e.target.value,
                    to: e.target.value,
                  }))
                }
                className="rounded-md border border-border-soft bg-surface-2 px-2 py-1 text-fg"
              />
            </label>
          </div>
        )}

        <div className="rounded-md bg-surface-2 px-3 py-1.5 text-xs">
          <span className="text-faint">Ventana activa: </span>
          <span className="font-semibold text-fg">
            {dateShort(range.from)} → {dateShort(range.to)}
          </span>
          {meta && (
            <span className="ml-2 text-faint">
              ({meta.dias_ventana} días)
            </span>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
