"use client";

import { useState } from "react";
import { DateRangeSelect } from "@/components/ui/date-range-select";
import { useGraficos } from "../hooks/useGraficos";
import { GraficosSkeleton } from "./GraficosSkeleton";
import { TicketAnatomyKpis } from "./TicketAnatomyKpis";
import { SalesEvolutionChart } from "./SalesEvolutionChart";
import { TopCategoriesChart } from "./TopCategoriesChart";
import { DayDrillDownPanel } from "./DayDrillDownPanel";

export function GraficosView() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const {
    days,
    setDays,
    byDay,
    byCategory,
    ticketAnatomy,
    anat,
    isAnyLoading,
  } = useGraficos();

  if (isAnyLoading) {
    return <GraficosSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-soft pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg">Analítica Visual & Gráficos Avanzados</h1>
          <p className="text-sm text-muted">
            Explora la evolución y haz clic en cualquier fecha o pico para descubrir los productos vendidos y quiebres de stock.
          </p>
        </div>
        <div className="shrink-0 relative z-40">
           <DateRangeSelect value={days} onChange={setDays} />
        </div>
      </div>

      {/* Anatomía del Ticket (KPI Cards) */}
      <TicketAnatomyKpis anat={anat} loading={ticketAnatomy.isLoading} />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">

        {/* ROW 1: Evolución de ventas (interactivo) */}
        <div className="md:col-span-12">
          <SalesEvolutionChart
            query={byDay}
            onSelectDay={(day) => setSelectedDate(day.dia)}
            selectedDate={selectedDate}
          />
        </div>

        {/* PANEL INTERACTIVO DE INSPECCIÓN DIARIA */}
        {selectedDate && (
          <div className="md:col-span-12 scroll-mt-20">
            <DayDrillDownPanel
              date={selectedDate}
              onClose={() => setSelectedDate(null)}
              onNavigateDate={(newDate) => setSelectedDate(newDate)}
            />
          </div>
        )}

        {/* ROW 2: Top Categorías */}
        <div className="md:col-span-12">
          <TopCategoriesChart query={byCategory} />
        </div>

      </div>
    </div>
  );
}
