"use client";

import { useRouter } from "next/navigation";
import { Activity, Bell } from "lucide-react";
import { LoadingState, ErrorState } from "@/components/ui/states";
import { useCompany } from "@/components/company-context";
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
 */
export function PulsoView() {
  const router = useRouter();
  const { activeRole } = useCompany();
  const isViewer = activeRole === "viewer" || activeRole === null;
  const { q } = usePulse();

  if (q.isError) return <ErrorState error={q.error} />;
  if (q.isLoading || !q.data) return <LoadingState label="Cargando pulso…" />;

  const p = q.data;

  return (
    <div className="flex flex-col gap-5">
      {!isViewer && <OnboardingChecklist />}

      <CoberturaBanner
        cobertura={p.meta.cobertura_costos}
        onAudit={isViewer ? undefined : () => router.push("/configuracion?tab=costos")}
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

      <HeaderMes mes={p.mes_en_curso} showPlanLink={!isViewer} />

      <VeredictoCard veredicto={p.veredicto} />

      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <UltimoDiaCard dia={p.ultimo_dia_cerrado} />
        <SemanaMiniChart semana={p.semana_en_curso} />
      </div>

      <Ultimos7DiasCard resumen={p.ultimos_7_dias} />

      <div>
        <div className="mb-1 flex items-center gap-2">
          <Bell className="h-5 w-5 text-warning" aria-hidden="true" />
          <h2 className="text-h3 font-semibold text-fg">Alertas del momento</h2>
          {p.alertas.length > 0 && (
            <span className="rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-caption font-bold text-warning">
              {p.alertas.length}
            </span>
          )}
        </div>
        <p className="mb-3 text-caption text-muted">
          Problemas y oportunidades detectados hoy, ordenados por urgencia. El
          monto es el impacto estimado en soles.
        </p>
        <AlertaList
          alertas={p.alertas}
          onAction={isViewer ? undefined : () => router.push("/pulso?tab=diagnostico")}
        />
      </div>
    </div>
  );
}
