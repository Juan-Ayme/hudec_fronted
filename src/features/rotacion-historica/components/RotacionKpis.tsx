"use client";

import { Award, BarChart3, Package, Wallet } from "lucide-react";
import { money, num } from "@/lib/format";
import { KpiStat } from "@/components/ui/kpi-stat";
import type { RotacionHistoricaResponse } from "@/lib/types";

export function RotacionKpis({
  data,
  loading,
}: {
  data: RotacionHistoricaResponse | undefined;
  loading: boolean;
}) {
  return (
    <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <KpiStat
        label="SKUs con venta"
        value={num(data?.kpis.skus_con_venta)}
        icon={Package}
        tone="primary"
        loading={loading}
        sub={
          data
            ? `${num(data.kpis.skus_pareto_a)} en Pareto A · ${num(data.kpis.skus_pareto_b)} en B · ${num(data.kpis.skus_pareto_c)} en C`
            : null
        }
      />
      <KpiStat
        label="Venta total"
        value={money(data?.kpis.venta_soles)}
        icon={Wallet}
        tone="success"
        loading={loading}
        sub="Monto facturado en la ventana"
      />
      <KpiStat
        label="Unidades vendidas"
        value={num(data?.kpis.unds_vendidas)}
        icon={BarChart3}
        tone="info"
        loading={loading}
        sub="Total de unidades (neto de devoluciones)"
      />
      <KpiStat
        label="Top Pareto A"
        value={num(data?.kpis.skus_pareto_a)}
        icon={Award}
        tone="warning"
        loading={loading}
        sub="SKUs que generan el 80% del ingreso"
      />
    </section>
  );
}
