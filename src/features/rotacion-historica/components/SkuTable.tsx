"use client";

import {
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
} from "lucide-react";
import { money, num, pct } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { RotacionHistoricaSku } from "@/lib/types";

const RENDER_CAP = 200;

function tendenciaTone(t: string | null): { Icon: typeof TrendingUpIcon | null; color: string } {
  if (!t) return { Icon: null, color: "text-faint" };
  if (t === "Creciendo" || t === "Inicio en 2ª mitad")
    return { Icon: TrendingUpIcon, color: "text-success" };
  if (t === "Decayendo" || t === "Murió en 1ª mitad")
    return { Icon: TrendingDownIcon, color: "text-danger" };
  return { Icon: null, color: "text-muted" };
}

function paretoTone(p: "A" | "B" | "C"): string {
  if (p === "A") return "bg-success/15 text-success border-success/25";
  if (p === "B") return "bg-info/15 text-info border-info/25";
  return "bg-surface-3 text-muted border-border-soft";
}

export function SkuTable({ rows }: { rows: RotacionHistoricaSku[] }) {
  const shown = rows.slice(0, RENDER_CAP);
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-border/40 text-[10px] font-bold uppercase tracking-wider text-faint">
            <th className="py-2 pr-2">#</th>
            <th className="py-2 pr-2">Producto</th>
            <th className="py-2 px-2">Pareto</th>
            <th className="py-2 px-2 text-right">Unds</th>
            <th className="py-2 px-2 text-right">Vendido S/</th>
            <th className="py-2 px-2 text-right">% Cat</th>
            <th className="py-2 px-2 text-right">Vel u/día</th>
            <th className="py-2 px-2 text-right">Días vendió</th>
            <th className="py-2 pl-2">Tendencia</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((s) => {
            const { Icon: TendIcon, color: tendColor } = tendenciaTone(s.tendencia);
            return (
              <tr
                key={`${s.sucursal}-${s.sku}`}
                className="group border-b border-border/20 transition-colors hover:bg-surface-3/45"
              >
                <td className="py-2.5 pr-2 text-right tabular-nums text-faint">
                  {s.rank_sucursal}
                </td>
                <td className="py-2.5 pr-2 min-w-[220px] max-w-[340px]">
                  <p className="truncate font-semibold text-fg">{s.producto}</p>
                  <p className="font-mono text-[9px] text-faint">
                    {s.sku}
                    {s.categoria ? ` · ${s.categoria}` : ""}
                    {s.subcategoria ? ` · ${s.subcategoria}` : ""}
                  </p>
                </td>
                <td className="py-2.5 px-2">
                  <span
                    className={cn(
                      "inline-block rounded border px-1.5 py-0.5 text-[0.62rem] font-bold",
                      paretoTone(s.pareto),
                    )}
                  >
                    {s.pareto} · {pct(s.pct_acum)}
                  </span>
                </td>
                <td className="py-2.5 px-2 text-right tabular-nums text-muted">
                  {num(s.unds_vendidas)}
                </td>
                <td className="py-2.5 px-2 text-right tabular-nums font-semibold text-fg">
                  {money(s.vendido_sku_soles)}
                </td>
                <td className="py-2.5 px-2 text-right tabular-nums text-muted">
                  {pct(s.pct_en_cat)}
                </td>
                <td className="py-2.5 px-2 text-right tabular-nums text-muted">
                  {s.velocidad_uds_dia.toFixed(2)}
                </td>
                <td className="py-2.5 px-2 text-right tabular-nums text-muted">
                  {num(s.dias_con_venta)}{" "}
                  <span className="text-[10px] text-faint">
                    ({pct(s.pct_frecuencia)})
                  </span>
                </td>
                <td className="py-2.5 pl-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-[11px]",
                      tendColor,
                    )}
                  >
                    {TendIcon ? <TendIcon className="h-3 w-3" /> : null}
                    {s.tendencia ?? "—"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length > RENDER_CAP && (
        <p className="mt-3 text-center text-xs text-faint">
          Mostrando los primeros {num(RENDER_CAP)} de {num(rows.length)}. Refiná los filtros para ver el resto.
        </p>
      )}
    </div>
  );
}
