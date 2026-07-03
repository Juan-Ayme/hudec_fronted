"use client";

import { useRouter } from "next/navigation";
import { LineChart } from "lucide-react";
import { LoadingState, ErrorState } from "@/components/ui/states";
import {
  CoberturaBanner,
  EstacionalesInfo,
  VeredictoCard,
} from "@/features/bi/shared";
import { useDiagnosis } from "../hooks/useDiagnosis";
import { VentanaSelector } from "./VentanaSelector";
import { MetaAlertasInfo } from "./MetaAlertasInfo";
import { KpisSection } from "./KpisSection";
import { AnatomiaSection } from "./AnatomiaSection";
import { DescomposicionTabs } from "./DescomposicionTabs";
import { FactoresSection } from "./FactoresSection";
import { WinnersLosersTabs } from "./WinnersLosersTabs";
import { HuecosYoyList } from "./HuecosYoyList";
import { ResumenList } from "./ResumenList";

/**
 * Vista 2 — Diagnóstico: "¿Por qué vendo menos hoy?".
 * Layout: banner cobertura → controles + veredicto → KPIs + comparativas →
 * anatomía → descomposición → factores → ganadores/perdedores → huecos YoY
 * → resumen.
 */
export function DiagnosticoView() {
  const router = useRouter();
  const { q, days, setDays, topN, setTopN } = useDiagnosis();

  if (q.isError) return <ErrorState error={q.error} />;
  if (q.isLoading || !q.data)
    return <LoadingState label="Diagnosticando el período…" />;

  const d = q.data;

  return (
    <div className="flex flex-col gap-5">
      <CoberturaBanner
        cobertura={d.meta.cobertura_costos}
        onAudit={() => router.push("/configuracion?tab=costos")}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <LineChart className="h-5 w-5 text-info" aria-hidden="true" />
          <h1 className="text-h2 font-bold text-fg">Diagnóstico</h1>
          <span className="text-caption text-faint">
            · {d.meta.current.from} → {d.meta.current.to}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <VentanaSelector
            days={days}
            onDaysChange={setDays}
            topN={topN}
            onTopNChange={setTopN}
          />
          <EstacionalesInfo exclusiones={d.meta.exclusiones} />
        </div>
      </div>

      <MetaAlertasInfo alertas={d.meta.alertas} />

      <VeredictoCard veredicto={d.veredicto} />

      <KpisSection kpis={d.kpis} />

      <AnatomiaSection anatomia={d.anatomia} />

      <DescomposicionTabs descomposicion={d.descomposicion} />

      <FactoresSection factores={d.factores_adicionales} />

      <WinnersLosersTabs ganadores={d.ganadores_y_perdedores} />

      <HuecosYoyList huecos={d.huecos_yoy} />

      <ResumenList resumen={d.resumen} />
    </div>
  );
}
