"use client";

import dynamic from "next/dynamic";
import type { UseQueryResult } from "@tanstack/react-query";
import { PieChart } from "lucide-react";
import { money } from "@/lib/format";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/states";
import { DonutChartLoader } from "@/components/ui/chart-loaders";
import type { SalesByDepartment } from "@/lib/types";

const DonutChart = dynamic(() => import("@/components/charts/donut-chart").then(mod => mod.DonutChart), { ssr: false });

/** Mix de departamentos (participación en facturación). */
export function DepartmentMixChart({
  query: byDept,
}: {
  query: UseQueryResult<SalesByDepartment[], Error>;
}) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader
        title={<span className="flex items-center gap-2"><PieChart className="h-5 w-5 text-accent" /> Mix de Departamentos</span>}
        subtitle="Participación de cada departamento en la facturación total"
      />
      <CardBody className="flex-1 flex items-center justify-center pt-0 min-h-[300px]">
        {byDept.isLoading ? <DonutChartLoader /> : byDept.isError ? <ErrorState error={byDept.error} /> : (
          <DonutChart
            data={(byDept.data ?? []).map((d) => ({
              name: d.departamento,
              value: d.ventas,
            }))}
            valueFormatter={(v) => money(v)}
            height={300}
          />
        )}
      </CardBody>
    </Card>
  );
}
