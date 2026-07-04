"use client";

import { CalendarRange } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { money, moneyCompact, pct } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PacingSemanal } from "@/lib/bi-types";
import { formatMes } from "@/features/bi/shared";

/** Códigos de método del backend → texto de gerente. */
const METODO_PACING: Record<string, string> = {
  dist_yoy_misma_semana:
    "repartida según cómo se vendió cada semana el año pasado",
  uniforme: "repartida en partes iguales entre las semanas",
};

/**
 * Pacing semanal: barras horizontales con la meta por semana + la venta YoY
 * de la misma semana para comparación visual.
 */
export function PacingSemanalCard({ pacing }: { pacing: PacingSemanal }) {
  const maxVal = Math.max(
    ...pacing.semanas.map((s) => Math.max(s.meta, s.yoy_venta)),
    1,
  );
  const metodo =
    METODO_PACING[pacing.metodo] ?? pacing.metodo.replaceAll("_", " ");
  return (
    <Card>
      <CardHeader
        eyebrow={`Plan semanal de venta · ${formatMes(pacing.mes)}`}
        title={
          <span className="flex items-center gap-2">
            <CalendarRange className="h-5 w-5 text-primary" />
            {money(pacing.meta_total)}
          </span>
        }
        subtitle={`Cuánto conviene vender cada semana para llegar a la meta, ${metodo}. El año pasado este mes se vendió ${money(pacing.venta_yoy_total)}.`}
      />
      <CardBody className="flex flex-col gap-3">
        {pacing.semanas.length === 0 ? (
          <p className="py-4 text-center text-caption text-faint">
            Sin distribución semanal disponible.
          </p>
        ) : (
          pacing.semanas.map((s) => {
            const metaW = (s.meta / maxVal) * 100;
            const yoyW = (s.yoy_venta / maxVal) * 100;
            return (
              <div key={s.sem} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between text-caption">
                  <span className="font-semibold text-fg">
                    Semana {s.sem} · {s.from} → {s.to}
                  </span>
                  <span
                    className="cursor-help font-mono tabular-nums text-muted"
                    title={`Esta semana concentra el ${pct(s.pct_mes)} de la meta del mes (${s.dias} días)`}
                  >
                    {pct(s.pct_mes)} del mes · {s.dias} días
                  </span>
                </div>
                <div className="relative h-6 overflow-hidden rounded-md bg-surface-3/40">
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 rounded-md bg-primary/70",
                      "transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                    )}
                    style={{ width: `${metaW}%` }}
                    title={`Meta: ${money(s.meta)}`}
                  />
                  <div
                    className="absolute inset-y-0 left-0 border-r-2 border-info/70"
                    style={{ width: `${yoyW}%` }}
                    title={`YoY: ${money(s.yoy_venta)}`}
                  />
                </div>
                <div className="flex justify-between font-mono text-[0.65rem] tabular-nums">
                  <span className="text-primary">Meta {moneyCompact(s.meta)}</span>
                  <span className="text-info">
                    Año pasado {moneyCompact(s.yoy_venta)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <p className="mt-1 flex flex-wrap items-center gap-3 border-t border-border-soft pt-2 text-[0.65rem] text-faint">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-3 rounded bg-primary/70" /> Meta sugerida
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-0.5 bg-info" /> Venta del año pasado (misma semana)
          </span>
        </p>
      </CardBody>
    </Card>
  );
}
