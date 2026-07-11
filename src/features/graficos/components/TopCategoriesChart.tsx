"use client";

import dynamic from "next/dynamic";
import type { UseQueryResult } from "@tanstack/react-query";
import { Layers } from "lucide-react";
import { money, moneyCompact } from "@/lib/format";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/states";
import { BarChartLoader } from "@/components/ui/chart-loaders";
import type { SalesByCategory } from "@/lib/types";

const CategoryBarChart = dynamic(() => import("@/components/charts/category-bar-chart").then(mod => mod.CategoryBarChart), { ssr: false });

/** Top categorías por volumen de ventas. */
export function TopCategoriesChart({
  query: byCategory,
}: {
  query: UseQueryResult<SalesByCategory[], Error>;
}) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader
        title={<span className="flex items-center gap-2"><Layers className="h-5 w-5 text-violet-500" /> Top Categorías</span>}
        subtitle="Las categorías con mayor volumen de ventas"
      />
      <CardBody className="flex-1 pt-0 pb-6 min-h-[400px]">
        {byCategory.isLoading ? <BarChartLoader /> : byCategory.isError ? <ErrorState error={byCategory.error} /> : (
          <CategoryBarChart
            data={(byCategory.data ?? []).sort((a, b) => b.ventas - a.ventas).slice(0, 15)}
            categoryKey="categoria"
            valueKey="ventas"
            valueLabel="Ventas"
            colorful
            xTickFormatter={(v) => moneyCompact(v)}
            valueFormatter={(v) => money(v)}
            height={400}
          />
        )}
      </CardBody>
    </Card>
  );
}
