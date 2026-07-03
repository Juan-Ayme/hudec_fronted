"use client";

import {
  AlertOctagon,
  Gift,
  PackageX,
  Percent,
  type LucideIcon,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { money, num } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  DiagnosisFactores,
} from "@/lib/bi-types";
import { formatDeltaPct, formatDeltaPp } from "@/features/bi/shared";

/**
 * 4 cards con factores explicativos que NO suman al delta (son lentes):
 *   1. Venta perdida por quiebre.
 *   2. Cambio en descuentos.
 *   3. Devoluciones.
 *   4. Gratuidades / regalos.
 */
export function FactoresSection({
  factores,
}: {
  factores: DiagnosisFactores;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <FactorCard
        icon={PackageX}
        tone="danger"
        title="Venta perdida (quiebres)"
        primary={money(factores.venta_perdida_por_quiebre.monto_estimado_pen)}
        secondary={`${num(factores.venta_perdida_por_quiebre.skus_con_perdida)} SKUs afectados`}
      />
      <FactorCard
        icon={Percent}
        tone="info"
        title="Descuentos aplicados"
        primary={formatDeltaPp(factores.cambio_descuentos.delta_pp)}
        secondary={`Actual ${formatPct(factores.cambio_descuentos.pct_actual)} · prev ${formatPct(factores.cambio_descuentos.pct_prev)}`}
      />
      <FactorCard
        icon={AlertOctagon}
        tone="warning"
        title="Devoluciones"
        primary={money(factores.devoluciones.monto_actual)}
        secondary={
          factores.devoluciones.monto_prev != null
            ? `prev ${money(factores.devoluciones.monto_prev)}${
                factores.devoluciones.delta_pct != null
                  ? ` · ${formatDeltaPct(factores.devoluciones.delta_pct)}`
                  : ""
              }`
            : "—"
        }
      />
      <FactorCard
        icon={Gift}
        tone="violet"
        title="Gratuidades"
        primary={num(factores.gratuidades.lineas_actual)}
        secondary={
          typeof factores.gratuidades.lineas_prev === "number"
            ? `prev ${num(factores.gratuidades.lineas_prev)}`
            : "—"
        }
      />
    </div>
  );
}

const toneStyles = {
  danger: { bg: "bg-danger/8", border: "border-danger/25", icon: "text-danger" },
  warning: { bg: "bg-warning/8", border: "border-warning/25", icon: "text-warning" },
  info: { bg: "bg-info/8", border: "border-info/25", icon: "text-info" },
  violet: { bg: "bg-violet/8", border: "border-violet/25", icon: "text-violet" },
  success: { bg: "bg-success/8", border: "border-success/25", icon: "text-success" },
} as const;

function FactorCard({
  icon: Icon,
  tone,
  title,
  primary,
  secondary,
}: {
  icon: LucideIcon;
  tone: keyof typeof toneStyles;
  title: string;
  primary: string;
  secondary: string;
}) {
  const t = toneStyles[tone];
  return (
    <Card className={cn("border", t.border, t.bg)}>
      <CardBody className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5",
              t.icon,
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
          </span>
          <p className="text-caption font-semibold uppercase tracking-[0.08em] text-muted">
            {title}
          </p>
        </div>
        <p className="text-xl font-bold tabular-nums tracking-tight text-fg">
          {primary}
        </p>
        <p className="text-[0.7rem] tabular-nums text-faint">{secondary}</p>
      </CardBody>
    </Card>
  );
}

function formatPct(v: unknown): string {
  if (typeof v !== "number" || !Number.isFinite(v)) return "—";
  return `${v.toFixed(2)}%`;
}
