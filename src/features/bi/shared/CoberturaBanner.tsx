"use client";

import { pct } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { CoberturaCostos } from "@/lib/bi-types";
import { COBERTURA } from "./constants";

/**
 * Banner condicional que muestra la salud del cálculo de costos.
 * Cuando `estado === "OK"` NO renderiza nada (retorna null).
 * ADVERTENCIA → amarillo. CRITICA → rojo.
 *
 * Este banner debería montarse al tope de las 4 vistas BI: si el margen está
 * distorsionado, cualquier decisión de inversión debe pasar primero por auditar.
 */
export function CoberturaBanner({
  cobertura,
  onAudit,
  className,
}: {
  cobertura: CoberturaCostos;
  /** Callback al botón "Auditar costos" — típicamente `router.push('/configuracion/costos')`. */
  onAudit?: () => void;
  className?: string;
}) {
  if (cobertura.estado === "OK") return null;
  const meta = COBERTURA[cobertura.estado];
  const Icon = meta.icon;
  const isCritica = cobertura.estado === "CRITICA";

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3",
        "animate-[fade-in-up_var(--duration-base)_var(--ease-premium)_both]",
        isCritica
          ? "border-danger/30 bg-danger/8"
          : "border-warning/30 bg-warning/8",
        className,
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 h-5 w-5 shrink-0",
          isCritica ? "text-danger" : "text-warning",
        )}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-body font-semibold",
            isCritica ? "text-danger" : "text-warning",
          )}
        >
          Cobertura de costos {isCritica ? "crítica" : "baja"} ({pct(cobertura.pct_actual)})
        </p>
        {cobertura.warning && (
          <p className="mt-1 text-caption text-muted">{cobertura.warning}</p>
        )}
      </div>
      {onAudit && (
        <Button variant="outline" size="sm" onClick={onAudit} className="shrink-0">
          Auditar costos
        </Button>
      )}
    </div>
  );
}
