"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileSpreadsheet, TrendingUp, History } from "lucide-react";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import { useCompany } from "@/components/company-context";
import { ReporteVentasView } from "@/features/reporte-ventas/ReporteVentasView";
import { RentabilidadView } from "@/features/rentabilidad/RentabilidadView";
import { RotacionHistoricaView } from "@/features/rotacion-historica/components/RotacionHistoricaView";

type VentasTab = "ventas" | "rentabilidad" | "rotacion";

function VentasRentabilidadContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeRole } = useCompany();
  const isViewer = activeRole === "viewer" || activeRole === null;

  const items: TabItem<VentasTab>[] = isViewer
    ? [{ id: "ventas", label: "Reporte de Ventas", icon: FileSpreadsheet }]
    : [
        { id: "ventas", label: "Reporte de Ventas", icon: FileSpreadsheet },
        { id: "rentabilidad", label: "Rentabilidad y Márgenes", icon: TrendingUp },
        { id: "rotacion", label: "Rotación Histórica (ABC)", icon: History },
      ];

  const rawTab = searchParams.get("tab");
  const tab: VentasTab =
    items.some((i) => i.id === rawTab) ? (rawTab as VentasTab) : "ventas";

  const changeTab = (next: VentasTab) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", next);
    router.replace(`/reporte-ventas?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-5">
      {items.length > 1 && (
        <Tabs items={items} value={tab} onChange={changeTab} />
      )}
      {tab === "ventas" && <ReporteVentasView />}
      {tab === "rentabilidad" && <RentabilidadView />}
      {tab === "rotacion" && <RotacionHistoricaView />}
    </div>
  );
}

export default function ReporteVentasPage() {
  return (
    <Suspense fallback={null}>
      <VentasRentabilidadContent />
    </Suspense>
  );
}
