"use client";

import { Card, CardBody } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Veredicto } from "@/lib/bi-types";
import { VEREDICTO } from "./constants";
import { deltaArrow, formatDeltaPct } from "./format-bi";

/**
 * Card grande con el veredicto del momento: título, explicación textual y
 * dos deltas comparativos (YoY y mes anterior).
 *
 * Se pinta con el tono del veredicto en el borde-izquierdo + el ícono para
 * lectura rápida. La explicación viene desde el backend — no la reescribas
 * ni la reformatees; ya está pensada para mostrarse tal cual.
 */
export function VeredictoCard({
  veredicto,
  className,
}: {
  veredicto: Veredicto;
  className?: string;
}) {
  const meta = VEREDICTO[veredicto.codigo];
  const Icon = meta.icon;
  const toneBorder = {
    success: "border-l-success/70",
    danger: "border-l-danger/70",
    warning: "border-l-warning/70",
    info: "border-l-info/70",
    primary: "border-l-primary/70",
    violet: "border-l-violet/70",
    neutral: "border-l-border",
  }[meta.tone];
  const toneBg = {
    success: "bg-success/8",
    danger: "bg-danger/8",
    warning: "bg-warning/8",
    info: "bg-info/8",
    primary: "bg-primary/8",
    violet: "bg-violet/8",
    neutral: "bg-surface-2/50",
  }[meta.tone];
  const toneText = {
    success: "text-success",
    danger: "text-danger",
    warning: "text-warning",
    info: "text-info",
    primary: "text-primary",
    violet: "text-violet",
    neutral: "text-fg",
  }[meta.tone];

  return (
    <Card className={cn("border-l-4", toneBorder, toneBg, className)}>
      <CardBody className="flex items-start gap-4">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
            "border border-white/10 bg-white/5 backdrop-blur-md",
            toneText,
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className={cn("text-lg font-bold", toneText)}>{veredicto.titulo}</h3>
          <p className="mt-1 text-sm leading-relaxed text-fg/80">
            {veredicto.explicacion}
          </p>
          {(veredicto.delta_yoy_pct != null ||
            veredicto.delta_mes_anterior_pct != null) && (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-caption">
              {veredicto.delta_yoy_pct != null && (
                <DeltaChip
                  label="vs año anterior"
                  value={veredicto.delta_yoy_pct}
                />
              )}
              {veredicto.delta_mes_anterior_pct != null && (
                <DeltaChip
                  label="vs mes anterior"
                  value={veredicto.delta_mes_anterior_pct}
                />
              )}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

function DeltaChip({ label, value }: { label: string; value: number }) {
  const tone =
    value > 0 ? "text-success" : value < 0 ? "text-danger" : "text-muted";
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border-soft bg-surface-2/60 px-2 py-1">
      <span className={cn("font-mono font-semibold tabular-nums", tone)}>
        {deltaArrow(value)} {formatDeltaPct(value)}
      </span>
      <span className="text-faint">{label}</span>
    </span>
  );
}
