"use client";

import dynamic from "next/dynamic";
import type { UseQueryResult } from "@tanstack/react-query";
import { PieChart } from "lucide-react";
import { money } from "@/lib/format";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/states";
import { DonutChartLoader } from "@/components/ui/chart-loaders";
import type { StockValuation } from "@/lib/types";

const DonutChart = dynamic(() => import("@/components/charts/donut-chart").then(mod => mod.DonutChart), { ssr: false });

/** Distribución de capital (valorización de stock por sucursal). */
export function CapitalDistributionCard({
  query: valuation,
}: {
  query: UseQueryResult<StockValuation, Error>;
}) {
  return (
    <Card className="h-full flex flex-col group overflow-hidden relative">
      <CardHeader
        title={<span className="flex items-center gap-2"><PieChart className="h-5 w-5 text-warning" /> Distribución de Capital</span>}
        subtitle={valuation.data ? `Total: ${money(valuation.data.total_soles)}` : "—"}
      />
      <CardBody className="flex-1 flex items-center justify-center relative z-10">
        {valuation.isLoading ? (
          <DonutChartLoader />
        ) : valuation.isError ? (
          <ErrorState error={valuation.error} />
        ) : (
          <DonutChart
            data={(valuation.data?.por_sucursal ?? []).map((o) => ({
              name: o.sucursal,
              value: Math.round(o.valor_soles),
            }))}
            valueFormatter={(v) => money(v)}
            height={220}
          />
        )}
      </CardBody>
    </Card>
  );
}
