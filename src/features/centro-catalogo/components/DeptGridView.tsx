"use client";

import { AlertTriangle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { money, num, pct } from "@/lib/format";
import { DEPT_COLORS } from "@/features/ventas-jerarquicas/components/ProgressBar";
import type { UnifiedNode } from "../types";
import type { Selection } from "@/lib/types";

/**
 * Vista de cuadrícula de departamentos — se muestra en el estado ROOT
 * (sin departamento seleccionado) como alternativa visual al árbol colapsado.
 * Cada tarjeta es un punto de entrada rápido al departamento.
 */
export function DeptGridView({
  tree,
  onSelect,
}: {
  tree: UnifiedNode[];
  onSelect: (s: Selection) => void;
  hasMatrix: boolean;
}) {
  if (tree.length === 0) return null;

  const totalVentas = tree.reduce((a, d) => a + d.ventas, 0);

  return (
    <div className="grid grid-cols-2 gap-2 p-1">
      {tree.map((dept, i) => {
        const tone = DEPT_COLORS[i % DEPT_COLORS.length];
        const pendientes = dept.criticos + dept.altas;
        const fraction = totalVentas > 0 ? dept.ventas / totalVentas : 0;

        return (
          <button
            key={dept.name}
            onClick={() => onSelect({ dept: dept.name, cat: null, subcat: null })}
            className={cn(
              "group relative flex flex-col rounded-xl border border-white/5 p-3 text-left",
              "transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
              "hover:border-white/15 hover:bg-white/[0.04] hover:shadow-lg hover:shadow-black/20",
              "active:scale-[0.97]",
            )}
          >
            {/* Header: dot + name */}
            <div className="flex items-center gap-2 mb-2">
              <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full shadow-sm", tone.dot)} />
              <p className="truncate text-[0.75rem] font-semibold text-fg/90 group-hover:text-fg">
                {dept.name}
              </p>
            </div>

            {/* Sales amount */}
            <p className="font-mono text-base font-bold tabular-nums text-fg mb-1.5">
              {money(dept.ventas)}
            </p>

            {/* Progress bar */}
            <div className="flex items-center gap-2 mb-2">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-3">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    `bg-gradient-to-r from-white/10`,
                    tone.dot,
                  )}
                  style={{ width: `${Math.max(fraction * 100, 2)}%` }}
                />
              </div>
              <span className="text-[0.55rem] tabular-nums text-faint shrink-0">
                {pct(fraction * 100)}
              </span>
            </div>

            {/* Footer: SKUs + alerts */}
            <div className="flex items-center justify-between">
              <span className="text-[0.6rem] text-faint tabular-nums">
                {num(dept.skuCount)} SKUs
              </span>
              <div className="flex items-center gap-1.5">
                {pendientes > 0 && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-danger/15 px-1.5 py-0.5 text-[0.55rem] font-bold tabular-nums text-danger">
                    <AlertTriangle className="h-2.5 w-2.5" />
                    {num(pendientes)}
                  </span>
                )}
                <ArrowRight className="h-3 w-3 text-faint opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
