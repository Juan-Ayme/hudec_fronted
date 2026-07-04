"use client";

import { money, num, pct } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Muestra el patrón "Opción B": un número principal (TOTAL) grande con un
 * sub-número (RECURRENTE) chico debajo. Es el header estándar de cualquier
 * KPI del dashboard BI.
 *
 * "El dueño cobra `total`, pero opera en `recurrente`" — la doc del backend.
 */
export function TotalRecurrentePair({
  total,
  recurrente,
  format = "money",
  label,
  align = "left",
  size = "lg",
  className,
}: {
  total: number | null | undefined;
  recurrente: number | null | undefined;
  /** money = "S/ 1,234.50" · num = "1,234" · pct = "12.3%" */
  format?: "money" | "num" | "pct";
  label?: string;
  align?: "left" | "right" | "center";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const fmt = format === "money" ? money : format === "pct" ? pct : num;

  const sizes = {
    sm: { total: "text-base font-semibold", recu: "text-[0.65rem]" },
    md: { total: "text-lg font-bold",      recu: "text-[0.7rem]" },
    lg: { total: "text-2xl font-bold",     recu: "text-xs" },
    xl: { total: "text-3xl font-bold",     recu: "text-sm" },
  } as const;
  const s = sizes[size];

  const alignClass =
    align === "right" ? "items-end text-right"
    : align === "center" ? "items-center text-center"
    : "items-start text-left";

  return (
    <div className={cn("flex flex-col gap-0.5", alignClass, className)}>
      {label && (
        <p className="text-caption font-semibold uppercase tracking-[0.08em] text-muted">
          {label}
        </p>
      )}
      <p className={cn("tabular-nums tracking-tight text-fg", s.total)}>
        {fmt(total)}
      </p>
      <p
        className={cn(
          "tabular-nums text-faint",
          s.recu,
        )}
        title="Venta recurrente: excluye las categorías de temporada (Navidad, Día del Padre, etc.). Es la venta 'de todos los días' — la mejor señal de cómo va el negocio de fondo."
      >
        {fmt(recurrente)}{" "}
        <span className="cursor-help text-muted/70 underline decoration-dotted decoration-muted/40 underline-offset-2">
          recurrente
        </span>
      </p>
    </div>
  );
}
