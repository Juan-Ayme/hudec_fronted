"use client";

import { useSyncExternalStore } from "react";

// Paleta y tooltip compartidos para todos los gráficos (Recharts).

const noopSubscribe = () => () => {};

/**
 * Devuelve false durante el render en servidor y true en el cliente, sin
 * efectos. Evita renderizar Recharts durante el prerender (donde el contenedor
 * mide -1 y emite warnings) y previene mismatches de hidratación.
 */
export function useMounted() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export const CHART_COLORS = [
  "#3b82f6", // Blue 500 (Primary)
  "#0ea5e9", // Sky 500 (Accent)
  "#06b6d4", // Cyan 500
  "#6366f1", // Indigo 500
  "#8b5cf6", // Violet 500
  "#38bdf8", // Sky 400
  "#818cf8", // Indigo 400
  "#a855f7", // Purple 500
  "#22d3ee", // Cyan 400
];

export const AXIS_PROPS = {
  stroke: "#5a6577",
  tick: { fill: "#8a98ae", fontSize: 11 },
  tickLine: false,
  axisLine: { stroke: "#233044" },
} as const;

export const GRID_PROPS = {
  stroke: "#ffffff0a",
  strokeDasharray: "3 3",
  vertical: false,
} as const;

interface TooltipEntry {
  name?: string | number;
  value?: number | string;
  color?: string;
  payload?: Record<string, unknown>;
}

export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  formatter?: (value: number | string, name: string) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl border border-border-soft bg-surface-2/90 px-4 py-3 text-xs shadow-2xl backdrop-blur-md">
      {label !== undefined && label !== "" && (
        <p className="mb-2 font-bold text-fg/90">{label}</p>
      )}
      <div className="flex flex-col gap-1.5">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-[3px] shadow-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="font-medium text-muted">{entry.name}:</span>
            <span className="font-bold text-fg tabular-nums ml-auto pl-4">
              {formatter
                ? formatter(entry.value ?? "", String(entry.name ?? ""))
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
