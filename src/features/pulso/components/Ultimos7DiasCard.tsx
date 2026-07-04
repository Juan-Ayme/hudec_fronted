"use client";

import { CalendarRange } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { money, num } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PulseUltimos7Dias } from "@/lib/bi-types";
import {
  TotalRecurrentePair,
  deltaTone,
  formatDeltaPct,
} from "@/features/bi/shared";

/**
 * Resumen últimos 7 días: 4 comparativas (vs semana anterior y YoY, cada una
 * con total + recurrente). El delta recurrente es el accionable — el total
 * puede estar distorsionado por estacionales.
 */
export function Ultimos7DiasCard({ resumen }: { resumen: PulseUltimos7Dias }) {
  return (
    <Card>
      <CardHeader
        eyebrow="Últimos 7 días"
        title={
          <span className="flex items-center gap-2">
            <CalendarRange className="h-5 w-5 text-info" />
            {resumen.from} → {resumen.to}
          </span>
        }
        subtitle="Los porcentajes comparan estos 7 días contra los 7 días previos y contra las mismas fechas del año pasado."
      />
      <CardBody className="grid gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <TotalRecurrentePair
            label="Ventas"
            total={resumen.ventas}
            recurrente={resumen.ventas_recurrente}
            size="lg"
          />
          <p className="text-caption text-muted">
            {num(resumen.tickets)} tickets · Ticket promedio{" "}
            <span className="font-semibold text-fg">
              {money(resumen.ticket_promedio)}
            </span>
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <DeltaRow
            label="vs los 7 días anteriores"
            total={resumen.delta_vs_semana_anterior_pct_total}
            recurrente={resumen.delta_vs_semana_anterior_pct_recurrente}
          />
          <DeltaRow
            label="vs mismas fechas del año pasado"
            total={resumen.delta_vs_ano_anterior_pct_total}
            recurrente={resumen.delta_vs_ano_anterior_pct_recurrente}
          />
        </div>
      </CardBody>
    </Card>
  );
}

function DeltaRow({
  label,
  total,
  recurrente,
}: {
  label: string;
  total: number;
  recurrente: number;
}) {
  const toneTotal = deltaTone(total);
  const toneRecu = deltaTone(recurrente);
  const cls = (t: ReturnType<typeof deltaTone>) =>
    t === "success"
      ? "text-success"
      : t === "danger"
      ? "text-danger"
      : t === "warning"
      ? "text-warning"
      : "text-fg";

  return (
    <div className="rounded-md border border-border-soft bg-surface-2/40 px-3 py-2.5">
      <p className="text-[0.65rem] font-bold uppercase tracking-wider text-faint">
        {label}
      </p>
      <div className="mt-1 flex items-baseline gap-3">
        <span className={cn("font-mono text-lg font-bold tabular-nums", cls(toneTotal))}>
          {formatDeltaPct(total)}
        </span>
        <span
          className={cn(
            "cursor-help font-mono text-caption tabular-nums underline decoration-dotted decoration-muted/40 underline-offset-2",
            cls(toneRecu),
          )}
          title="Variación de la venta recurrente (sin categorías de temporada). Es el número más confiable para leer la tendencia."
        >
          {formatDeltaPct(recurrente)} recurrente
        </span>
      </div>
    </div>
  );
}
