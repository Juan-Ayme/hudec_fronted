"use client";

import { Layers } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { money, num, pct } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ComposicionBucket, ComposicionCatalogo } from "@/lib/bi-types";
import { COMPOSICION_BUCKET, type CodigoMeta } from "@/features/bi/shared";

const BUCKET_ORDER: ComposicionBucket[] = ["nuevo", "reciente", "clasico"];

const BUCKET_BG: Record<string, string> = {
  nuevo: "bg-success/70",
  reciente: "bg-info/70",
  clasico: "bg-muted/50",
};

/** Barras apiladas horizontales: % de venta por bucket (nuevo / reciente / clásico). */
export function ComposicionCatalogoSection({
  composicion,
}: {
  composicion: ComposicionCatalogo;
}) {
  const ordered = [...composicion.por_edad].sort(
    (a, b) => BUCKET_ORDER.indexOf(a.bucket as ComposicionBucket) - BUCKET_ORDER.indexOf(b.bucket as ComposicionBucket),
  );
  return (
    <Card>
      <CardHeader
        eyebrow={`Composición del catálogo · venta ${composicion.ventana_venta}`}
        title={
          <span className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-info" />
            {money(composicion.total_venta_pen)} · {num(composicion.total_skus)} SKUs
          </span>
        }
        subtitle={composicion.lectura}
      />
      <CardBody className="flex flex-col gap-4">
        {/* Barra apilada */}
        <div className="flex h-4 w-full overflow-hidden rounded-md">
          {ordered.map((b) => (
            <div
              key={b.bucket}
              className={cn(BUCKET_BG[b.bucket] ?? "bg-surface-3")}
              style={{ width: `${b.pct_venta}%` }}
              title={`${b.etiqueta}: ${b.pct_venta.toFixed(1)}% de venta`}
            />
          ))}
        </div>

        {/* Detalle por bucket */}
        <div className="grid gap-3 md:grid-cols-3">
          {ordered.map((b) => {
            const meta: CodigoMeta | undefined = (COMPOSICION_BUCKET as Record<string, CodigoMeta>)[b.bucket];
            const Icon = meta?.icon ?? Layers;
            const cls = BUCKET_BG[b.bucket] ?? "bg-surface-3";
            return (
              <div
                key={b.bucket}
                className="flex flex-col gap-1.5 rounded-lg border border-border-soft bg-surface-2/40 p-3"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn("h-3 w-3 rounded-full", cls)}
                    aria-hidden="true"
                  />
                  <Icon className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                  <p className="text-caption font-semibold text-fg">
                    {b.etiqueta}
                  </p>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-mono text-body font-bold tabular-nums text-fg">
                    {pct(b.pct_venta)}
                  </p>
                  <p className="font-mono text-[0.65rem] tabular-nums text-faint">
                    {num(b.skus)} SKUs · {money(b.venta_pen)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
