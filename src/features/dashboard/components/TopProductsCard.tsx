"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import { money, num } from "@/lib/format";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { TableLoader } from "@/components/ui/chart-loaders";
import type { TopProduct } from "@/lib/types";

// Enhance Top Products Table to look more like a Leaderboard
const topCols: Column<TopProduct>[] = [
  {
    key: "producto",
    header: "Producto",
    render: (r, idx) => {
      const isGold = idx === 0;
      const isSilver = idx === 1;
      const isBronze = idx === 2;
      const badgeClasses = isGold
        ? "bg-yellow-500/20 text-yellow-500 ring-yellow-500/30"
        : isSilver
        ? "bg-slate-300/20 text-slate-300 ring-slate-300/30"
        : isBronze
        ? "bg-amber-600/20 text-amber-500 ring-amber-600/30"
        : "bg-surface-3 text-muted ring-border-soft";

      return (
        <div className="flex items-center gap-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ring-1 ${badgeClasses}`}>
             {idx + 1}
          </div>
          <span className="line-clamp-1 font-semibold text-fg">{r.producto}</span>
        </div>
      );
    },
  },
  {
    key: "unidades",
    header: "Unds",
    align: "right",
    render: (r) => (
      <span className="inline-flex items-center justify-center rounded-md bg-surface-3 px-2 py-1 text-xs font-medium text-muted">
        {num(r.unidades)}
      </span>
    ),
  },
  {
    key: "ventas",
    header: "Ingresos",
    align: "right",
    render: (r) => (
      <span className="font-bold text-success drop-shadow-sm">{money(r.ventas)}</span>
    ),
  },
];

/** Top rendimiento de productos (leaderboard). */
export function TopProductsCard({
  days,
  query: top,
}: {
  days: number;
  query: UseQueryResult<TopProduct[], Error>;
}) {
  return (
    <Card className="h-full">
      <CardHeader
        title={<span className="flex items-center gap-2"><Trophy className="h-5 w-5 text-yellow-500" /> Top Rendimiento de Productos</span>}
        subtitle={`Los artículos con mayor impacto (${days} días)`}
      />
      <CardBody className="pt-0 pb-2 px-2 sm:px-4 min-h-[200px]">
        {top.isLoading ? (
          <TableLoader />
        ) : (
          <DataTable
            columns={topCols}
            rows={top.data}
            isLoading={top.isLoading}
            error={top.error}
            rowKey={(r) => r.bsale_product_id}
            emptyTitle="Sin ventas en el período"
          />
        )}
      </CardBody>
    </Card>
  );
}
