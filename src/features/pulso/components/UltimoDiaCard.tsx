"use client";

import { AlertTriangle, Clock, Receipt } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { money, num } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PulseUltimoDia } from "@/lib/bi-types";
import { TotalRecurrentePair, deltaTone, formatDeltaPct } from "@/features/bi/shared";

/** "Jue" → nombre completo, en singular y plural ("los últimos 8 jueves"). */
const DOW_NOMBRE: Record<string, { singular: string; plural: string }> = {
  Lun: { singular: "lunes", plural: "lunes" },
  Mar: { singular: "martes", plural: "martes" },
  Mie: { singular: "miércoles", plural: "miércoles" },
  Mié: { singular: "miércoles", plural: "miércoles" },
  Jue: { singular: "jueves", plural: "jueves" },
  Vie: { singular: "viernes", plural: "viernes" },
  Sab: { singular: "sábado", plural: "sábados" },
  Sáb: { singular: "sábado", plural: "sábados" },
  Dom: { singular: "domingo", plural: "domingos" },
};

/** Lectura humana del z-score: el número crudo no le dice nada a un gerente. */
function lecturaAnomalia(dia: PulseUltimoDia): string {
  if (dia.anomalo && dia.delta_vs_promedio_dow_pct > 0)
    return "muy por encima de lo habitual";
  if (dia.anomalo) return "muy por debajo de lo habitual";
  return "dentro del rango habitual";
}

/**
 * Card del último día cerrado (ayer). Muestra ventas, tickets, ticket promedio
 * y una comparación con el promedio de los últimos 8 mismos-DoW.
 * Si `anomalo === true`, muestra un badge de advertencia.
 */
export function UltimoDiaCard({ dia }: { dia: PulseUltimoDia }) {
  const tone = deltaTone(dia.delta_vs_promedio_dow_pct);
  const dow = DOW_NOMBRE[dia.dia_semana] ?? {
    singular: dia.dia_semana.toLowerCase(),
    plural: dia.dia_semana.toLowerCase(),
  };
  return (
    <Card>
      <CardHeader
        eyebrow="Último día cerrado"
        title={
          <span className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-info" />
            {dia.dia_semana} · {dia.fecha}
          </span>
        }
        action={
          dia.anomalo ? (
            <Badge
              tone="warning"
              className="cursor-help gap-1"
              title={`La venta fue inusualmente distinta al promedio de los últimos ${dia.n_dias_comparacion} ${dow.plural}. Vale la pena revisar qué pasó ese día.`}
            >
              <AlertTriangle className="h-3 w-3" aria-hidden="true" />
              Día fuera de lo común
            </Badge>
          ) : undefined
        }
      />
      <CardBody className="grid gap-5 md:grid-cols-3">
        <TotalRecurrentePair
          label="Ventas"
          total={dia.ventas}
          recurrente={dia.ventas_recurrente}
          size="lg"
        />

        <div className="flex flex-col gap-0.5">
          <p className="text-caption font-semibold uppercase tracking-[0.08em] text-muted">
            Tickets
          </p>
          <p className="text-2xl font-bold tabular-nums tracking-tight text-fg">
            {num(dia.tickets)}
          </p>
          <p className="flex items-center gap-1 text-xs text-faint">
            <Receipt className="h-3 w-3" aria-hidden="true" />
            {money(dia.ticket_promedio)} promedio
          </p>
        </div>

        <div className="flex flex-col gap-0.5">
          <p className="text-caption font-semibold uppercase tracking-[0.08em] text-muted">
            vs últimos {dia.n_dias_comparacion} {dow.plural}
          </p>
          <p
            className={cn(
              "text-2xl font-bold tabular-nums tracking-tight",
              tone === "success"
                ? "text-success"
                : tone === "danger"
                ? "text-danger"
                : tone === "warning"
                ? "text-warning"
                : "text-fg",
            )}
          >
            {formatDeltaPct(dia.delta_vs_promedio_dow_pct)}
          </p>
          <p className="text-xs text-faint">
            Promedio de un {dow.singular}:{" "}
            {money(dia.ventas_promedio_mismo_dow)} · {lecturaAnomalia(dia)}
          </p>
        </div>
      </CardBody>
    </Card>
  );
}
