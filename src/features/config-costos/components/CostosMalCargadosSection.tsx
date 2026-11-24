"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Download } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { downloadExcelFile } from "@/lib/api";
import { money, num } from "@/lib/format";
import { cn } from "@/lib/utils";
import { costosMalCargadosExcelUrl, getCostosMalCargados } from "@/lib/bi-api";

/**
 * Compras con costo >= precio de venta: errores de carga en BSale (costo de la
 * caja en vez de la unidad, o el precio tipeado como costo). El sistema ya no
 * las usa (toma la compra válida anterior), pero en BSale siguen afectando el
 * costo promedio, el margen y el valor del inventario.
 */
export function CostosMalCargadosSection() {
  const [sucursal, setSucursal] = useState<string | null>(null);
  const q = useQuery({
    queryKey: ["bi", "variant-costs", "mal-cargados", 12],
    queryFn: ({ signal }) => getCostosMalCargados(12, signal),
    staleTime: 60_000,
  });

  const d = q.data;
  const filas = (d?.detalle ?? []).filter((f) => !sucursal || f.sucursal === sucursal);

  return (
    <Card>
      <CardHeader
        title="Costos mal cargados en BSale"
        subtitle="Compras de los últimos 12 meses con costo igual o mayor al precio de venta. El sistema ya las ignora; corrígelas en BSale → Actualizar costos, eligiendo la sucursal indicada."
        action={
          d && d.total > 0 ? (
            <Button size="sm" variant="outline" className="gap-1.5"
              onClick={() => downloadExcelFile(costosMalCargadosExcelUrl(12), "Costos_mal_cargados.xlsx").catch(console.error)}>
              <Download className="h-4 w-4" /> Excel
            </Button>
          ) : null
        }
      />
      <CardBody>
        {q.isError ? (
          <ErrorState error={q.error} />
        ) : !d ? (
          <LoadingState label="Buscando costos mal cargados…" />
        ) : d.total === 0 ? (
          <p className="text-sm text-success">Ninguna compra con costo mayor o igual al precio de venta. 👍</p>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="flex items-center gap-1.5 text-warning">
                <AlertTriangle className="h-4 w-4" />
                {num(d.total)} compras · {num(d.productos)} productos
              </span>
              <button onClick={() => setSucursal(null)}
                className={cn("rounded-full border px-3 py-1 text-xs", !sucursal
                  ? "border-primary/50 bg-primary/15 text-fg" : "border-white/10 text-muted hover:text-fg")}>
                Todas
              </button>
              {Object.entries(d.por_sucursal).map(([s, n]) => (
                <button key={s} onClick={() => setSucursal(s)}
                  className={cn("rounded-full border px-3 py-1 text-xs", sucursal === s
                    ? "border-primary/50 bg-primary/15 text-fg" : "border-white/10 text-muted hover:text-fg")}>
                  {s} <span className="text-faint">· {n}</span>
                </button>
              ))}
            </div>
            <div className="max-h-[28rem] overflow-auto rounded-lg border border-white/5">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-surface text-left text-xs text-muted">
                  <tr>
                    <th className="px-3 py-2">Producto</th>
                    <th className="px-3 py-2">Sucursal · fecha</th>
                    <th className="px-3 py-2 text-right">Costo en BSale</th>
                    <th className="px-3 py-2 text-right">Precio venta</th>
                    <th className="px-3 py-2 text-right">Costo que usa el sistema</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filas.map((f) => (
                    <tr key={`${f.recepcion}-${f.sku}`}>
                      <td className="px-3 py-2">
                        <p className="max-w-[22rem] truncate text-fg" title={f.producto}>{f.producto || f.sku}</p>
                        <p className="text-xs text-faint">{f.sku} · {num(f.cantidad)} u · recepción {f.recepcion}</p>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted">{f.sucursal}<br />{f.fecha}</td>
                      <td className="px-3 py-2 text-right font-mono text-danger">
                        {money(f.costo_cargado)}
                        <Badge tone="danger" className="ml-1.5">{f.veces_precio}× precio</Badge>
                      </td>
                      <td className="px-3 py-2 text-right font-mono">{money(f.precio_venta)}</td>
                      <td className={cn("px-3 py-2 text-right font-mono",
                        f.costo_que_usa_el_sistema != null && f.costo_que_usa_el_sistema < f.precio_venta
                          ? "text-success" : "text-warning")}>
                        {f.costo_que_usa_el_sistema != null ? money(f.costo_que_usa_el_sistema) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-faint">
              Verde: el sistema ya usa un costo válido. Ámbar: no hay ninguna compra válida de ese producto; el
              costo sigue mal hasta corregirlo en BSale.
            </p>
          </>
        )}
      </CardBody>
    </Card>
  );
}
