"use client";

import { useRouter } from "next/navigation";
import { CalendarClock } from "lucide-react";
import { LoadingState, ErrorState } from "@/components/ui/states";
import {
  CoberturaBanner,
  EstacionalesInfo,
} from "@/features/bi/shared";
import { ResumenList } from "@/features/diagnostico/components/ResumenList";
import { usePlan } from "../hooks/usePlan";
import { ProyeccionMesCard } from "./ProyeccionMesCard";
import { SugerenciaMetaSection } from "./SugerenciaMetaSection";
import { PacingSemanalCard } from "./PacingSemanalCard";
import { CalendarioTimeline } from "./CalendarioTimeline";
import { PresupuestoCard } from "./PresupuestoCard";

/**
 * Vista 4 — Plan del Mes: "¿Llegaré a la meta y cómo planifico el próximo?".
 */
export function PlanMesView() {
  const router = useRouter();
  const { q, meses, setMeses, saveGoal } = usePlan();

  if (q.isError) return <ErrorState error={q.error} />;
  if (q.isLoading || !q.data)
    return <LoadingState label="Planificando el mes…" />;

  const p = q.data;

  const handleSave = (_nivel: string, monto: number) => {
    // El plan del /plan endpoint no incluye por_sucursal para el mes objetivo;
    // usamos office_scope para armar la meta con distribución equitativa.
    // La última sucursal absorbe el resto del redondeo para que la suma dé
    // exactamente el monto elegido.
    const offices: Record<string, number> = {};
    const scope = p.meta.office_scope;
    if (scope.length > 0) {
      const equal = Math.round(monto / scope.length);
      let asignado = 0;
      scope.forEach((id, i) => {
        const parte = i === scope.length - 1 ? monto - asignado : equal;
        offices[String(id)] = parte;
        asignado += parte;
      });
    }
    saveGoal.mutate({
      month: p.sugerencia_proximo_mes.mes_objetivo,
      totalMeta: p.meta.office_scope.length === 0 ? monto : null,
      offices,
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <CoberturaBanner
        cobertura={p.meta.cobertura_costos}
        onAudit={() => router.push("/configuracion?tab=costos")}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-primary" aria-hidden="true" />
          <h1 className="text-h2 font-bold text-fg">Plan del Mes</h1>
          <span className="text-caption text-faint">· {p.meta.fecha}</span>
        </div>
        <EstacionalesInfo exclusiones={p.meta.exclusiones} />
      </div>

      <ProyeccionMesCard mes={p.mes_en_curso} />

      <SugerenciaMetaSection
        sug={p.sugerencia_proximo_mes}
        onSave={handleSave}
        saving={saveGoal.isPending}
      />

      <PacingSemanalCard pacing={p.pacing_semanal} />

      <CalendarioTimeline
        meses={p.calendario_campanas}
        currentSelection={meses}
        onChangeSelection={setMeses}
      />

      <PresupuestoCard presupuesto={p.presupuesto_compra} />

      <ResumenList resumen={p.resumen} />
    </div>
  );
}
