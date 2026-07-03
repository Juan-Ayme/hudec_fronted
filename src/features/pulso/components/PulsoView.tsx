"use client";

import { useRouter } from "next/navigation";
import { Activity, Bell } from "lucide-react";
import { LoadingState, ErrorState } from "@/components/ui/states";
import {
  AlertaList,
  CoberturaBanner,
  EstacionalesInfo,
  OnboardingChecklist,
  VeredictoCard,
} from "@/features/bi/shared";
import { usePulse } from "../hooks/usePulse";
import { HeaderMes } from "./HeaderMes";
import { UltimoDiaCard } from "./UltimoDiaCard";
import { SemanaMiniChart } from "./SemanaMiniChart";
import { Ultimos7DiasCard } from "./Ultimos7DiasCard";

/**
 * Vista 1 — Pulso: "¿Cómo voy hoy?".
 * Layout:
 *   1. CoberturaBanner (si el margen está distorsionado, mostrar arriba de todo).
 *   2. HeaderMes: venta acumulada + gauge + link a /plan-mes.
 *   3. VeredictoCard: lectura del momento (color según código).
 *   4. UltimoDiaCard + SemanaMiniChart en grid.
 *   5. Ultimos7DiasCard: 4 comparativas.
 *   6. AlertaList: chips priorizadas.
 */
export function PulsoView() {
  const router = useRouter();
  const { q } = usePulse();

  if (q.isError) return <ErrorState error={q.error} />;
  if (q.isLoading || !q.data) return <LoadingState label="Cargando pulso…" />;

  const p = q.data;

  return (
    <div className="flex flex-col gap-5">
      <OnboardingChecklist />

      <CoberturaBanner
        cobertura={p.meta.cobertura_costos}
        onAudit={() => router.push("/configuracion?tab=costos")}
      />

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" aria-hidden="true" />
          <h1 className="text-h2 font-bold text-fg">Pulso</h1>
          <span className="text-caption text-faint">
            · datos al cierre de {p.meta.ultimo_dia_cerrado}
          </span>
        </div>
        <EstacionalesInfo exclusiones={p.meta.exclusiones} />
      </div>

      <HeaderMes mes={p.mes_en_curso} />

      <VeredictoCard veredicto={p.veredicto} />

      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <UltimoDiaCard dia={p.ultimo_dia_cerrado} />
        <SemanaMiniChart semana={p.semana_en_curso} />
      </div>

      <Ultimos7DiasCard resumen={p.ultimos_7_dias} />

      <div>
        <div className="mb-3 flex items-center gap-2">
          <Bell className="h-5 w-5 text-warning" aria-hidden="true" />
          <h2 className="text-h3 font-semibold text-fg">Alertas del momento</h2>
          {p.alertas.length > 0 && (
            <span className="rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-caption font-bold text-warning">
              {p.alertas.length}
            </span>
          )}
        </div>
        <AlertaList
          alertas={p.alertas}
          onAction={() => router.push("/diagnostico")}
        />
      </div>
    </div>
  );
}
