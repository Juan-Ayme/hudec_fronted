"use client";

import dynamic from "next/dynamic";
import type { UseQueryResult } from "@tanstack/react-query";
import { BarChart3 } from "lucide-react";
import { money, moneyCompact } from "@/lib/format";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { ErrorState, EmptyState } from "@/components/ui/states";
import { BarChartLoader } from "@/components/ui/chart-loaders";
import type { SalesByDepartment } from "@/lib/types";

const CategoryBarChart = dynamic(() => import("@/components/charts/category-bar-chart").then(mod => mod.CategoryBarChart), { ssr: false });

/** Rendimiento departamental. */
export function DepartmentPerformanceCard({
  days,
  query: byDept,
}: {
  days: number;
  query: UseQueryResult<SalesByDepartment[], Error>;
}) {
  return (
    <Card className="h-full flex flex-col group relative overflow-hidden">
      <CardHeader
         title={<span className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-accent" /> Rendimiento Departamental</span>}
         subtitle={`Ranking de ventas por departamento en ${days} días`}
      />
      <CardBody className="flex-1 relative z-10">
        {byDept.isLoading ? (
          <BarChartLoader />
        ) : byDept.isError ? (
          <ErrorState error={byDept.error} />
        ) : byDept.data && byDept.data.length === 0 ? (
          <EmptyState />
        ) : (
          <CategoryBarChart
            data={(byDept.data ?? []).slice(0, 6)}
            categoryKey="departamento"
            valueKey="ventas"
            valueLabel="Ventas"
            colorful
            xTickFormatter={(v) => moneyCompact(v)}
            valueFormatter={(v) => money(v)}
            height={260}
          />
        )}
      </CardBody>
    </Card>
  );
}
