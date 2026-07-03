"use client";

import { PartyPopper } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { money } from "@/lib/format";
import type { PulseAlerta } from "@/lib/bi-types";
import { SEVERIDAD_ALERTA } from "./constants";

/**
 * Chip individual de alerta. Muestra severidad, título, detalle, impacto (S/)
 * y acción sugerida. Se puede pasar `onAction` para mostrar un botón que
 * dispara la navegación al lugar donde se resuelve.
 */
export function AlertaChip({
  alerta,
  onAction,
  className,
}: {
  alerta: PulseAlerta;
  onAction?: (alerta: PulseAlerta) => void;
  className?: string;
}) {
  const meta = SEVERIDAD_ALERTA[alerta.severidad];
  const Icon = meta.icon;
  const impactoNeg = alerta.impacto_pen < 0;

  const toneBorder = {
    danger:  "border-l-danger/70  bg-danger/6",
    warning: "border-l-warning/70 bg-warning/6",
    info:    "border-l-info/70    bg-info/6",
    success: "border-l-success/70 bg-success/6",
    primary: "border-l-primary/70 bg-primary/6",
    violet:  "border-l-violet/70  bg-violet/6",
    neutral: "border-l-border     bg-surface-2/50",
  }[meta.tone];

  const toneIcon = {
    danger:  "text-danger",
    warning: "text-warning",
    info:    "text-info",
    success: "text-success",
    primary: "text-primary",
    violet:  "text-violet",
    neutral: "text-muted",
  }[meta.tone];

  return (
    <Card className={cn("border-l-4", toneBorder, className)}>
      <CardBody className="flex items-start gap-3 py-3">
        <div className={cn("mt-0.5 shrink-0", toneIcon)}>
          <Icon className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="text-body font-semibold text-fg">{alerta.titulo}</p>
            {alerta.impacto_pen !== 0 && Number.isFinite(alerta.impacto_pen) && (
              <p
                className={cn(
                  "font-mono text-caption tabular-nums font-bold whitespace-nowrap",
                  impactoNeg ? "text-danger" : "text-success",
                )}
              >
                {impactoNeg ? "−" : "+"}{money(Math.abs(alerta.impacto_pen))}
              </p>
            )}
          </div>
          <p className="mt-1 text-caption text-muted">{alerta.detalle}</p>
          {alerta.accion_sugerida && (
            <p className="mt-1.5 text-caption text-fg/70">
              <span className="font-semibold">Acción: </span>
              {alerta.accion_sugerida}
            </p>
          )}
          {alerta.skus && alerta.skus.length > 0 && (
            <p
              className="mt-1.5 truncate font-mono text-[0.65rem] text-faint"
              title={alerta.skus.join(", ")}
            >
              SKUs: {alerta.skus.slice(0, 5).join(", ")}
              {alerta.skus.length > 5 ? ` +${alerta.skus.length - 5}` : ""}
            </p>
          )}
        </div>
        {onAction && (
          <button
            onClick={() => onAction(alerta)}
            className={cn(
              "shrink-0 rounded-md border border-border-soft bg-surface-2 px-2.5 py-1 text-caption font-semibold text-fg",
              "transition-colors hover:bg-surface-3 hover:border-border",
            )}
          >
            Resolver
          </button>
        )}
      </CardBody>
    </Card>
  );
}

/**
 * Lista de alertas con empty state amable. Mantiene el orden que llega del
 * backend (ya viene priorizado por severidad + impacto).
 */
export function AlertaList({
  alertas,
  onAction,
  emptyLabel = "Sin alertas activas",
  className,
}: {
  alertas: PulseAlerta[];
  onAction?: (alerta: PulseAlerta) => void;
  emptyLabel?: string;
  className?: string;
}) {
  if (alertas.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center gap-3 rounded-xl border border-dashed border-success/25 bg-success/5 px-5 py-6 text-success",
          className,
        )}
      >
        <PartyPopper className="h-5 w-5" aria-hidden="true" />
        <p className="text-body font-semibold">{emptyLabel}</p>
      </div>
    );
  }
  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      {alertas.map((a, i) => (
        <AlertaChip key={`${a.tipo}-${i}`} alerta={a} onAction={onAction} />
      ))}
    </div>
  );
}
