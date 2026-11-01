"use client";

import { Coins, ShoppingCart, Boxes, Repeat } from "lucide-react";
import { KpiStat } from "@/components/ui/kpi-stat";
import { Badge } from "@/components/ui/badge";
import { money, num } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { EcosistemaKpis as Kpis, EcosistemaVeredicto } from "@/lib/bi-types";
import { VEREDICTO_ECO, VEREDICTO_ECO_ORDER } from "./veredicto-eco";

const mult = (v: number | null) => (v == null ? "—" : `${v.toFixed(2)}×`);

/** Fila de KPIs (totales + multiplicador global) y chips por veredicto que
 *  filtran la tabla. El chip activo queda resaltado con un anillo. */
export function EcosistemaKpis({
  kpis,
  filtro,
  onFiltro,
}: {
  kpis: Kpis;
  filtro: EcosistemaVeredicto | null;
  onFiltro: (v: EcosistemaVeredicto | null) => void;
}) {
  const chips = VEREDICTO_ECO_ORDER.filter((v) => (kpis.por_veredicto[v] ?? 0) > 0);

  return (
    <div className="mb-6 space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiStat
          label="Venta total"
          value={money(kpis.venta_total_pen)}
          icon={Coins}
          tone="success"
          sub="Retail, con IGV"
        />
        <KpiStat
          label="Compra total"
          value={money(kpis.compra_total_pen)}
          icon={ShoppingCart}
          tone="primary"
          sub="A costo, compra real"
        />
        <KpiStat
          label="Stock actual"
          value={money(kpis.stock_total_pen)}
          icon={Boxes}
          tone="info"
          sub="Valorizado a costo"
        />
        <KpiStat
          label="Multiplicador global"
          value={mult(kpis.multiplicador_global)}
          icon={Repeat}
          tone="violet"
          sub="Venta / compra · equilibrio ≈ 1.8×"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-caption font-semibold uppercase tracking-[0.08em] text-muted">
          {num(kpis.filas)} filas
        </span>
        <span className="text-faint">·</span>
        {chips.map((v) => {
          const meta = VEREDICTO_ECO[v];
          const Icon = meta.icon;
          const active = filtro === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => onFiltro(active ? null : v)}
              title={meta.desc}
              aria-pressed={active}
              className={cn(
                "rounded-sm transition-transform duration-200 active:scale-[0.97]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                active && "ring-2 ring-white/50 ring-offset-1 ring-offset-bg",
                !active && filtro != null && "opacity-45 hover:opacity-100",
              )}
            >
              <Badge tone={meta.tone} className="cursor-pointer gap-1">
                <Icon className="h-3 w-3" aria-hidden="true" />
                {meta.label}
                <span className="font-bold tabular-nums">{kpis.por_veredicto[v]}</span>
              </Badge>
            </button>
          );
        })}
        {filtro != null && (
          <button
            type="button"
            onClick={() => onFiltro(null)}
            className="text-caption text-muted underline decoration-dotted underline-offset-2 hover:text-fg"
          >
            limpiar filtro
          </button>
        )}
      </div>
    </div>
  );
}
