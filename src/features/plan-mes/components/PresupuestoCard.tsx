"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, ShoppingCart, Wallet } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { money, pct } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Presupuesto } from "@/lib/bi-types";
import { ROL_TARGET, formatMes } from "@/features/bi/shared";

/**
 * Presupuesto de compra sugerido: KPI grande arriba (monto + margen usado),
 * toggle expansible con la tabla de desglose por categoría/sucursal.
 */
export function PresupuestoCard({ presupuesto }: { presupuesto: Presupuesto }) {
  const [expanded, setExpanded] = useState(false);
  const hasDesglose = (presupuesto.desglose_por_categoria?.length ?? 0) > 0;

  return (
    <Card>
      <CardHeader
        eyebrow={`Presupuesto de compra · ${formatMes(presupuesto.mes_objetivo)}`}
        title={
          <span className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-warning" />
            {money(presupuesto.presupuesto_compra_pen)}
          </span>
        }
        subtitle={`Meta de venta ${money(presupuesto.meta_venta)} · margen promedio ${pct(presupuesto.margen_promedio_pct)} (${presupuesto.muestras_margen} muestras)`}
      />
      <CardBody className="flex flex-col gap-3">
        <div className="grid gap-3 md:grid-cols-3">
          <MiniKpi
            label="Meta de venta"
            value={money(presupuesto.meta_venta)}
            icon={<ShoppingCart className="h-4 w-4" />}
          />
          <MiniKpi
            label="Costo estimado"
            value={money(presupuesto.costo_estimado_pen)}
            sub={`${pct(100 - presupuesto.margen_promedio_pct)} de la venta`}
          />
          <MiniKpi
            label="Margen promedio"
            value={pct(presupuesto.margen_promedio_pct)}
            sub={`${presupuesto.muestras_margen} meses de muestra`}
          />
        </div>

        <p className="text-caption text-faint">{presupuesto.nota}</p>

        {hasDesglose && (
          <>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 flex items-center gap-2 self-start rounded-md border border-border-soft bg-surface-2 px-3 py-1.5 text-caption font-semibold text-fg transition-colors hover:bg-surface-3"
            >
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
              Desglose por categoría ({presupuesto.desglose_por_categoria?.length ?? 0})
            </button>

            {expanded && (
              <div className="max-h-96 overflow-y-auto custom-scrollbar rounded-lg border border-border-soft">
                <table className="w-full text-caption">
                  <thead className="sticky top-0 bg-surface-2/95 backdrop-blur-md">
                    <tr className="border-b border-border-soft text-[0.65rem] uppercase tracking-wider text-faint">
                      <th className="px-3 py-2 text-left font-semibold">Categoría</th>
                      <th className="px-3 py-2 text-left font-semibold">Rol · Sucursal</th>
                      <th className="px-3 py-2 text-right font-semibold">Share</th>
                      <th className="px-3 py-2 text-right font-semibold">Cuota venta</th>
                      <th className="px-3 py-2 text-right font-semibold">Margen%</th>
                      <th className="px-3 py-2 text-right font-semibold">Presupuesto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {presupuesto.desglose_por_categoria?.map((r) => {
                      const rol = ROL_TARGET[r.rol];
                      return (
                        <tr
                          key={`${r.category_id}-${r.office_id}`}
                          className="border-b border-border-soft/50 hover:bg-surface-2/40"
                        >
                          <td className="px-3 py-2">
                            <p className="truncate font-semibold text-fg">
                              {r.categoria}
                            </p>
                            <p className="truncate text-[0.6rem] text-faint">
                              {r.departamento}
                            </p>
                          </td>
                          <td className="px-3 py-2">
                            <Badge tone={rol.tone} className="mr-1">
                              {rol.label}
                            </Badge>
                            <span className="text-[0.65rem] text-muted">
                              {r.sucursal}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right font-mono tabular-nums text-fg">
                            {pct(r.share_del_total_pct)}
                          </td>
                          <td className="px-3 py-2 text-right font-mono tabular-nums text-fg">
                            {money(r.cuota_meta_venta_pen)}
                          </td>
                          <td className="px-3 py-2 text-right font-mono tabular-nums text-muted">
                            {pct(r.margen_objetivo_pct)}
                          </td>
                          <td className="px-3 py-2 text-right font-mono tabular-nums font-bold text-warning">
                            {money(r.presupuesto_compra_pen)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}

function MiniKpi({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border-soft bg-surface-2/40 px-3 py-2">
      <p className={cn(
        "flex items-center gap-1 text-[0.6rem] font-bold uppercase tracking-wider text-faint",
      )}>
        {icon}
        {label}
      </p>
      <p className="mt-0.5 font-mono text-lg font-bold tabular-nums text-fg">
        {value}
      </p>
      {sub && <p className="text-[0.65rem] tabular-nums text-faint">{sub}</p>}
    </div>
  );
}
