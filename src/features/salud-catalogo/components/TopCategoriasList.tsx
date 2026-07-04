"use client";

import { FolderTree } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { money, num } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TopCategoriasBlock } from "@/lib/bi-types";
import { TENDENCIA, formatDeltaPct } from "@/features/bi/shared";

/**
 * Top categorías últ. 30 días vs YoY. Tarjeta compacta con tendencia
 * (subiendo/bajando/estable/hueco/nuevo) como badge.
 */
export function TopCategoriasList({
  categorias,
}: {
  categorias: TopCategoriasBlock;
}) {
  return (
    <Card>
      <CardHeader
        eyebrow={`Top categorías · ${categorias.ventana}`}
        title={
          <span className="flex items-center gap-2">
            <FolderTree className="h-5 w-5 text-primary" />
            {money(categorias.total_actual)}{" "}
            <span className={cn(
              "font-mono text-body font-bold",
              // null u 0 en neutro — antes el "—" salía pintado de rojo.
              categorias.delta_yoy_pct == null || categorias.delta_yoy_pct === 0
                ? "text-fg"
                : categorias.delta_yoy_pct > 0
                ? "text-success"
                : "text-danger",
            )}>
              {formatDeltaPct(categorias.delta_yoy_pct)}
            </span>
          </span>
        }
        subtitle={`${categorias.categorias_totales} categorías con venta · mismas fechas del año pasado: ${money(categorias.total_yoy)}`}
      />
      <CardBody className="p-0">
        {categorias.top_categorias.length === 0 ? (
          <p className="p-6 text-center text-caption text-faint">
            Sin categorías con venta en la ventana.
          </p>
        ) : (
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            <table className="w-full text-caption">
              <thead className="sticky top-0 bg-surface-2/95 backdrop-blur-md">
                <tr className="border-b border-border-soft text-[0.65rem] uppercase tracking-wider text-faint">
                  <th className="px-4 py-2 text-left font-semibold">Categoría</th>
                  <th className="px-4 py-2 text-right font-semibold">Últ. 30 días</th>
                  <th
                    className="cursor-help px-4 py-2 text-right font-semibold"
                    title="Venta de las mismas fechas del año pasado"
                  >
                    Año pasado
                  </th>
                  <th className="px-4 py-2 text-right font-semibold">Cambio</th>
                  <th
                    className="cursor-help px-4 py-2 text-right font-semibold"
                    title="Cantidad de productos distintos con venta en la ventana"
                  >
                    SKUs
                  </th>
                  <th className="px-4 py-2 text-left font-semibold">Tendencia</th>
                </tr>
              </thead>
              <tbody>
                {categorias.top_categorias.map((c, i) => {
                  const tend = TENDENCIA[c.tendencia];
                  const TendIcon = tend?.icon;
                  return (
                    <tr
                      key={`${c.categoria}-${i}`}
                      className="border-b border-border-soft/50 hover:bg-surface-2/40"
                    >
                      <td className="px-4 py-2">
                        <p className="truncate font-semibold text-fg">{c.categoria}</p>
                        <p className="truncate text-[0.6rem] text-faint">
                          {c.departamento}
                        </p>
                      </td>
                      <td className="px-4 py-2 text-right font-mono tabular-nums text-fg">
                        {money(c.ventas_30d)}
                      </td>
                      <td className="px-4 py-2 text-right font-mono tabular-nums text-muted">
                        {money(c.ventas_30d_yoy)}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-2 text-right font-mono tabular-nums font-semibold",
                          c.delta_yoy_pct == null
                            ? "text-fg"
                            : c.delta_yoy_pct > 0
                            ? "text-success"
                            : c.delta_yoy_pct < 0
                            ? "text-danger"
                            : "text-fg",
                        )}
                      >
                        {formatDeltaPct(c.delta_yoy_pct)}
                      </td>
                      <td className="px-4 py-2 text-right font-mono tabular-nums text-muted">
                        {num(c.skus_con_venta)}
                      </td>
                      <td className="px-4 py-2">
                        {tend ? (
                          <Badge tone={tend.tone} className="gap-1">
                            {TendIcon && (
                              <TendIcon className="h-3 w-3" aria-hidden="true" />
                            )}
                            {tend.label}
                          </Badge>
                        ) : (
                          <span className="text-faint">{c.tendencia}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
