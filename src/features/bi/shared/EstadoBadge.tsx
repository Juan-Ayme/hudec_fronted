"use client";

import { Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AlertaSeveridad, MetaEstado, VeredictoCodigo } from "@/lib/bi-types";
import { ESTADO_META, ESTADO_META_DESC, SEVERIDAD_ALERTA, VEREDICTO } from "./constants";

/**
 * Badge coloreado por `MetaEstado` (META_CUMPLIDA / ADELANTADO / …).
 * Icono automático + tono automático + tooltip que explica qué significa el
 * estado en lenguaje simple. Usar en headers de mes y en filas de tabla.
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
  // El backend puede mandar estados nuevos (ej. "INDETERMINADO" al inicio
  // del mes sin días cerrados) — fallback neutro en vez de crashear.
  const meta = ESTADO_META[estado] ?? {
    tone: "neutral" as const,
    label: String(estado).toLowerCase().replaceAll("_", " "),
    icon: Circle,
  };
  const Icon = meta.icon;
  return (
    <Badge
      tone={meta.tone}
      className={cn("cursor-help gap-1", className)}
      title={ESTADO_META_DESC[estado]}
    >
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
