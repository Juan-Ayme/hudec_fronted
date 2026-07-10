"use client";

import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/states";
import { num } from "@/lib/format";
import type { RotacionHistoricaClasif } from "@/lib/types";

function shortClasif(clasif: string): string {
  // Elimina la descripción entre paréntesis para mostrar compacto.
  return clasif.split(/[(]/)[0].trim();
}

export function ClasificacionSummary({
  porClasificacion,
  loading,
}: {
  porClasificacion: RotacionHistoricaClasif[] | undefined;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader title="Por clasificación" />
      <CardBody className="pt-3">
        {loading ? (
          <LoadingState label="Cargando…" />
        ) : porClasificacion && porClasificacion.length > 0 ? (
          <ul className="space-y-1.5 text-xs">
            {porClasificacion.map((c) => (
              <li
                key={c.clasificacion}
                className="flex items-start justify-between gap-3 rounded px-2 py-1.5 hover:bg-surface-2"
              >
                <span className="text-muted leading-tight">
                  {shortClasif(c.clasificacion)}
                </span>
                <span className="shrink-0 tabular-nums font-semibold text-primary">
                  {num(c.skus)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-2 text-center text-xs text-faint">Sin datos</p>
        )}
      </CardBody>
    </Card>
  );
}
