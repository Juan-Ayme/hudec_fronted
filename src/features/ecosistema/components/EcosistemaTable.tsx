"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/states";
import { money, num, pct } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  EcosistemaItem,
  EcosistemaNivel,
  EcosistemaVeredicto,
} from "@/lib/bi-types";
import { VeredictoEcoBadge } from "./VeredictoEcoBadge";

const SIN = "Sin clasificar";

/** Nombre de la fila (nivel más profundo) + ruta de sus padres. */
function dimNombre(row: EcosistemaItem, nivel: EcosistemaNivel): string {
  if (nivel === "subcategoria") return row.subcategory ?? SIN;
  if (nivel === "categoria") return row.category ?? SIN;
  return row.department ?? SIN;
}
function dimRuta(row: EcosistemaItem, nivel: EcosistemaNivel): string | null {
  if (nivel === "subcategoria")
    return `${row.department ?? SIN} › ${row.category ?? SIN}`;
  if (nivel === "categoria") return row.department ?? SIN;
  return null;
}

type SortKey =
  | "dim"
  | "venta_pen"
  | "compra_pen"
  | "stock_pen"
  | "unds_vendidas"
  | "unds_compradas"
  | "unds_stock"
  | "multiplicador"
  | "sellthrough_pct"
  | "meses_cobertura";

interface Col {
  key: SortKey;
  header: string;
  align: "left" | "right";
  /** Ayuda en el header (tooltip). */
  hint?: string;
}

const COLS: Col[] = [
  { key: "dim", header: "Dimensión", align: "left" },
  { key: "venta_pen", header: "Venta S/", align: "right", hint: "Venta retail (con IGV)" },
  { key: "compra_pen", header: "Compra S/", align: "right", hint: "Compra a costo (compra real)" },
  { key: "stock_pen", header: "Stock S/", align: "right", hint: "Stock actual valorizado a costo" },
  { key: "unds_vendidas", header: "Uds vend.", align: "right" },
  { key: "unds_compradas", header: "Uds comp.", align: "right" },
  { key: "unds_stock", header: "Uds stock", align: "right" },
  { key: "multiplicador", header: "Mult.", align: "right", hint: "Venta / compra · equilibrio ≈ 1.8×" },
  { key: "sellthrough_pct", header: "Sellthrough", align: "right", hint: "% de lo comprado que ya se vendió" },
  { key: "meses_cobertura", header: "Cobertura", align: "right", hint: "Meses de stock al ritmo de venta actual" },
];

function sortValue(row: EcosistemaItem, key: SortKey, nivel: EcosistemaNivel): number | string | null {
  if (key === "dim") return dimNombre(row, nivel).toLowerCase();
  return row[key];
}

export function EcosistemaTable({
  items,
  nivel,
  filtro,
}: {
  items: EcosistemaItem[];
  nivel: EcosistemaNivel;
  filtro: EcosistemaVeredicto | null;
}) {
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("venta_pen");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let rows = items;
    if (filtro) rows = rows.filter((r) => r.veredicto === filtro);
    if (needle) {
      rows = rows.filter((r) =>
        `${r.department ?? ""} ${r.category ?? ""} ${r.subcategory ?? ""}`
          .toLowerCase()
          .includes(needle),
      );
    }
    const sorted = [...rows].sort((a, b) => {
      const av = sortValue(a, sortKey, nivel);
      const bv = sortValue(b, sortKey, nivel);
      // nulls siempre al final, sin importar la dirección
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      let cmp: number;
      if (typeof av === "string" && typeof bv === "string") cmp = av.localeCompare(bv);
      else cmp = Number(av) - Number(bv);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [items, filtro, q, sortKey, sortDir, nivel]);

  const totales = useMemo(() => {
    let venta = 0, compra = 0, stock = 0, uv = 0, uc = 0, us = 0;
    for (const r of filtered) {
      venta += r.venta_pen; compra += r.compra_pen; stock += r.stock_pen;
      uv += r.unds_vendidas; uc += r.unds_compradas; us += r.unds_stock;
    }
    return {
      venta, compra, stock, uv, uc, us,
      mult: compra > 0 ? venta / compra : null,
      sell: uc > 0 ? (100 * uv) / uc : null,
    };
  }, [filtered]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      // dimensión arranca asc (A→Z); numéricas arrancan desc (mayor primero).
      setSortDir(key === "dim" ? "asc" : "desc");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar dimensión…"
            className="h-9 w-64 pl-9"
          />
        </div>
        <span className="text-caption text-muted">
          {num(filtered.length)} de {num(items.length)} filas
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          hint="Ninguna fila coincide con el filtro o la búsqueda."
        />
      ) : (
        <div className="relative overflow-auto rounded-xl border border-border-soft bg-surface shadow-card" style={{ maxHeight: "70vh" }}>
          <table className="w-full border-collapse text-body">
            <thead className="sticky top-0 z-10 bg-surface-2/95 backdrop-blur-sm">
              <tr>
                {COLS.map((c) => {
                  const active = sortKey === c.key;
                  const Arrow = !active ? ChevronsUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;
                  return (
                    <th
                      key={c.key}
                      title={c.hint}
                      className={cn(
                        "border-b border-border-soft px-3 py-2.5 text-caption font-semibold uppercase tracking-[0.06em] text-muted whitespace-nowrap",
                        c.align === "right" ? "text-right" : "text-left",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSort(c.key)}
                        className={cn(
                          "inline-flex items-center gap-1 hover:text-fg transition-colors",
                          c.align === "right" && "flex-row-reverse",
                          active && "text-fg",
                        )}
                      >
                        <Arrow className={cn("h-3 w-3", active ? "text-primary" : "text-faint")} />
                        {c.header}
                      </button>
                    </th>
                  );
                })}
                <th className="border-b border-border-soft px-3 py-2.5 text-left text-caption font-semibold uppercase tracking-[0.06em] text-muted whitespace-nowrap">
                  Veredicto
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr
                  key={`${r.department ?? "∅"}|${r.category ?? "∅"}|${r.subcategory ?? "∅"}|${i}`}
                  className="border-b border-border-soft/60 last:border-0 hover:bg-surface-3/40 transition-colors"
                >
                  <td className="px-3 py-2.5">
                    <div className={cn("font-medium text-fg/90", dimNombre(r, nivel) === SIN && "italic text-faint")}>
                      {dimNombre(r, nivel)}
                    </div>
                    {dimRuta(r, nivel) && (
                      <div className="text-caption text-faint">{dimRuta(r, nivel)}</div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-fg/90">{money(r.venta_pen)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-fg/90">{money(r.compra_pen)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-fg/90">{money(r.stock_pen)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-muted">{num(r.unds_vendidas)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-muted">{num(r.unds_compradas)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-muted">{num(r.unds_stock)}</td>
                  <td className={cn(
                    "px-3 py-2.5 text-right tabular-nums",
                    r.multiplicador == null ? "text-faint"
                      : r.multiplicador < 1.5 ? "text-warning font-medium" : "text-fg/90",
                  )}>
                    {r.multiplicador == null ? "—" : `${r.multiplicador.toFixed(2)}×`}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-fg/90">
                    {pct(r.sellthrough_pct)}
                  </td>
                  <td className={cn(
                    "px-3 py-2.5 text-right tabular-nums",
                    r.meses_cobertura == null ? "text-faint"
                      : r.meses_cobertura < 0.5 ? "text-danger font-medium"
                      : r.meses_cobertura > 2.5 ? "text-warning font-medium" : "text-fg/90",
                  )}>
                    {r.meses_cobertura == null ? "—" : `${r.meses_cobertura.toFixed(1)} m`}
                  </td>
                  <td className="px-3 py-2.5">
                    <VeredictoEcoBadge codigo={r.veredicto} />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="sticky bottom-0 z-10 bg-surface-2/95 backdrop-blur-sm">
              <tr className="border-t border-border font-semibold text-fg">
                <td className="px-3 py-2.5 text-caption uppercase tracking-[0.06em] text-muted">Totales</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{money(totales.venta)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{money(totales.compra)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{money(totales.stock)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-muted">{num(totales.uv)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-muted">{num(totales.uc)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-muted">{num(totales.us)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {totales.mult == null ? "—" : `${totales.mult.toFixed(2)}×`}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">{pct(totales.sell)}</td>
                <td className="px-3 py-2.5" />
                <td className="px-3 py-2.5" />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
