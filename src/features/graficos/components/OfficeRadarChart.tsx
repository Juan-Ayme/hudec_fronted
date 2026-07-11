"use client";

import dynamic from "next/dynamic";
import type { UseQueryResult } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { money } from "@/lib/format";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/states";
import { BarChartLoader } from "@/components/ui/chart-loaders";
import type { SalesByOffice } from "@/lib/types";

const RadarChart = dynamic(() => import("@/components/charts/radar-chart").then(mod => mod.RadarChart), { ssr: false });

/** Rendimiento por sucursal (balance radial). */
export function OfficeRadarChart({
  query: byOffice,
}: {
  query: UseQueryResult<SalesByOffice[], Error>;
}) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader
        title={<span className="flex items-center gap-2"><MapPin className="h-5 w-5 text-warning" /> Rendimiento por Sucursal</span>}
        subtitle="Balance radial de facturación (S/)"
      />
      <CardBody className="flex-1 pt-0 min-h-[300px]">
        {byOffice.isLoading ? <BarChartLoader /> : byOffice.isError ? <ErrorState error={byOffice.error} /> : (
          <RadarChart
            data={byOffice.data ?? []}
            nameKey="sucursal"
            dataKey="ventas"
            valueFormatter={(v) => money(v)}
            height={300}
          />
        )}
      </CardBody>
    </Card>
  );
}
