"use client";

import React, { useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from "recharts";
import { useMounted, AXIS_PROPS, GRID_PROPS, ChartTooltip } from "@/components/charts/common";
import { money, pct, num } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MatrixResponse } from "../hooks/useRentabilidad";

interface MarginScatterMatrixProps {
  data?: MatrixResponse;
  loading?: boolean;
}

const COLORS: Record<string, string> = {
  estrella: "#10b981", // Emerald
  joya_oculta: "#8b5cf6", // Violet
  trampa_volumen: "#f59e0b", // Amber
  debil: "#ef4444", // Rose
};

const LABELS: Record<string, string> = {
  estrella: "Estrella ⭐",
  joya_oculta: "Joya Oculta 💎",
  trampa_volumen: "Trampa de Volumen ⚠️",
  debil: "Débil 🔴",
};

export function MarginScatterMatrix({ data, loading = false }: MarginScatterMatrixProps) {
  const mounted = useMounted();

  const formattedData = useMemo(() => {
    if (!data?.items) return [];
    return data.items.map(item => ({
      ...item,
      // Calculate radius based on raw volume but keep it reasonable
      r: Math.max(4, Math.min(24, Math.sqrt(item.unidades || 0) * 1.5))
    }));
  }, [data]);

  if (!mounted) return null;

  return (
    <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-2xl p-5 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)] flex flex-col h-[500px] overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      
      <div className="mb-4">
        <h3 className="text-lg font-medium text-white">Matriz de Rentabilidad</h3>
        <p className="text-sm text-white/50">Mapeo de volumen vs margen porcentual</p>
      </div>

      {loading || !data ? (
        <div className="flex-1 flex flex-col gap-4 animate-pulse">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-6 w-24 bg-white/5 rounded-full" />
            ))}
          </div>
          <div className="flex-1 bg-white/5 rounded-lg border border-white/5" />
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Summary Badges */}
          <div className="flex flex-wrap gap-2 mb-6">
            {Object.entries(COLORS).map(([key, color]) => {
              const count = data.conteo?.[key] || 0;
              return (
                <div 
                  key={key}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-white/10"
                  style={{ backgroundColor: `${color}15`, color: color }}
                >
                  <span>{LABELS[key]}</span>
                  <span className="bg-black/20 px-1.5 py-0.5 rounded-full text-[10px]">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex-1 relative">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid {...GRID_PROPS} />
                <XAxis 
                  type="number" 
                  dataKey="volumen" 
                  name="Volumen" 
                  tickFormatter={(val) => num(val)}
                  {...AXIS_PROPS}
                  label={{ value: "Volumen (Unidades)", position: "bottom", fill: "rgba(255,255,255,0.4)", fontSize: 12 }}
                />
                <YAxis 
                  type="number" 
                  dataKey="margen_pct" 
                  name="Margen %" 
                  tickFormatter={(val) => pct(val)}
                  {...AXIS_PROPS}
                  label={{ value: "Margen %", angle: -90, position: "left", fill: "rgba(255,255,255,0.4)", fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.1)" }}
                  content={(props) => (
                    <ChartTooltip
                      {...props}
                      payload={props.payload as any}
                      formatter={(val, name) => {
                        if (name === "Margen %" || name === "margen_pct") return pct(val as number);
                        if (name === "Volumen" || name === "volumen") return num(val as number);
                        return String(val);
                      }}
                    />
                  )}
                />
                
                {/* Quadrant Backgrounds */}
                <ReferenceLine y={data.meta.mediana_margen} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3">
                  <span className="text-white/30 text-[10px] ml-2">Mediana Margen ({pct(data.meta.mediana_margen)})</span>
                </ReferenceLine>
                <ReferenceLine x={data.meta.mediana_volumen} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3">
                  <span className="text-white/30 text-[10px] mt-2 block">Mediana Vol ({num(data.meta.mediana_volumen)})</span>
                </ReferenceLine>

                <Scatter data={formattedData}>
                  {formattedData.map((entry, index) => {
                    const color = COLORS[entry.clasificacion] || "#8884d8";
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={color} 
                        fillOpacity={0.6}
                        stroke={color}
                        strokeWidth={1.5}
                        style={{ filter: `drop-shadow(0 0 8px ${color}60)` }}
                      />
                    );
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>

            {/* Quadrant Corner Labels */}
            <div className="absolute top-2 right-2 text-xs font-semibold" style={{ color: COLORS.estrella }}>
              ESTRELLA
            </div>
            <div className="absolute top-2 left-8 text-xs font-semibold" style={{ color: COLORS.joya_oculta }}>
              JOYA OCULTA
            </div>
            <div className="absolute bottom-6 right-2 text-xs font-semibold" style={{ color: COLORS.trampa_volumen }}>
              TRAMPA DE VOLUMEN
            </div>
            <div className="absolute bottom-6 left-8 text-xs font-semibold" style={{ color: COLORS.debil }}>
              DÉBIL
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
