"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AlertaSeveridad, MetaEstado, VeredictoCodigo } from "@/lib/bi-types";
import { ESTADO_META, SEVERIDAD_ALERTA, VEREDICTO } from "./constants";

/**
 * Badge coloreado por `MetaEstado` (META_CUMPLIDA / ADELANTADO / …).
 * Icono automático + tono automático. Usar en headers de mes y en filas de tabla.
 */
export function EstadoBadge({
  estado,
  showIcon = true,
  className,
}: {
  estado: MetaEstado;
  showIcon?: boolean;
  className?: string;
}) {
  const meta = ESTADO_META[estado];
  const Icon = meta.icon;
  return (
    <Badge tone={meta.tone} className={cn("gap-1", className)}>
      {showIcon && <Icon className="h-3 w-3" aria-hidden="true" />}
      {meta.label}
    </Badge>
  );
}

/** Variante para `VeredictoCodigo`. Mismo shape que EstadoBadge. */
export function VeredictoBadge({
  codigo,
  showIcon = true,
  className,
}: {
  codigo: VeredictoCodigo;
  showIcon?: boolean;
  className?: string;
}) {
  const meta = VEREDICTO[codigo];
  const Icon = meta.icon;
  return (
    <Badge tone={meta.tone} className={cn("gap-1", className)}>
      {showIcon && <Icon className="h-3 w-3" aria-hidden="true" />}
      {meta.label}
    </Badge>
  );
}

/** Variante para severidad de alertas. */
export function SeveridadBadge({
  severidad,
  showIcon = true,
  className,
}: {
  severidad: AlertaSeveridad;
  showIcon?: boolean;
  className?: string;
}) {
  const meta = SEVERIDAD_ALERTA[severidad];
  const Icon = meta.icon;
  return (
    <Badge tone={meta.tone} className={cn("gap-1", className)}>
      {showIcon && <Icon className="h-3 w-3" aria-hidden="true" />}
      {meta.label}
    </Badge>
  );
}
