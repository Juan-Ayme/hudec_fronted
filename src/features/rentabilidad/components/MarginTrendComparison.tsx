"use client";

import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { useMounted, AXIS_PROPS, GRID_PROPS, ChartTooltip, CHART_COLORS } from "@/components/charts/common";
import { pct } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface EvolucionRow {
  periodo: string;
  dim: string;
  ventas: number;
  venta_neta?: number;
  unidades: number;
  tickets: number;
  ticket_promedio: number;
  margen_soles: number;
  margen_pct: number | null;
  participacion_pct: number;
  crecimiento_mom_pct: number | null;
  crecimiento_yoy_pct: number | null;
  skus_activos: number;
  cobertura_costos_pct: number | null;
  parcial: boolean;
}

interface MarginTrendComparisonProps {
  data: EvolucionRow[] | undefined;
  loading?: boolean;
}

export function MarginTrendComparison({ data, loading = false }: MarginTrendComparisonProps) {
  const mounted = useMounted();

  const { processedData, topDims } = useMemo(() => {
    if (!data?.length) return { processedData: [], topDims: [] };

    const ventasByDim = data.reduce((acc, curr) => {
      const sales = curr.venta_neta ?? curr.ventas;
      acc[curr.dim] = (acc[curr.dim] || 0) + sales;
      return acc;
    }, {} as Record<string, number>);

    const top5 = Object.entries(ventasByDim)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);

    // Group by periodo
    const byPeriod = data.reduce((acc, curr) => {
      if (!top5.includes(curr.dim)) return acc;
      
      const periodKey = curr.parcial ? `${curr.periodo}*` : curr.periodo;
      if (!acc[periodKey]) {
        acc[periodKey] = { periodo: periodKey, isParcial: curr.parcial };
      }
      
      acc[periodKey][curr.dim] = curr.margen_pct;
      return acc;
    }, {} as Record<string, any>);

    return {
      processedData: Object.values(byPeriod).sort((a, b) => a.periodo.localeCompare(b.periodo)),
      topDims: top5
    };
  }, [data]);

  if (!mounted) return null;

  return (
    <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-2xl p-5 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)] flex flex-col h-[450px] overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
      
      <div className="mb-6 relative z-10">
        <h3 className="text-lg font-medium text-white">Evolución de Márgenes (%)</h3>
        <p className="text-sm text-white/50">Top 5 por volumen de ventas</p>
      </div>

      {loading ? (
        <div className="flex-1 animate-pulse bg-white/5 rounded-xl border border-white/10" />
      ) : (
        <div className="flex-1 relative z-10 -ml-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={processedData}
              margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
            >
              <defs>
                {topDims.map((dim, i) => (
                  <linearGradient key={`grad-${dim}`} id={`color-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0}/>
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid {...GRID_PROPS} />
              <XAxis 
                dataKey="periodo" 
                {...AXIS_PROPS}
                tickFormatter={(val) => val.replace('*', '')}
              />
              <YAxis 
                tickFormatter={(val) => pct(val, 0)}
                {...AXIS_PROPS}
              />
              <Tooltip
                content={(props) => (
                  <ChartTooltip
                    {...props}
                    payload={props.payload as any}
                    formatter={(val) => pct(val as number)}
                  />
                )}
                cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                content={(props) => {
                  const { payload } = props;
                  return (
                    <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs text-white/70">
                      {payload?.map((entry, index) => (
                        <div key={`item-${index}`} className="flex items-center gap-1.5">
                          <span 
                            className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)]" 
                            style={{ backgroundColor: entry.color }}
                          />
                          <span>{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
              {topDims.map((dim, i) => (
                <Area
                  key={dim}
                  type="monotone"
                  dataKey={dim}
                  name={dim}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill={`url(#color-${i})`}
                  activeDot={{ 
                    r: 6, 
                    fill: CHART_COLORS[i % CHART_COLORS.length],
                    stroke: "#fff",
                    strokeWidth: 2,
                    className: "animate-pulse"
                  }}
                  connectNulls
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
