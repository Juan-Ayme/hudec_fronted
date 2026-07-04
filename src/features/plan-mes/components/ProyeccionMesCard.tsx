"use client";

import { AlertTriangle, CalendarClock, Target } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { MetricGauge } from "@/components/ui/metric-gauge";
import { money, num, pct } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PlanMesEnCurso } from "@/lib/bi-types";
import {
  EstadoBadge,
  HelpTip,
  TotalRecurrentePair,
  estadoGaugeTone,
  formatMes,
} from "@/features/bi/shared";

/**
 * Card grande con la proyección del mes en curso vs meta cargada.
 * Muestra estado, gap, ritmo necesario y — si es dramático — un badge de
 * "ritmo necesario_multiplo" en rojo cuando pasa 2x.
 *
 * Contrato: `gap_a_meta` = venta − meta (NEGATIVO = falta), unificado con
 * /pulse en jul 2026. `venta_diaria_necesaria` y `ritmo_necesario_multiplo`
 * llegan null cuando la meta ya se cumplió. Ver PlanMesEnCurso en bi-types.ts.
 */
export function ProyeccionMesCard({ mes }: { mes: PlanMesEnCurso }) {
  const isDramatic = (mes.ritmo_necesario_multiplo ?? 0) >= 2;
  const falta = (mes.gap_a_meta ?? 0) < 0;
  const avancePct = mes.meta > 0 ? (mes.venta_acumulada / mes.meta) * 100 : 0;
  const esperadoHoy =
    mes.meta > 0 && mes.dias_del_mes > 0
      ? (mes.meta * mes.dias_transcurridos) / mes.dias_del_mes
      : 0;
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
                Meta del mes:{" "}
                <span className="font-semibold text-fg">{money(mes.meta)}</span>
              </span>
            )}
            {esperadoHoy > 0 && mes.dias_restantes > 0 && (
              <span className="inline-flex items-center gap-1 text-muted">
                Esperado a hoy:{" "}
                <span className="font-semibold text-fg">{money(esperadoHoy)}</span>
                <HelpTip text={`Al día ${mes.dias_transcurridos} de ${mes.dias_del_mes} correspondería llevar vendida esta parte de la meta.`} />
              </span>
            )}
            {mes.meta_source !== "exacta" && (
              <span
                className="cursor-help rounded-full border border-info/25 bg-info/8 px-2 py-0.5 text-[0.65rem] font-semibold text-info"
                title="No hay meta cargada para este mes; se estimó a partir de la venta histórica. Podés cargar la meta real en Configuración → Metas."
              >
                Meta estimada
              </span>
            )}
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-3">
            <MiniStat
              label="Proyección de cierre"
              help="Si el ritmo de venta actual se mantiene, el mes cerraría en este monto."
              value={money(mes.proyeccion_lineal)}
              sub={`${pct(proyPct)} de la meta`}
            />
            <MiniStat
              label={falta ? "Falta para la meta" : "Arriba de la meta"}
              help="Diferencia entre la meta del mes y la venta acumulada hasta hoy."
              value={money(Math.abs(mes.gap_a_meta ?? 0))}
              sub={falta ? "por vender este mes" : "ya superada"}
              tone={falta ? "danger" : "success"}
            />
            <MiniStat
              label="Ritmo necesario"
              help="Lo que hay que vender por día, en promedio, durante los días restantes para llegar a la meta."
              value={
                mes.venta_diaria_necesaria != null
                  ? `${money(mes.venta_diaria_necesaria)}/día`
                  : "—"
              }
              sub={
                mes.venta_diaria_necesaria == null
                  ? "meta ya alcanzada"
                  : mes.dias_restantes > 0
                  ? `quedan ${num(mes.dias_restantes)} días`
                  : "mes cerrado"
              }
              tone={isDramatic ? "danger" : "info"}
            />
          </div>

          {isDramatic && (
            <div className="mt-1 flex items-center gap-2 rounded-md border border-danger/30 bg-danger/8 px-3 py-2">
              <AlertTriangle className="h-4 w-4 text-danger" aria-hidden="true" />
              <p className="text-caption text-danger">
                Para llegar a la meta habría que vender{" "}
                <strong>{(mes.ritmo_necesario_multiplo ?? 0).toFixed(1)} veces</strong>{" "}
                el ritmo promedio de lo que va del mes. Probablemente
                inalcanzable — conviene ajustar la meta o el plan de compra.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-3">
          {/* El color sale del ESTADO (ritmo vs lo esperado a hoy), no del
              avance del mes con umbrales fijos — eso pintaba rojo todo el
              inicio del mes aunque el negocio fuera bien. */}
          <MetricGauge
            value={Math.max(0, Math.min(100, avancePct))}
            max={100}
            label="Avance del mes"
            suffix="%"
            tone={estadoGaugeTone(mes.estado)}
            size={140}
          />
          <div className="flex items-center gap-1.5 text-caption text-muted">
            <Target className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Venta promedio: {money(mes.venta_diaria_promedio)}/día</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function MiniStat({
  label,
  help,
  value,
  sub,
  tone = "info",
}: {
  label: string;
  help?: string;
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
    <div
      className={cn(
        "rounded-md border border-border-soft bg-surface-2/40 px-3 py-2",
        help && "cursor-help",
      )}
      title={help}
    >
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
