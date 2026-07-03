"use client";

import { AlertTriangle, CalendarClock, Target } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { MetricGauge } from "@/components/ui/metric-gauge";
import { money, num, pct } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PlanMesEnCurso } from "@/lib/bi-types";
import {
  EstadoBadge,
  TotalRecurrentePair,
  formatMes,
} from "@/features/bi/shared";

/**
 * Card grande con la proyección del mes en curso vs meta cargada.
 * Muestra estado, gap, ritmo necesario y — si es dramático — un badge de
 * "ritmo necesario_multiplo" en rojo cuando pasa 2x.
 */
export function ProyeccionMesCard({ mes }: { mes: PlanMesEnCurso }) {
  const isDramatic = mes.ritmo_necesario_multiplo >= 2;
  const avancePct = mes.meta > 0 ? (mes.venta_acumulada / mes.meta) * 100 : 0;
  const proyPct =
    mes.meta > 0 ? Math.min(200, (mes.proyeccion_lineal / mes.meta) * 100) : 0;

  return (
    <Card>
      <CardBody className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-center gap-2 text-caption font-semibold uppercase tracking-[0.08em] text-muted">
            <CalendarClock className="h-4 w-4" aria-hidden="true" />
            <span>Proyección · {formatMes(mes.mes)}</span>
            <span className="text-faint">
              · Día {mes.dias_transcurridos} de {mes.dias_del_mes}
            </span>
          </div>

          <TotalRecurrentePair
            total={mes.venta_acumulada}
            recurrente={mes.venta_acumulada_recurrente}
            size="xl"
          />

          <div className="mt-1 flex flex-wrap items-center gap-3 text-caption">
            <EstadoBadge estado={mes.estado} />
            {mes.meta > 0 && (
              <span className="text-muted">
                Meta:{" "}
                <span className="font-semibold text-fg">{money(mes.meta)}</span>
              </span>
            )}
            {mes.meta_source !== "exacta" && (
              <span className="rounded-full border border-info/25 bg-info/8 px-2 py-0.5 text-[0.65rem] font-semibold text-info">
                Meta estimada
              </span>
            )}
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-3">
            <MiniStat
              label="Proyección cierre"
              value={money(mes.proyeccion_lineal)}
              sub={`${pct(proyPct)} de meta`}
            />
            <MiniStat
              label="Gap a meta"
              value={money(Math.abs(mes.gap_a_meta))}
              sub={mes.gap_a_meta >= 0 ? "por encima" : "faltan"}
              tone={mes.gap_a_meta >= 0 ? "success" : "danger"}
            />
            <MiniStat
              label="Ritmo necesario"
              value={`${money(mes.venta_diaria_necesaria)}/día`}
              sub={
                mes.dias_restantes > 0
                  ? `${num(mes.dias_restantes)}d restantes`
                  : "mes cerrado"
              }
              tone={isDramatic ? "danger" : "info"}
            />
          </div>

          {isDramatic && (
            <div className="mt-1 flex items-center gap-2 rounded-md border border-danger/30 bg-danger/8 px-3 py-2">
              <AlertTriangle className="h-4 w-4 text-danger" aria-hidden="true" />
              <p className="text-caption text-danger">
                Para llegar necesitás vender{" "}
                <strong>{mes.ritmo_necesario_multiplo.toFixed(1)}×</strong> el
                ritmo promedio del mes. Probablemente inalcanzable — ajustá la
                meta o el plan de compra.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-3">
          <MetricGauge
            value={Math.max(0, Math.min(100, avancePct))}
            max={100}
            label="Avance"
            suffix="%"
            thresholds={{ danger: 80, warning: 95 }}
            size={140}
          />
          <div className="flex items-center gap-1.5 text-caption text-muted">
            <Target className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Promedio: {money(mes.venta_diaria_promedio)}/día</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function MiniStat({
  label,
  value,
  sub,
  tone = "info",
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "info" | "success" | "danger";
}) {
  const cls = {
    info: "text-fg",
    success: "text-success",
    danger: "text-danger",
  }[tone];
  return (
    <div className="rounded-md border border-border-soft bg-surface-2/40 px-3 py-2">
      <p className="text-[0.6rem] font-bold uppercase tracking-wider text-faint">
        {label}
      </p>
      <p className={cn("font-mono text-body font-bold tabular-nums", cls)}>
        {value}
      </p>
      <p className="text-[0.6rem] tabular-nums text-faint">{sub}</p>
    </div>
  );
}
