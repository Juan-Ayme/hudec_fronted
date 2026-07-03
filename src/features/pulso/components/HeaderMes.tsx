"use client";

import Link from "next/link";
import { CalendarDays, ChevronRight } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { MetricGauge } from "@/components/ui/metric-gauge";
import { money, pct } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PulseMesEnCurso } from "@/lib/bi-types";
import {
  EstadoBadge,
  TotalRecurrentePair,
  formatMes,
} from "@/features/bi/shared";

/**
 * Header del mes en curso. Muestra:
 *  - Venta acumulada total + recurrente (patrón Opción B).
 *  - Gauge de avance vs meta.
 *  - Badge de estado (color según velocidad de avance).
 *  - Días transcurridos / restantes.
 *  - Link a /plan-mes para ver la proyección y planificar.
 */
export function HeaderMes({ mes }: { mes: PulseMesEnCurso }) {
  const g = mes.global;
  return (
    <Card>
      <CardBody className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-center gap-2 text-caption font-semibold uppercase tracking-[0.08em] text-muted">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            <span>Mes en curso · {formatMes(mes.mes)}</span>
            <span className="text-faint">
              · Día {mes.dias_transcurridos} de {mes.dias_del_mes}
            </span>
          </div>

          <TotalRecurrentePair
            total={g.venta_acumulada}
            recurrente={g.venta_acumulada_recurrente}
            size="xl"
          />

          <div className="mt-1 flex flex-wrap items-center gap-3 text-caption">
            <EstadoBadge estado={g.estado} />
            {g.meta > 0 && (
              <span className="text-muted">
                Meta: <span className="font-semibold text-fg">{money(g.meta)}</span>
              </span>
            )}
            {g.venta_diaria_necesaria > 0 && mes.dias_restantes > 0 && (
              <span className="text-muted">
                Ritmo necesario:{" "}
                <span className="font-semibold text-fg">
                  {money(g.venta_diaria_necesaria)}
                </span>
                /día
              </span>
            )}
            {mes.meta_source !== "exacta" && (
              <span className="rounded-full border border-info/25 bg-info/8 px-2 py-0.5 text-[0.65rem] font-semibold text-info">
                Meta estimada
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <MetricGauge
            value={clamp(g.avance_pct, 0, 120)}
            max={100}
            label="Avance"
            suffix="%"
            thresholds={{ danger: 80, warning: 95 }}
            size={140}
          />
          <p className="text-caption text-muted">
            Proyección cierre:{" "}
            <span className="font-semibold text-fg">
              {money(g.proyeccion_cierre_mes)}
            </span>
          </p>
          <Link
            href="/plan-mes"
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-caption font-semibold",
              "border border-primary/40 bg-primary/10 text-primary",
              "transition-colors hover:bg-primary/20 hover:border-primary/60",
            )}
          >
            Ver plan del mes
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </CardBody>

      {mes.por_sucursal.length > 1 && (
        <div className="border-t border-border-soft px-5 py-3">
          <p className="mb-2 text-caption font-semibold uppercase tracking-wider text-faint">
            Por sucursal
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {mes.por_sucursal.map((s) => (
              <div
                key={s.office_id}
                className="flex items-center justify-between gap-2 rounded-md border border-border-soft bg-surface-2/40 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-caption font-semibold text-fg">
                    {s.sucursal}
                  </p>
                  <p className="text-[0.65rem] text-faint">
                    {money(s.venta_acumulada)} · {pct(s.avance_pct)} de meta
                  </p>
                </div>
                <EstadoBadge estado={s.estado} showIcon={false} />
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function clamp(v: number, min: number, max: number): number {
  if (!Number.isFinite(v)) return min;
  return Math.max(min, Math.min(max, v));
}
