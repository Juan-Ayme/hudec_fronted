"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { money, num, pct } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  ReporteCategoria,
  ReporteDepartamento,
} from "../hooks/useReporteVentas";

/** Verde si el margen es sano, ámbar si flojea, rojo si pierde plata. */
function tonoMargen(v: number): string {
  if (v <= 0) return "text-danger";
  if (v < 15) return "text-warning";
  return "text-success";
}

/** Barra de participación embebida en la celda de % (lectura de un vistazo). */
function BarraPct({ value }: { value: number }) {
  return (
    <div className="flex items-center justify-end gap-2">
      <div className="h-1 w-10 overflow-hidden rounded-full bg-white/[0.08]">
        <div
          className="h-full rounded-full bg-primary/70"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      <span className="w-12 text-right tabular-nums">{pct(value)}</span>
    </div>
  );
}

export function ReporteTable({ departamentos }: { departamentos: ReporteDepartamento[] }) {
  // Sets de claves abiertas. La categoría se cualifica con su departamento
  // para no abrir dos categorías homónimas de departamentos distintos.
  const [depsAbiertos, setDepsAbiertos] = useState<Set<string>>(new Set());
  const [catsAbiertas, setCatsAbiertas] = useState<Set<string>>(new Set());

  const toggle = (set: Set<string>, key: string, apply: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    apply(next);
  };

  if (departamentos.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-10 text-center text-sm text-white/50">
        No hay ventas en el rango seleccionado.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-2xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-sm">
          <thead>
            <tr className="border-b border-white/[0.08] text-xs uppercase tracking-wide text-white/50">
              <th className="px-4 py-3 text-left font-medium">Departamento / Categoría / Producto</th>
              <th className="px-3 py-3 text-right font-medium">Unds</th>
              <th className="px-3 py-3 text-right font-medium">Ingresos</th>
              <th className="px-3 py-3 text-right font-medium">Costo</th>
              <th className="px-3 py-3 text-right font-medium">Ganancia</th>
              <th className="px-3 py-3 text-right font-medium" title="Ganancia ÷ ingresos con IGV">
                Margen
              </th>
              <th className="px-3 py-3 text-right font-medium" title="Ganancia ÷ costo">
                Markup
              </th>
              <th className="px-4 py-3 text-right font-medium">Partic.</th>
            </tr>
          </thead>
          <tbody>
            {departamentos.map((dep) => {
              const depAbierto = depsAbiertos.has(dep.departamento);
              return (
                <DepGroup
                  key={dep.departamento}
                  dep={dep}
                  abierto={depAbierto}
                  onToggle={() =>
                    toggle(depsAbiertos, dep.departamento, setDepsAbiertos)
                  }
                  catsAbiertas={catsAbiertas}
                  onToggleCat={(key) => toggle(catsAbiertas, key, setCatsAbiertas)}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DepGroup({
  dep,
  abierto,
  onToggle,
  catsAbiertas,
  onToggleCat,
}: {
  dep: ReporteDepartamento;
  abierto: boolean;
  onToggle: () => void;
  catsAbiertas: Set<string>;
  onToggleCat: (key: string) => void;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className="cursor-pointer border-b border-white/[0.05] bg-white/[0.03] transition-colors hover:bg-white/[0.07]"
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2 font-semibold text-white/90">
            <ChevronRight
              className={cn(
                "h-4 w-4 shrink-0 text-white/40 transition-transform duration-200",
                abierto && "rotate-90",
              )}
            />
            {dep.departamento}
            <span className="ml-1 rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-normal text-white/50">
              {dep.categorias.length} cat.
            </span>
          </div>
        </td>
        <td className="px-3 py-3 text-right tabular-nums text-white/70">{num(dep.unidades)}</td>
        <td className="px-3 py-3 text-right font-semibold tabular-nums text-white/90">
          {money(dep.ingresos)}
        </td>
        <td className="px-3 py-3 text-right tabular-nums text-white/60">{money(dep.costo)}</td>
        <td className="px-3 py-3 text-right font-medium tabular-nums text-white/80">
          {money(dep.ganancia)}
        </td>
        <td className={cn("px-3 py-3 text-right font-semibold tabular-nums", tonoMargen(dep.margen_pct))}>
          {pct(dep.margen_pct)}
        </td>
        <td className="px-3 py-3 text-right tabular-nums text-white/60">
          {pct(dep.markup_pct)}
        </td>
        <td className="px-4 py-3 text-right tabular-nums text-white/70">
          <BarraPct value={dep.participacion_pct} />
        </td>
      </tr>

      {abierto &&
        dep.categorias.map((cat) => {
          const key = `${dep.departamento}›${cat.categoria}`;
          const catAbierta = catsAbiertas.has(key);
          return (
            <CatGroup
              key={key}
              cat={cat}
              abierta={catAbierta}
              onToggle={() => onToggleCat(key)}
            />
          );
        })}
    </>
  );
}

function CatGroup({
  cat,
  abierta,
  onToggle,
}: {
  cat: ReporteCategoria;
  abierta: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className="cursor-pointer border-b border-white/[0.04] transition-colors hover:bg-white/[0.05]"
      >
        <td className="py-2.5 pl-11 pr-4">
          <div className="flex items-center gap-2 text-white/75">
            <ChevronRight
              className={cn(
                "h-3.5 w-3.5 shrink-0 text-white/30 transition-transform duration-200",
                abierta && "rotate-90",
              )}
            />
            {cat.categoria}
            <span className="ml-1 text-[10px] text-white/35">
              {cat.productos.length} prod.
            </span>
          </div>
        </td>
        <td className="px-3 py-2.5 text-right tabular-nums text-white/60">{num(cat.unidades)}</td>
        <td className="px-3 py-2.5 text-right font-medium tabular-nums text-white/80">
          {money(cat.ingresos)}
        </td>
        <td className="px-3 py-2.5 text-right tabular-nums text-white/50">{money(cat.costo)}</td>
        <td className="px-3 py-2.5 text-right tabular-nums text-white/70">{money(cat.ganancia)}</td>
        <td className={cn("px-3 py-2.5 text-right tabular-nums", tonoMargen(cat.margen_pct))}>
          {pct(cat.margen_pct)}
        </td>
        <td className="px-3 py-2.5 text-right tabular-nums text-white/45">
          {pct(cat.markup_pct)}
        </td>
        <td className="px-4 py-2.5 text-right tabular-nums text-white/55">
          <BarraPct value={cat.participacion_pct} />
        </td>
      </tr>

      {abierta &&
        cat.productos.map((p) => (
          <tr
            key={`${cat.categoria}›${p.sku}›${p.producto}`}
            className="border-b border-white/[0.03] bg-black/10 text-xs transition-colors hover:bg-white/[0.04]"
          >
            <td className="py-2 pl-[68px] pr-4">
              <div className="flex items-center gap-2">
                <span className="shrink-0 rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-white/45">
                  {p.sku}
                </span>
                <span className="truncate text-white/65" title={p.producto}>
                  {p.producto}
                </span>
              </div>
            </td>
            <td className="px-3 py-2 text-right tabular-nums text-white/50">{num(p.unidades)}</td>
            <td className="px-3 py-2 text-right tabular-nums text-white/70">{money(p.ingresos)}</td>
            <td className="px-3 py-2 text-right tabular-nums text-white/40">{money(p.costo)}</td>
            <td className="px-3 py-2 text-right tabular-nums text-white/60">{money(p.ganancia)}</td>
            <td className={cn("px-3 py-2 text-right tabular-nums", tonoMargen(p.margen_pct))}>
              {pct(p.margen_pct)}
            </td>
            <td className="px-3 py-2 text-right tabular-nums text-white/35">
              {pct(p.markup_pct)}
            </td>
            <td className="px-4 py-2 text-right tabular-nums text-white/40">
              {pct(p.participacion_pct)}
            </td>
          </tr>
        ))}
    </>
  );
}
