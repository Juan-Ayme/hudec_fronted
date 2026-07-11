"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { Store } from "lucide-react";
import { moneyCompact, num } from "@/lib/format";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { ErrorState, EmptyState } from "@/components/ui/states";
import { BarChartLoader } from "@/components/ui/chart-loaders";
import type { SalesByOffice } from "@/lib/types";

/** Desempeño operativo de sucursales (barras de facturación comparativa). */
export function OfficePerformanceCard({
  days,
  query: byOffice,
}: {
  days: number;
  query: UseQueryResult<SalesByOffice[], Error>;
}) {
  return (
    <Card className="flex-1 overflow-hidden relative group">
      <CardHeader title={<span className="flex items-center gap-2"><Store className="h-5 w-5 text-primary" /> Desempeño Operativo de Sucursales</span>} subtitle={`Facturación comparativa en ${days} días`} />
      <CardBody className="space-y-4 pt-2 relative z-10">
        {byOffice.isLoading ? (
          <BarChartLoader />
        ) : byOffice.isError ? (
          <ErrorState error={byOffice.error} />
        ) : (byOffice.data ?? []).length === 0 ? (
          <EmptyState icon={Store} />
        ) : (
          (byOffice.data ?? []).map((o) => {
            const max = Math.max(
              ...(byOffice.data ?? []).map((x) => x.ventas),
              1,
            );
            return (
              <div key={o.sucursal} className="group/bar relative">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium tracking-wide text-fg">{o.sucursal}</span>
                  <div className="flex items-center gap-3">
                     <span className="font-mono text-xs text-muted">{num(o.tickets)} trx</span>
                     <span className="font-bold text-fg">
                       {moneyCompact(o.ventas)}
                     </span>
                  </div>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-surface-3 shadow-inner">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent shadow-[0_0_12px_rgba(59,130,246,0.6)] transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
                    style={{ width: `${(o.ventas / max) * 100}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </CardBody>
    </Card>
  );
}
