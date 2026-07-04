"use client";

import Link from "next/link";
import { AlertOctagon, ArrowRight } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { money, num } from "@/lib/format";
import type { QuiebresDemanda } from "@/lib/bi-types";
import { HelpTip } from "@/features/bi/shared";

/**
 * Preview de quiebres con demanda activa. El detalle real está en
 * /diagnostico (factores_adicionales.venta_perdida_por_quiebre) — acá se
 * muestran los top 5 como aperitivo con link.
 */
export function QuiebresPreviewCard({
  data,
}: {
  data: QuiebresDemanda;
}) {
  return (
    <Card>
      <CardHeader
        eyebrow={`Agotados con demanda · últimos ${data.ventana_dias} días`}
        title={
          <span className="flex items-center gap-2">
            <AlertOctagon className="h-5 w-5 text-danger" />
            {money(data.monto_estimado_pen)} perdidos en {num(data.skus_count)} SKUs
            <HelpTip text="Productos sin stock que la gente sigue pidiendo. El monto estima cuánto se habría vendido si hubiera habido stock. Prioridad de reposición." />
          </span>
        }
        action={
          <Link
            href="/diagnostico"
            className="inline-flex items-center gap-1 rounded-md border border-info/40 bg-info/10 px-3 py-1.5 text-caption font-semibold text-info transition-colors hover:bg-info/20"
          >
            Ver detalle
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        }
      />
      <CardBody>
        {data.top_skus.length === 0 ? (
          <p className="text-center text-caption text-faint py-4">
            Sin quiebres con demanda activa.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {data.top_skus.map((s, i) => (
              <li
                key={`${s.sku}-${i}`}
                className="flex items-center justify-between gap-3 rounded-md border border-border-soft bg-surface-2/40 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-caption font-semibold text-fg">
                    {s.producto}
                  </p>
                  <p className="font-mono text-[0.6rem] text-faint">
                    {s.sku}
                    {s.sucursal ? ` · ${s.sucursal}` : ""} · {s.dias_quiebre}{" "}
                    {s.dias_quiebre === 1 ? "día" : "días"} sin stock
                  </p>
                </div>
                <p className="font-mono text-caption tabular-nums font-bold text-danger whitespace-nowrap">
                  −{money(s.perdida_estimada_pen)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
