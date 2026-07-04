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
import { HelpTip, formatDeltaPct, formatDeltaPp } from "@/features/bi/shared";

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
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <h2 className="text-h3 font-semibold text-fg">Otros factores del período</h2>
        <HelpTip text="Cuatro lentes que ayudan a explicar el cambio en ventas. No se suman entre sí ni al total — cada uno se lee por separado." />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <FactorCard
          icon={PackageX}
          tone="danger"
          title="Venta perdida (quiebres)"
          help="Venta que se estima perdida por productos agotados que la gente sigue pidiendo."
          primary={money(factores.venta_perdida_por_quiebre.monto_estimado_pen)}
          secondary={`${num(factores.venta_perdida_por_quiebre.skus_con_perdida)} productos afectados`}
        />
        <FactorCard
          icon={Percent}
          tone="info"
          title="Descuentos aplicados"
          help="Cambio en el descuento promedio sobre el precio, en puntos porcentuales, vs el período anterior. Más descuento puede subir unidades pero baja el margen."
          primary={formatDeltaPp(factores.cambio_descuentos.delta_pp)}
          secondary={`Ahora ${formatPct(factores.cambio_descuentos.pct_actual)} · antes ${formatPct(factores.cambio_descuentos.pct_prev)}`}
        />
        <FactorCard
          icon={AlertOctagon}
          tone="warning"
          title="Devoluciones"
          help="Monto devuelto por clientes en el período. Un salto fuerte puede indicar un problema de producto o de venta."
          primary={money(factores.devoluciones.monto_actual)}
          secondary={
            factores.devoluciones.monto_prev != null
              ? `antes ${money(factores.devoluciones.monto_prev)}${
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
          help="Líneas de venta a S/ 0 (regalos, promociones, muestras). Se cuentan en unidades, no en soles."
          primary={num(factores.gratuidades.lineas_actual)}
          secondary={
            typeof factores.gratuidades.lineas_prev === "number"
              ? `antes ${num(factores.gratuidades.lineas_prev)}`
              : "—"
          }
        />
      </div>
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
  help,
  primary,
  secondary,
}: {
  icon: LucideIcon;
  tone: keyof typeof toneStyles;
  title: string;
  help?: string;
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
          <p className="flex items-center gap-1 text-caption font-semibold uppercase tracking-[0.08em] text-muted">
            {title}
            {help && <HelpTip text={help} />}
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
