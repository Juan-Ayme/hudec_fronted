"use client";

import { Sparkles } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DiagnosisAnatomia } from "@/lib/bi-types";
import { HelpTip, formatDeltaPct } from "@/features/bi/shared";

/**
 * Descompone el delta% en 3 factores (log): tráfico (tickets), canasta
 * (unds/ticket) y precio (monto/und). Suman aproximadamente al `total`.
 * Barra horizontal centrada en 0 — positivas van a la derecha, negativas a
 * la izquierda. La contribución más grande |abs| es el driver.
 */
export function AnatomiaSection({ anatomia }: { anatomia: DiagnosisAnatomia }) {
  const c = anatomia.contribucion_log_pct;
  const rows: { key: string; label: string; help: string; value: number }[] = [
    {
      key: "tickets",
      label: "Tráfico — cantidad de tickets",
      help: "¿Entró más o menos gente a comprar? Mide el cambio en la cantidad de tickets.",
      value: c.tickets,
    },
    {
      key: "unds_per_ticket",
      label: "Canasta — unidades por ticket",
      help: "¿Cada cliente se llevó más o menos productos? Mide el cambio en unidades por ticket.",
      value: c.unds_per_ticket,
    },
    {
      key: "monto_per_und",
      label: "Precio — soles por unidad",
      help: "¿Se vendió más caro o más barato? Mide el cambio en el precio promedio por unidad.",
      value: c.monto_per_und,
    },
  ];
  const scale = Math.max(
    ...rows.map((r) => Math.abs(r.value)),
    Math.abs(c.total),
    1,
  );

  return (
    <Card>
      <CardHeader
        eyebrow="Anatomía del cambio"
        title={
          <span className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet" />
            ¿Qué explica la variación?
          </span>
        }
        subtitle={anatomia.lectura}
      />
      <CardBody className="flex flex-col gap-2.5">
        {rows.map((r) => (
          <AnatomiaFila
            key={r.key}
            label={r.label}
            help={r.help}
            value={r.value}
            scale={scale}
          />
        ))}
        <div className="mt-1 flex items-center justify-between border-t border-border-soft pt-2 text-caption">
          <span className="flex items-center gap-1 font-semibold text-muted">
            Variación total
            <HelpTip text="Los tres factores se combinan (aprox. suman) para explicar la variación total de la venta. La barra más larga es lo que más movió el resultado." />
          </span>
          <span
            className={cn(
              "font-mono font-bold tabular-nums",
              c.total > 0
                ? "text-success"
                : c.total < 0
                ? "text-danger"
                : "text-fg",
            )}
          >
            {formatDeltaPct(c.total)}
          </span>
        </div>
        <p className="text-[0.7rem] text-faint">
          La barra más larga indica el factor que más movió la venta en este
          período.
        </p>
      </CardBody>
    </Card>
  );
}

function AnatomiaFila({
  label,
  help,
  value,
  scale,
}: {
  label: string;
  help?: string;
  value: number;
  scale: number;
}) {
  const width = Math.min(50, (Math.abs(value) / scale) * 50);
  const isPositive = value > 0;
  const isNegative = value < 0;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_2fr_minmax(0,80px)] items-center gap-3">
      <span
        className={cn("truncate text-caption text-fg", help && "cursor-help")}
        title={help}
      >
        {label}
      </span>
      <div className="relative h-5 rounded-md bg-surface-3/40">
        <div
          className="absolute inset-y-0 left-1/2 w-px bg-border"
          aria-hidden="true"
        />
        {(isPositive || isNegative) && (
          <div
            className={cn(
              "absolute inset-y-0 rounded-md transition-all duration-500",
              isPositive
                ? "left-1/2 bg-success/70"
                : "right-1/2 bg-danger/70",
            )}
            style={{ width: `${width}%` }}
          />
        )}
      </div>
      <span
        className={cn(
          "text-right font-mono text-caption font-bold tabular-nums",
          isPositive
            ? "text-success"
            : isNegative
            ? "text-danger"
            : "text-fg",
        )}
      >
        {formatDeltaPct(value)}
      </span>
    </div>
  );
}
