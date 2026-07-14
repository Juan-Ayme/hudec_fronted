"use client";

import { cn } from "@/lib/utils";
import { money, num } from "@/lib/format";
import type { UnifiedNode } from "../types";

function KpiChip({
  label,
  value,
  tone,
  title,
}: {
  label: string;
  value: string;
  tone?: "danger" | "warning" | "primary";
  title?: string;
}) {
  const toneClass = tone
    ? {
        danger: "text-danger",
        warning: "text-warning",
        primary: "text-primary",
      }[tone]
    : "text-fg";
  return (
    <div
      title={title}
      className="flex items-baseline gap-1.5 rounded-lg border border-border-soft bg-surface-2/60 px-2.5 py-1.5"
    >
      <span className="text-[0.6rem] font-bold uppercase tracking-wider text-faint">{label}</span>
      <span className={cn("font-mono text-xs font-semibold tabular-nums", toneClass)}>{value}</span>
    </div>
  );
}

/**
 * KpiHeader — franja de KPIs de la categoría seleccionada (o del total).
 * Resurrección del `scopeKpis` que useComprasCatalogo calculaba y nunca
 * renderizaba, ahora alimentado por el nodo del árbol unificado.
 */
export function KpiHeader({
  node,
  showVentasMetrics,
}: {
  node: UnifiedNode | null;
  /** false en modo viewer: la venta proviene solo del subconjunto crítico. */
  showVentasMetrics: boolean;
}) {
  if (!node) return null;
  const pendientes = node.criticos + node.altas;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <KpiChip
        label={showVentasMetrics ? "Ventas 90d" : "Venta en riesgo"}
        value={money(node.ventas)}
      />
      <KpiChip
        label={showVentasMetrics ? "SKUs" : "SKUs críticos"}
        value={num(node.skuCount)}
      />
      <KpiChip
        label="Por reponer"
        value={num(pendientes)}
        tone={pendientes > 0 ? "danger" : undefined}
        title={`${num(node.criticos)} críticos · ${num(node.altas)} alta`}
      />
      {node.sugeridos > 0 && (
        <KpiChip label="Sugerido" value={`${num(node.sugeridos)} uds`} tone="primary" />
      )}
      {node.solicitados > 0 && (
        <KpiChip label="Solicitados" value={num(node.solicitados)} tone="warning" />
      )}
    </div>
  );
}
