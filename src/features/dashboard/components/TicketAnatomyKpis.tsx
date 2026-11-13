"use client";

import { BarChart4, Target, Activity, ArrowUpRight, ArrowDownRight, Layers } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import type { TicketAnatomy } from "@/lib/types";

/** Anatomía del Ticket: variación % vs período espejo anterior. */
export function TicketAnatomyKpis({
  anat,
  loading,
}: {
  anat: TicketAnatomy["delta_pct"] | undefined;
  loading: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
      {[
        { label: "Δ Ventas (vs período ant.)", value: anat?.ventas, icon: Target },
        { label: "Δ Tráfico (Tickets)", value: anat?.tickets, icon: Activity },
        { label: "Δ Canasta (Unds/Ticket)", value: anat?.unds_per_ticket, icon: Layers },
        { label: "Δ Precio (Monto/Und)", value: anat?.monto_per_und, icon: BarChart4 },
      ].map((kpi, i) => {
        const hasVal = kpi.value != null && Number.isFinite(kpi.value);
        const val = hasVal ? (kpi.value as number) : 0;
        const isPos = val >= 0;
        const Icon = isPos ? ArrowUpRight : ArrowDownRight;
        return (
          <Card key={i} className="relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-100 transition-opacity">
              <kpi.icon className="h-5 w-5" />
            </div>
            <CardBody className="p-4">
              <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
                {kpi.label}
              </p>
              {loading ? (
                <div className="h-8 bg-surface-3 animate-pulse rounded w-1/2" />
              ) : !hasVal ? (
                <span className="text-2xl font-bold text-faint">—</span>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-fg tabular-nums">
                    {isPos ? "+" : ""}
                    {val.toFixed(1)}%
                  </span>
                  <Icon className={`h-4 w-4 ${isPos ? "text-success" : "text-danger"}`} />
                </div>
              )}
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}

