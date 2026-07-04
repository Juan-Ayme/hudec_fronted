"use client";

import { AlertCircle, PackageX } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { HuecoYoy } from "@/lib/bi-types";
import { formatDeltaPct } from "@/features/bi/shared";

const DIAG_LABEL: Record<string, { label: string; tone: "danger" | "warning" | "info" }> = {
  cambio_de_demanda: { label: "Cambio de demanda", tone: "warning" },
  discontinuado_sin_reemplazo: { label: "Discontinuado sin reemplazo", tone: "danger" },
};

/**
 * Grid de subcategorías que cayeron >50% vs mismo período hace 12 meses.
 * Cada card muestra la sub-cat, el hueco en S/ y el diagnóstico.
 */
export function HuecosYoyList({ huecos }: { huecos: HuecoYoy[] }) {
  return (
    <Card>
      <CardHeader
        eyebrow="Huecos vs año pasado"
        title={
          <span className="flex items-center gap-2">
            <PackageX className="h-5 w-5 text-danger" />
            Sub-categorías que perdieron demanda
          </span>
        }
        subtitle="Rubros que venden mucho menos que hace un año. El 'hueco' es la plata que se está dejando de facturar frente al año pasado."
      />
      <CardBody>
        {huecos.length === 0 ? (
          <p className="py-6 text-center text-caption text-faint">
            Sin huecos significativos vs YoY.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {huecos.map((h, i) => {
              const diag = DIAG_LABEL[h.diagnostico] ?? {
                label: h.diagnostico,
                tone: "info" as const,
              };
              return (
                <div
                  key={`${h.subcategoria}-${i}`}
                  className={cn(
                    "flex flex-col gap-2 rounded-lg border border-danger/20 bg-danger/6 p-3",
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-body font-semibold text-fg">
                      {h.subcategoria}
                    </p>
                    <p className="truncate text-[0.65rem] text-faint">
                      {h.departamento} · {h.categoria}
                    </p>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <div>
                      <p
                        className="cursor-help text-caption text-muted"
                        title="Plata que faltó frente a las mismas fechas del año pasado"
                      >
                        Hueco
                      </p>
                      <p className="font-mono text-lg font-bold tabular-nums text-danger">
                        {money(h.hueco_pen)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-caption text-muted">vs año pasado</p>
                      <p className="font-mono text-body font-bold tabular-nums text-danger">
                        {formatDeltaPct(h.delta_pct)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-danger/15 pt-2 text-[0.65rem]">
                    <span className="text-faint">
                      ahora {money(h.venta_actual)} · antes {money(h.venta_yoy)}
                    </span>
                    <Badge tone={diag.tone} className="gap-1">
                      <AlertCircle className="h-3 w-3" aria-hidden="true" />
                      {diag.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
