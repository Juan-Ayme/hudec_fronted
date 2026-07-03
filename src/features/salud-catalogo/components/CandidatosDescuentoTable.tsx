"use client";

import { Percent } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { money, num } from "@/lib/format";
import type { CandidatosDescuento } from "@/lib/bi-types";

/**
 * SKUs sin movimiento en X días — candidatos naturales a promo/descuento.
 * KPI grande arriba con el valor de inventario expuesto.
 */
export function CandidatosDescuentoTable({
  data,
}: {
  data: CandidatosDescuento;
}) {
  return (
    <Card>
      <CardHeader
        eyebrow="Candidatos a descuento"
        title={
          <span className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-warning" />
            {money(data.valor_inventario_pen)}
            <span className="text-caption text-faint">
              en {num(data.skus_count_total)} SKUs
            </span>
          </span>
        }
        subtitle={data.criterio}
      />
      <CardBody className="p-0">
        {data.top_skus.length === 0 ? (
          <p className="p-6 text-center text-caption text-faint">
            Sin SKUs que califiquen bajo este criterio.
          </p>
        ) : (
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            <table className="w-full text-caption">
              <thead className="sticky top-0 bg-surface-2/95 backdrop-blur-md">
                <tr className="border-b border-border-soft text-[0.65rem] uppercase tracking-wider text-faint">
                  <th className="px-4 py-2 text-left font-semibold">SKU · Producto</th>
                  <th className="px-4 py-2 text-right font-semibold">Stock</th>
                  <th className="px-4 py-2 text-right font-semibold">Días s/venta</th>
                  <th className="px-4 py-2 text-right font-semibold">Costo unit</th>
                  <th className="px-4 py-2 text-right font-semibold">Valor inv.</th>
                </tr>
              </thead>
              <tbody>
                {data.top_skus.map((s, i) => (
                  <tr
                    key={`${s.sku}-${i}`}
                    className="border-b border-border-soft/50 hover:bg-surface-2/40"
                  >
                    <td className="px-4 py-2">
                      <p className="truncate font-semibold text-fg">{s.producto}</p>
                      <p className="font-mono text-[0.6rem] text-faint">
                        {s.sku} · {s.sucursal}
                      </p>
                    </td>
                    <td className="px-4 py-2 text-right font-mono tabular-nums text-fg">
                      {num(s.stock_actual)}
                    </td>
                    <td className="px-4 py-2 text-right font-mono tabular-nums text-warning font-semibold">
                      {num(s.dias_sin_venta)}
                    </td>
                    <td className="px-4 py-2 text-right font-mono tabular-nums text-muted">
                      {money(s.costo_unit)}
                    </td>
                    <td className="px-4 py-2 text-right font-mono tabular-nums font-bold text-warning">
                      {money(s.valor_inventario_pen)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
