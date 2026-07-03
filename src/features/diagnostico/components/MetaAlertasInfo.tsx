"use client";

import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DiagnosisMetaAlerta } from "@/lib/bi-types";

/**
 * Banner "info" con las alertas del meta (feriados desbalanceados vs YoY,
 * ventana muy corta, etc). No es una alerta de negocio — es un metadato
 * para ajustar la lectura del análisis.
 */
export function MetaAlertasInfo({
  alertas,
  className,
}: {
  alertas: DiagnosisMetaAlerta[];
  className?: string;
}) {
  if (alertas.length === 0) return null;
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-lg border border-info/25 bg-info/6 px-3 py-2",
        className,
      )}
    >
      {alertas.map((a, i) => (
        <div key={`${a.tipo}-${i}`} className="flex items-start gap-2">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-info" aria-hidden="true" />
          <p className="text-caption text-fg/85">
            <span className="font-semibold text-info">Nota: </span>
            {a.mensaje}
          </p>
        </div>
      ))}
    </div>
  );
}
