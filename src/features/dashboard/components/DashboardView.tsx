"use client";

import { Coins, Package, Receipt, Wallet } from "lucide-react";
import { money, num } from "@/lib/format";
import { DateRangeSelect } from "@/components/ui/date-range-select";
import { KpiStat } from "@/components/ui/kpi-stat";
import { ErrorState } from "@/components/ui/states";
import { useDashboard } from "../hooks/useDashboard";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { RevenueTrendCard } from "./RevenueTrendCard";
import { DepartmentPerformanceCard } from "./DepartmentPerformanceCard";
import { CapitalDistributionCard } from "./CapitalDistributionCard";
import { TopProductsCard } from "./TopProductsCard";
import { OfficePerformanceCard } from "./OfficePerformanceCard";

export function DashboardView() {
  const {
    days,
    setDays,
    kpis,
    byDay,
    byDept,
    byOffice,
    valuation,
    top,
    isAnyLoading,
  } = useDashboard();

  const k = kpis.data;

  if (isAnyLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 relative overflow-hidden">
      {/* ── macOS-style ambient background orbs ── */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-primary/[0.07] blur-[120px] animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute top-1/3 -right-20 h-[400px] w-[400px] rounded-full bg-accent/[0.06] blur-[120px] animate-[pulse_10s_ease-in-out_infinite_1s]" />
        <div className="absolute bottom-0 left-10 h-[350px] w-[350px] rounded-full bg-violet/[0.05] blur-[120px] animate-[pulse_12s_ease-in-out_infinite_2s]" />
        <div className="absolute top-2/3 left-1/2 h-[300px] w-[300px] rounded-full bg-success/[0.04] blur-[120px] animate-[pulse_9s_ease-in-out_infinite_3s]" />
      </div>

      <div className="flex justify-end mb-2 relative z-30">
        <div className="shrink-0">
           <DateRangeSelect value={days} onChange={setDays} />
        </div>
      </div>

      {kpis.isError && <ErrorState error={kpis.error} className="mt-4" />}

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-12 md:grid-rows-auto relative z-10">

        {/* ROW 1: KPIs & Gauge */}
        <div className="md:col-span-3 flex flex-col gap-3">
          <KpiStat
            label={`Ingresos Brutos (${days}d)`}
            value={money(k?.ventas)}
            icon={Wallet}
            tone="success"
            loading={kpis.isLoading}
            sub={`${num(k?.tickets)} tickets en ${k?.sucursales || 0} sucursales`}
          />
          <KpiStat
            label="Stock Valorizado"
            value={money(k?.stock_valorizado)}
            icon={Coins}
            tone="warning"
            loading={kpis.isLoading}
            sub={`${num(k?.productos_total)} productos (costo efectivo)`}
          />
          <KpiStat
            label="Ticket Promedio"
            value={money(k?.ticket_promedio)}
            icon={Receipt}
            tone="info"
            loading={kpis.isLoading}
            sub={`${num(k?.tickets_con_monto)} ventas con monto`}
          />
        </div>

        {/* Time Series Hero */}
        <div className="md:col-span-9">
          <RevenueTrendCard days={days} query={byDay} />
        </div>


        {/* ROW 2: Departments & Donut */}
        <div className="md:col-span-7">
          <DepartmentPerformanceCard days={days} query={byDept} />
        </div>

        <div className="md:col-span-5">
          <CapitalDistributionCard query={valuation} />
        </div>

        {/* ROW 3: Top Products & Office Bars */}
        <div className="md:col-span-7">
          <TopProductsCard days={days} query={top} />
        </div>

        <div className="md:col-span-5 flex flex-col gap-5">
           {/* Add a KPI for products here to fill the gap and keep Bento layout tight */}
           <KpiStat
             label="Catálogo Activo"
             value={num(k?.productos_total)}
             icon={Package}
             tone="info"
             loading={kpis.isLoading}
             sub={`${num(k?.productos_mapeados)} items mapeados (taxonomía)`}
           />
           <OfficePerformanceCard days={days} query={byOffice} />
        </div>

      </div>
    </div>
  );
}
