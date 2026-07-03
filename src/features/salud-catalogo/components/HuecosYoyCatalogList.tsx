"use client";

import { PackageX } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { HuecosYoyBlock } from "@/lib/bi-types";
import { formatDeltaPct } from "@/features/bi/shared";

/**
 * Sección de huecos vs YoY en la vista de Salud del Catálogo.
 * A diferencia del componente análogo en /diagnostico, acá el foco es
 * global (todo el catálogo) y viene con un total agregado.
 */
export function HuecosYoyCatalogList({ block }: { block: HuecosYoyBlock }) {
  return (
    <Card>
      <CardHeader
        eyebrow={`Huecos YoY · ${block.ventana}`}
        title={
          <span className="flex items-center gap-2">
            <PackageX className="h-5 w-5 text-danger" />
            {money(block.total_hueco_pen)} en {block.subcategorias_count} sub-categorías
          </span>
        }
        subtitle={block.criterio}
      />
      <CardBody>
        {block.top_huecos.length === 0 ? (
          <p className="py-6 text-center text-caption text-faint">
            Sin huecos significativos vs YoY.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {block.top_huecos.map((h, i) => (
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
                    <p className="text-caption text-muted">Hueco</p>
                    <p className="font-mono text-lg font-bold tabular-nums text-danger">
                      {money(h.hueco_pen)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-caption text-muted">Δ vs YoY</p>
                    <p className="font-mono text-body font-bold tabular-nums text-danger">
                      {formatDeltaPct(h.delta_pct)}
                    </p>
                  </div>
                </div>
                <p className="border-t border-danger/15 pt-2 text-[0.65rem] text-faint">
                  {money(h.venta_actual)} vs {money(h.venta_yoy)}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
