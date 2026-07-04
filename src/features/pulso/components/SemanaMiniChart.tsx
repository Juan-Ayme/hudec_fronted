"use client";

import { BarChart3 } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { money, moneyCompact, num } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PulseSemanaDia } from "@/lib/bi-types";

/**
 * Mini chart de barras horizontales para la semana en curso (L-M-X-J-V-S-D).
 * Simple SVG-less: divs con width % del máximo del array. Cada barra muestra
 * ventas TOTAL con la porción recurrente en un tono más suave (patrón Opción B).
 */
export function SemanaMiniChart({ semana }: { semana: PulseSemanaDia[] }) {
  if (semana.length === 0) {
    return (
      <Card>
        <CardHeader
          eyebrow="Semana en curso"
          title={
            <span className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Ventas por día
            </span>
          }
          subtitle="Sólo días cerrados — el día de hoy se suma cuando termina."
        />
        <CardBody>
          <p className="py-6 text-center text-caption text-faint">
            Aún no hay días cerrados esta semana.
          </p>
        </CardBody>
      </Card>
    );
  }

  const maxVenta = Math.max(...semana.map((d) => d.ventas), 1);

  return (
    <Card>
      <CardHeader
        eyebrow="Semana en curso"
        title={
          <span className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Ventas por día
          </span>
        }
      />
      <CardBody className="flex flex-col gap-2.5">
        {semana.map((d) => {
          const pctTotal = (d.ventas / maxVenta) * 100;
          const pctRecu =
            d.ventas > 0
              ? Math.min(100, (d.ventas_recurrente / d.ventas) * 100)
              : 0;
          return (
            <div key={d.fecha} className="flex items-center gap-3">
              <div className="flex w-16 shrink-0 flex-col">
                <span className="text-caption font-semibold text-fg">{d.dia}</span>
                <span className="text-[0.6rem] text-faint">
                  {d.fecha.slice(5)}
                </span>
              </div>
              <div
                className="relative h-6 flex-1 overflow-hidden rounded-md bg-surface-3/50"
                title={`Total ${money(d.ventas)} · Recurrente ${money(d.ventas_recurrente)}`}
              >
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-md",
                    "bg-gradient-to-r from-primary/70 to-primary",
                    "transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                  )}
                  style={{ width: `${pctTotal}%` }}
                >
                  <div
                    className="h-full rounded-md bg-primary/90"
                    style={{ width: `${pctRecu}%` }}
                  />
                </div>
              </div>
              <div className="flex w-32 shrink-0 flex-col text-right">
                <span className="font-mono text-caption tabular-nums font-semibold text-fg">
                  {moneyCompact(d.ventas)}
                </span>
                <span className="text-[0.6rem] tabular-nums text-faint">
                  {num(d.tickets)} tickets
                </span>
              </div>
            </div>
          );
        })}

        <p className="mt-2 flex flex-wrap items-center gap-3 border-t border-border-soft pt-2 text-[0.65rem] text-faint">
          <span
            className="inline-flex cursor-help items-center gap-1.5"
            title="Venta sin categorías de temporada — la venta 'de todos los días'."
          >
            <span className="h-2 w-3 rounded bg-primary" /> Venta recurrente
          </span>
          <span
            className="inline-flex cursor-help items-center gap-1.5"
            title="Venta extra de categorías de temporada (Navidad, Día del Padre, etc.)."
          >
            <span className="h-2 w-3 rounded bg-primary/50" /> Venta de temporada (extra)
          </span>
        </p>
      </CardBody>
    </Card>
  );
}
