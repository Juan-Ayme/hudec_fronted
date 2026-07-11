"use client";

import dynamic from "next/dynamic";
import type { UseQueryResult } from "@tanstack/react-query";
import { TrendingUp } from "lucide-react";
import { money, moneyCompact, dayLabel } from "@/lib/format";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { ErrorState, EmptyState } from "@/components/ui/states";
import { LineChartLoader } from "@/components/ui/chart-loaders";
import type { SalesByDay } from "@/lib/types";

const TimeSeriesChart = dynamic(() => import("@/components/charts/time-series-chart").then(mod => mod.TimeSeriesChart), { ssr: false });

/** Time Series Hero — evolución de ingresos. */
export function RevenueTrendCard({
  days,
  query: byDay,
}: {
  days: number;
  query: UseQueryResult<SalesByDay[], Error>;
}) {
  return (
    <Card className="h-full flex flex-col group overflow-hidden relative">
      <CardHeader
        title={<span className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Evolución de Ingresos</span>}
        subtitle={`Flujo de ingresos en los últimos ${days} días`}
      />
      <CardBody className="flex-1 relative z-10 pt-0 pb-6 flex flex-col">
        <div className="flex-1 w-full min-h-[300px]">
          {byDay.isLoading ? (
            <LineChartLoader />
          ) : byDay.isError ? (
            <ErrorState error={byDay.error} />
          ) : byDay.data && byDay.data.length === 0 ? (
            <EmptyState title="Sin ventas en el período" />
          ) : (
            <TimeSeriesChart
              data={byDay.data ?? []}
              xKey="dia"
              series={[{ key: "ventas", label: "Ventas", color: "var(--color-primary)" }]}
              xTickFormatter={dayLabel}
              yTickFormatter={(v) => moneyCompact(v)}
              valueFormatter={(v) => money(v)}
              height="100%"
            />
          )}
        </div>
      </CardBody>
    </Card>
  );
}
