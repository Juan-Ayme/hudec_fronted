"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Activity, Gauge, ShieldCheck, CalendarClock } from "lucide-react";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import { useCompany } from "@/components/company-context";
import { PulsoView } from "@/features/pulso/components/PulsoView";
import { DiagnosticoView } from "@/features/diagnostico/components/DiagnosticoView";
import { SaludCatalogoView } from "@/features/salud-catalogo/components/SaludCatalogoView";
import { PlanMesView } from "@/features/plan-mes/components/PlanMesView";

type BiTab = "pulso" | "diagnostico" | "salud" | "plan";

function InteligenciaBiContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeRole } = useCompany();
  const isViewer = activeRole === "viewer" || activeRole === null;

  const items: TabItem<BiTab>[] = isViewer
    ? [{ id: "pulso", label: "Pulso Operativo", icon: Activity }]
    : [
        { id: "pulso", label: "Pulso Operativo", icon: Activity },
        { id: "diagnostico", label: "Diagnóstico", icon: Gauge },
        { id: "salud", label: "Salud del Catálogo (80/20)", icon: ShieldCheck },
        { id: "plan", label: "Plan del Mes", icon: CalendarClock },
      ];

  const rawTab = searchParams.get("tab");
  const tab: BiTab =
    items.some((i) => i.id === rawTab) ? (rawTab as BiTab) : "pulso";

  const changeTab = (next: BiTab) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", next);
    router.replace(`/pulso?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-5">
      {items.length > 1 && (
        <Tabs items={items} value={tab} onChange={changeTab} />
      )}
      {tab === "pulso" && <PulsoView />}
      {tab === "diagnostico" && <DiagnosticoView />}
      {tab === "salud" && <SaludCatalogoView />}
      {tab === "plan" && <PlanMesView />}
    </div>
  );
}

export default function PulsoPage() {
  return (
    <Suspense fallback={null}>
      <InteligenciaBiContent />
    </Suspense>
  );
}
