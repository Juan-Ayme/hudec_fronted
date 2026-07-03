"use client";

import { useState } from "react";
import { Building2, Clock, FolderTree, Layers, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  DiagnosisDescompBase,
  DiagnosisDescomposicion,
} from "@/lib/bi-types";
import { deltaTone, formatDeltaPct } from "@/features/bi/shared";

type DimId = "sucursal" | "categoria" | "dia" | "franja" | "vendedor";

type DimRow = DiagnosisDescompBase & Record<string, unknown>;

interface DimSpec {
  id: DimId;
  label: string;
  icon: LucideIcon;
  labelFor: (row: DimRow) => string;
  sublabelFor?: (row: DimRow) => string | null;
  getRows: (d: DiagnosisDescomposicion) => DimRow[];
}

// Cast: los tipos concretos (DiagnosisDescompSucursal, etc.) extienden Base pero
// no declaran index signature. Los tratamos como Record<string, unknown> para
// leer campos específicos por dimensión (sucursal, categoria, dia, franja, vendedor).
const asRows = (arr: readonly DiagnosisDescompBase[]): DimRow[] =>
  arr as unknown as DimRow[];

const DIMS: DimSpec[] = [
  {
    id: "sucursal",
    label: "Sucursal",
    icon: Building2,
    labelFor: (r) => String(r.sucursal ?? "—"),
    getRows: (d) => asRows(d.por_sucursal),
  },
  {
    id: "categoria",
    label: "Categoría",
    icon: FolderTree,
    labelFor: (r) => String(r.categoria ?? "—"),
    sublabelFor: (r) => (r.departamento ? String(r.departamento) : null),
    getRows: (d) => asRows(d.por_categoria),
  },
  {
    id: "dia",
    label: "Día",
    icon: Layers,
    labelFor: (r) => String(r.dia ?? "—"),
    getRows: (d) => asRows(d.por_dia_semana),
  },
  {
    id: "franja",
    label: "Hora",
    icon: Clock,
    labelFor: (r) => String(r.franja ?? "—"),
    getRows: (d) => asRows(d.por_franja_horaria),
  },
  {
    id: "vendedor",
    label: "Vendedor",
    icon: User,
    labelFor: (r) => String(r.vendedor ?? "—"),
    getRows: (d) => asRows(d.por_vendedor),
  },
];

/**
 * Descomposición del delta en 5 dimensiones. Cada tab renderiza una tabla
 * ordenada por |delta_abs| DESC — la fila que "más movió" arriba.
 */
export function DescomposicionTabs({
  descomposicion,
}: {
  descomposicion: DiagnosisDescomposicion;
}) {
  const [dim, setDim] = useState<DimId>("sucursal");
  const spec = DIMS.find((d) => d.id === dim)!;
  const rows = [...spec.getRows(descomposicion)].sort(
    (a, b) => Math.abs(b.delta_abs) - Math.abs(a.delta_abs),
  );

  return (
    <Card>
      <CardHeader
        eyebrow="Descomposición del cambio"
        title={
          <span className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-info" />
            ¿Dónde ocurrió?
          </span>
        }
        subtitle={`Base: ${descomposicion.comparacion_base}`}
      />
      <div className="flex flex-wrap gap-1 border-b border-border-soft px-3 py-2">
        {DIMS.map((d) => {
          const Icon = d.icon;
          return (
            <button
              key={d.id}
              onClick={() => setDim(d.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-caption font-semibold transition-colors",
                dim === d.id
                  ? "bg-info/12 text-info"
                  : "text-muted hover:bg-surface-2 hover:text-fg",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {d.label}
              <span className="rounded-full bg-surface-3 px-1.5 py-0 font-mono text-[0.6rem] tabular-nums">
                {d.getRows(descomposicion).length}
              </span>
            </button>
          );
        })}
      </div>
      <CardBody className="p-0">
        {rows.length === 0 ? (
          <p className="p-6 text-center text-caption text-faint">
            Sin datos para esta dimensión.
          </p>
        ) : (
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            <table className="w-full text-caption">
              <thead className="sticky top-0 bg-surface-2/95 backdrop-blur-md">
                <tr className="border-b border-border-soft text-[0.65rem] uppercase tracking-wider text-faint">
                  <th className="px-4 py-2 text-left font-semibold">{spec.label}</th>
                  <th className="px-4 py-2 text-right font-semibold">Actual</th>
                  <th className="px-4 py-2 text-right font-semibold">Previo</th>
                  <th className="px-4 py-2 text-right font-semibold">Δ%</th>
                  <th className="px-4 py-2 text-right font-semibold">Δ S/</th>
                  <th className="px-4 py-2 text-right font-semibold">Share</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const sub = spec.sublabelFor?.(r);
                  const tone = deltaTone(r.delta_pct);
                  const toneCls = {
                    success: "text-success",
                    danger: "text-danger",
                    warning: "text-warning",
                    neutral: "text-fg",
                    info: "text-info",
                    primary: "text-primary",
                    violet: "text-violet",
                  }[tone];
                  return (
                    <tr
                      key={`${dim}-${i}`}
                      className="border-b border-border-soft/50 hover:bg-surface-2/40"
                    >
                      <td className="px-4 py-2">
                        <p className="truncate font-semibold text-fg">
                          {spec.labelFor(r)}
                        </p>
                        {sub && (
                          <p className="truncate text-[0.65rem] text-faint">{sub}</p>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right font-mono tabular-nums text-fg">
                        {money(r.ventas_actual)}
                      </td>
                      <td className="px-4 py-2 text-right font-mono tabular-nums text-muted">
                        {money(r.ventas_prev)}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-2 text-right font-mono tabular-nums font-semibold",
                          toneCls,
                        )}
                      >
                        {formatDeltaPct(r.delta_pct)}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-2 text-right font-mono tabular-nums",
                          r.delta_abs > 0
                            ? "text-success"
                            : r.delta_abs < 0
                            ? "text-danger"
                            : "text-fg",
                        )}
                      >
                        {r.delta_abs > 0 ? "+" : r.delta_abs < 0 ? "−" : ""}
                        {money(Math.abs(r.delta_abs))}
                      </td>
                      <td className="px-4 py-2 text-right font-mono tabular-nums text-muted">
                        {r.share_pct != null ? `${r.share_pct.toFixed(1)}%` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
