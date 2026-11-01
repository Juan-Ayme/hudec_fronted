"use client";

import { KpiStat } from "@/components/ui/kpi-stat";
import { money, pct } from "@/lib/format";
import { Coins, Percent, Trophy, AlertTriangle, DollarSign } from "lucide-react";

interface Department {
  name: string;
  margen_pct: number;
  margen_bruto: number;
  pct_contribucion_margen: number;
  unidades_vendidas: number;
  margen_por_unidad: number;
  venta_neta: number;
}

interface MarginKpiRowProps {
  global: {
    margen_bruto: number;
    venta_neta: number;
    margen_pct: number;
  };
  departments: Department[];
  loading?: boolean;
}

export function MarginKpiRow({ global, departments, loading }: MarginKpiRowProps) {
  const sortedByMargin = [...departments].sort((a, b) => b.margen_pct - a.margen_pct);
  const highest = sortedByMargin[0];
  const lowest = sortedByMargin[sortedByMargin.length - 1];

  let avgMargenPorUnidad = 0;
  let totalUnits = 0;
  let totalMargen = 0;
  if (departments && departments.length > 0) {
    departments.forEach(d => {
      totalUnits += d.unidades_vendidas || 0;
      totalMargen += d.margen_bruto || 0;
    });
    if (totalUnits > 0) {
      avgMargenPorUnidad = totalMargen / totalUnits;
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      <KpiStat
        label="Margen Total"
        value={money(global.margen_bruto)}
        sub={`Venta neta: ${money(global.venta_neta)}`}
        icon={Coins}
        tone="success"
        loading={loading}
      />
      <KpiStat
        label="Margen %"
        value={pct(global.margen_pct)}
        sub="Promedio ponderado"
        icon={Percent}
        tone="info"
        loading={loading}
      />
      <KpiStat
        label="Margen por Unidad"
        value={money(avgMargenPorUnidad)}
        sub="Promedio ponderado"
        icon={DollarSign}
        tone="primary"
        loading={loading}
      />
      <KpiStat
        label="Más Rentable"
        value={highest ? highest.name : "-"}
        sub={highest ? `Margen: ${pct(highest.margen_pct)} • Contribuye: ${pct(highest.pct_contribucion_margen)}` : "Sin datos"}
        icon={Trophy}
        tone="success"
        loading={loading}
      />
      <KpiStat
        label="Menos Rentable"
        value={lowest ? lowest.name : "-"}
        sub={lowest ? `Margen: ${pct(lowest.margen_pct)}` : "Sin datos"}
        icon={AlertTriangle}
        tone="danger"
        loading={loading}
      />
    </div>
  );
}
