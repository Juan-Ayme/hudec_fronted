"use client";

import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
  LabelList
} from "recharts";
import { useMounted, AXIS_PROPS, GRID_PROPS, ChartTooltip } from "@/components/charts/common";
import { money, pct, num } from "@/lib/format";
import { cn } from "@/lib/utils";

interface RankingItem {
  name: string;
  margen_pct: number;
  margen_bruto: number;
  venta_neta: number;
  unidades_vendidas: number;
}

interface ProfitabilityRankingProps {
  data: RankingItem[];
  title?: string;
  subtitle?: string;
  loading?: boolean;
}

// Helper to determine gradient color based on margin %
const getMarginColor = (margin: number) => {
  if (margin >= 0.4) return ["#10b981", "#34d399"]; // Emerald
  if (margin >= 0.2) return ["#f59e0b", "#fbbf24"]; // Amber
  return ["#ef4444", "#f87171"]; // Rose
};

// Custom tick to show rank numbers
const CustomYAxisTick = (props: any) => {
  const { x, y, payload, data } = props;
  const index = data.findIndex((d: RankingItem) => d.name === payload.value);
  const rank = index + 1;
  
  let rankColor = "text-white/40";
  if (rank === 1) rankColor = "text-yellow-400 font-bold";
  else if (rank === 2) rankColor = "text-slate-300 font-bold";
  else if (rank === 3) rankColor = "text-amber-700 font-bold";

  return (
    <g transform={`translate(${x},${y})`}>
      <foreignObject x={-140} y={-12} width={130} height={24}>
        <div className="flex items-center justify-end h-full gap-2 overflow-hidden">
          <span className={cn("text-[10px] w-4 text-center shrink-0", rankColor)}>
            {rank}
          </span>
          <span className="text-xs text-white/70 truncate text-right">
            {payload.value}
          </span>
        </div>
      </foreignObject>
    </g>
  );
};

export function ProfitabilityRanking({
  data,
  title = "Ranking de Rentabilidad",
  subtitle = "Márgenes por categoría/producto",
  loading = false,
}: ProfitabilityRankingProps) {
  const mounted = useMounted();

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => b.margen_pct - a.margen_pct);
  }, [data]);

  if (!mounted) return null;

  return (
    <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-2xl p-5 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)] flex flex-col h-full overflow-hidden">
      {/* Top highlight */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-white">{title}</h3>
          {subtitle && (
            <p className="text-sm text-white/50">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-[300px] -ml-4">
        {loading ? (
          <div className="h-full flex flex-col justify-between py-4 animate-pulse ml-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-4 w-24 bg-white/5 rounded" />
                <div className="h-6 flex-1 bg-white/5 rounded-r-full" />
              </div>
            ))}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sortedData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <defs>
                {sortedData.map((entry, index) => {
                  const colors = getMarginColor(entry.margen_pct);
                  return (
                    <linearGradient
                      key={`grad-${index}`}
                      id={`gradient-${index}`}
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
                      <stop offset="0%" stopColor={colors[0]} stopOpacity={0.8} />
                      <stop offset="100%" stopColor={colors[1]} stopOpacity={1} />
                    </linearGradient>
                  );
                })}
              </defs>
              <CartesianGrid {...GRID_PROPS} horizontal={true} vertical={false} />
              <XAxis 
                type="number" 
                tickFormatter={(val) => pct(val)}
                {...AXIS_PROPS}
              />
              <YAxis
                type="category"
                {...AXIS_PROPS}
                dataKey="name"
                width={120}
                tick={<CustomYAxisTick data={sortedData} />}
              />
              <Tooltip
                content={(props) => (
                  <ChartTooltip
                    {...props}
                    payload={props.payload as any}
                    formatter={(val, name) => {
                      if (name === "margen_pct") return pct(val as number);
                      if (name === "margen_bruto") return money(val as number);
                      return String(val);
                    }}
                  />
                )}
                cursor={{ fill: "rgba(255,255,255,0.02)" }}
              />
              <Bar 
                dataKey="margen_pct" 
                radius={[0, 4, 4, 0]}
                barSize={20}
              >
                {sortedData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={`url(#gradient-${index})`} 
                  />
                ))}
                <LabelList 
                  dataKey="margen_pct" 
                  position="right"
                  formatter={(val: any) => pct(val as number)}
                  style={{ fill: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 500 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
