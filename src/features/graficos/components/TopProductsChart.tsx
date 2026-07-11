"use client";

import dynamic from "next/dynamic";
import type { UseQueryResult } from "@tanstack/react-query";
import { Target } from "lucide-react";
import { moneyCompact, num } from "@/lib/format";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/states";
import { BarChartLoader } from "@/components/ui/chart-loaders";
import type { TopProduct } from "@/lib/types";

const ComposedChart = dynamic(() => import("@/components/charts/composed-chart").then(mod => mod.ComposedChart), { ssr: false });

/** Unidades vs Ingresos (Top Productos). */
export function TopProductsChart({
  query: topProducts,
}: {
  query: UseQueryResult<TopProduct[], Error>;
}) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader
        title={<span className="flex items-center gap-2"><Target className="h-5 w-5 text-rose-500" /> Unidades vs Ingresos (Top Productos)</span>}
        subtitle="Desempeño de los productos estrella (Unidades vendidas vs Ingresos generados)"
      />
      <CardBody className="flex-1 pt-0 pb-6 min-h-[400px]">
        {topProducts.isLoading ? <BarChartLoader /> : topProducts.isError ? <ErrorState error={topProducts.error} /> : (
          <ComposedChart
            data={(topProducts.data ?? []).map((p) => ({
              ...p,
              productoCorto: p.producto.length > 20 ? p.producto.substring(0, 20) + "..." : p.producto
            }))}
            xKey="productoCorto"
            barKey="ventas"
            lineKey="unidades"
            barLabel="Ingresos (S/)"
            lineLabel="Unidades"
            xTickFormatter={(v) => String(v)}
            barFormatter={(v) => moneyCompact(Number(v))}
            lineFormatter={(v) => num(Number(v))}
            height={400}
          />
        )}
      </CardBody>
    </Card>
  );
}
