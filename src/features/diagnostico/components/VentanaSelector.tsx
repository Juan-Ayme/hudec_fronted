"use client";

import { cn } from "@/lib/utils";
import type { VentanaDias, TopNLista } from "../hooks/useDiagnosis";

/** Chips para elegir la ventana de análisis (7d / 14d / 28d) + top_n del listado. */
export function VentanaSelector({
  days,
  onDaysChange,
  topN,
  onTopNChange,
}: {
  days: VentanaDias;
  onDaysChange: (d: VentanaDias) => void;
  topN: TopNLista;
  onTopNChange: (n: TopNLista) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-caption font-semibold uppercase tracking-wider text-faint">
          Analizar últimos
        </span>
        <ChipGroup
          value={days}
          options={[7, 14, 28] as const}
          onChange={(v) => onDaysChange(v as VentanaDias)}
          formatLabel={(v) => `${v} días`}
        />
      </div>
      <div className="flex items-center gap-2">
        <span
          className="cursor-help text-caption font-semibold uppercase tracking-wider text-faint"
          title="Cantidad de filas a mostrar en cada tabla"
        >
          Filas por tabla
        </span>
        <ChipGroup
          value={topN}
          options={[10, 20, 50] as const}
          onChange={(v) => onTopNChange(v as TopNLista)}
          formatLabel={(v) => String(v)}
        />
      </div>
    </div>
  );
}

function ChipGroup<T extends number>({
  value,
  options,
  onChange,
  formatLabel,
}: {
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  formatLabel: (v: T) => string;
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-md border border-border-soft bg-surface-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={cn(
            "px-3 py-1 text-caption font-semibold transition-colors",
            value === opt
              ? "bg-primary text-primary-fg"
              : "text-muted hover:bg-surface-3 hover:text-fg",
          )}
        >
          {formatLabel(opt)}
        </button>
      ))}
    </div>
  );
}
