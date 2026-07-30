"use client";

import dynamic from "next/dynamic";
import type { UseQueryResult } from "@tanstack/react-query";
import { TrendingUp } from "lucide-react";
import { money, moneyCompact, dayLabel } from "@/lib/format";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/states";
import { LineChartLoader } from "@/components/ui/chart-loaders";
import { InteractiveHint } from "@/components/ui/interactive-hint";
import type { SalesByDay } from "@/lib/types";

// Dynamic import for Recharts to avoid SSR issues
const ComposedChart = dynamic(() => import("@/components/charts/composed-chart").then(mod => mod.ComposedChart), { ssr: false });

/** Evolución de ventas vs ticket promedio. */
export function SalesEvolutionChart({
  query: byDay,
  onSelectDay,
  selectedDate,
}: {
  query: UseQueryResult<SalesByDay[], Error>;
  onSelectDay?: (day: SalesByDay) => void;
  selectedDate?: string | null;
}) {
  return (
    <Card className="h-full flex flex-col overflow-hidden relative">
      <div className="pointer-events-none absolute top-0 left-0 h-full w-full bg-gradient-to-b from-primary/5 to-transparent opacity-50" />
      <CardHeader
        title={
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Evolución de Ventas vs Ticket Promedio
            </span>
            {onSelectDay && (
              <InteractiveHint text="Haz clic en cualquier pico o barra para ver el detalle de productos" />
            )}
          </div>
        }
        subtitle="Analiza la correlación entre el volumen ingresado y el valor promedio de compra"
      />
      <CardBody className="flex-1 relative z-10 pt-0 pb-6 min-h-[350px]">
        {byDay.isLoading ? <LineChartLoader /> : byDay.isError ? <ErrorState error={byDay.error} /> : (
          <ComposedChart
            data={byDay.data ?? []}
            xKey="dia"
            barKey="ventas"
            lineKey="ticket_promedio"
            barLabel="Ventas Totales"
            lineLabel="Ticket Promedio"
            xTickFormatter={dayLabel}
            barFormatter={(v) => moneyCompact(v)}
            lineFormatter={(v) => money(v)}
            height="100%"
            onClick={(entry) => onSelectDay?.(entry as SalesByDay)}
          />
        )}
      </CardBody>
    </Card>
  );
}
