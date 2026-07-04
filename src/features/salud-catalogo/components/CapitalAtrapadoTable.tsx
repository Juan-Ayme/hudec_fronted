"use client";

import { Package } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { money, num, pct } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CapitalAtrapado } from "@/lib/bi-types";
import { HelpTip } from "@/features/bi/shared";

/**
 * Tabla de SKUs con capital atrapado (recibidos ≤90d con sellthrough <20%).
 * El KPI grande arriba es el monto total a nivel catálogo.
 */
export function CapitalAtrapadoTable({
  data,
}: {
  data: CapitalAtrapado;
}) {
  return (
    <Card>
      <CardHeader
        eyebrow="Capital atrapado"
        title={
          <span className="flex items-center gap-2">
            <Package className="h-5 w-5 text-warning" />
            {money(data.monto_total_pen)}
            <span className="text-caption text-faint">
              en {num(data.skus_count_total)} SKUs
            </span>
            <HelpTip text="Plata invertida en mercadería que llegó hace poco y casi no se vende. Conviene decidir: ¿empujar, mover de tienda o liquidar?" />
          </span>
        }
        subtitle={`Criterio: ${data.criterio}`}
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
                  <th
                    className="cursor-help px-4 py-2 text-left font-semibold"
                    title="Fecha en que llegó la mercadería"
                  >
                    Llegó el
                  </th>
                  <th
                    className="cursor-help px-4 py-2 text-right font-semibold"
                    title="Unidades recibidas / unidades vendidas desde la recepción"
                  >
                    Recibidas / Vend.
                  </th>
                  <th className="px-4 py-2 text-right font-semibold">Stock</th>
                  <th
                    className="cursor-help px-4 py-2 text-right font-semibold"
                    title="De cada 100 unidades recibidas, cuántas ya se vendieron. Menos de 20% en 90 días es señal de alerta."
                  >
                    % vendido
                  </th>
                  <th
                    className="cursor-help px-4 py-2 text-right font-semibold"
                    title="Plata parada: stock actual × costo unitario"
                  >
                    Capital parado
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.top_skus.map((s, i) => {
                  const stTone =
                    s.sellthrough_pct < 5
                      ? "text-danger"
                      : s.sellthrough_pct < 15
                      ? "text-warning"
                      : "text-fg";
                  return (
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
                      <td className="px-4 py-2 text-fg">{s.fecha_recepcion}</td>
                      <td className="px-4 py-2 text-right font-mono tabular-nums">
                        <span className="text-fg">{num(s.unds_recibidas)}</span>
                        <span className="text-faint"> / </span>
                        <span className="text-muted">{num(s.unds_vendidas)}</span>
                      </td>
                      <td className="px-4 py-2 text-right font-mono tabular-nums text-fg">
                        {num(s.stock_actual)}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-2 text-right font-mono tabular-nums font-semibold",
                          stTone,
                        )}
                      >
                        {pct(s.sellthrough_pct)}
                      </td>
                      <td className="px-4 py-2 text-right font-mono tabular-nums font-bold text-warning">
                        {money(s.capital_atrapado_pen)}
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
