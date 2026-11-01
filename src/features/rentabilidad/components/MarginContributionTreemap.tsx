"use client";

import React from "react";
import { Treemap, ResponsiveContainer } from "recharts";
import { useMounted } from "@/components/charts/common";
import { pct, money } from "@/lib/format";

interface ContributionItem {
  name: string;
  margen_bruto: number;
  margen_pct: number;
  pct_contribucion_margen: number;
}

interface MarginContributionTreemapProps {
  data: ContributionItem[];
  loading?: boolean;
}

// Map margin percentage to a color gradient scale (red to yellow to green)
const getTreemapColor = (marginPct: number) => {
  if (marginPct >= 0.45) return "#059669"; // Emerald 600
  if (marginPct >= 0.35) return "#10b981"; // Emerald 500
  if (marginPct >= 0.25) return "#34d399"; // Emerald 400
  if (marginPct >= 0.15) return "#f59e0b"; // Amber 500
  if (marginPct >= 0.05) return "#fbbf24"; // Amber 400
  if (marginPct >= 0) return "#f87171";    // Red 400
  return "#dc2626";                       // Red 600
};

const CustomizedContent = (props: any) => {
  const { x, y, width, height, name, depth, margen_pct, pct_contribucion_margen, margen_bruto } = props;

  // Root node or missing data
  if (depth === 1 || margen_pct === undefined) {
    return null;
  }

  const bgColor = getTreemapColor(margen_pct);
  const isSmall = width < 80 || height < 50;
  const isTiny = width < 40 || height < 20;

  if (isTiny) {
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: bgColor,
            stroke: "rgba(255,255,255,0.1)",
            strokeWidth: 1,
            opacity: 0.9,
          }}
          rx={4}
          ry={4}
        />
      </g>
    );
  }

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: bgColor,
          stroke: "rgba(255,255,255,0.1)",
          strokeWidth: 2,
          opacity: 0.85,
          filter: "drop-shadow(inset 0 0 10px rgba(0,0,0,0.2))"
        }}
        rx={6}
        ry={6}
      />
      
      {!isSmall ? (
        <foreignObject x={x} y={y} width={width} height={height}>
          <div className="flex flex-col items-center justify-center w-full h-full p-2 text-center text-white overflow-hidden pointer-events-none drop-shadow-md">
            <span className="font-bold text-sm truncate w-full px-1">{name}</span>
            <span className="text-xs text-white/90 font-medium">Contrib: {pct(pct_contribucion_margen)}</span>
            <div className="mt-1 bg-black/30 rounded px-1.5 py-0.5 text-[10px] font-semibold border border-white/10">
              Mg: {pct(margen_pct)}
            </div>
          </div>
        </foreignObject>
      ) : (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          fill="#fff"
          fontSize={11}
          fontWeight="bold"
          dominantBaseline="central"
          className="pointer-events-none drop-shadow-md"
        >
          {name?.substring(0, 8)}
          {name?.length > 8 ? "..." : ""}
        </text>
      )}
    </g>
  );
};

export function MarginContributionTreemap({ data, loading = false }: MarginContributionTreemapProps) {
  const mounted = useMounted();

  if (!mounted) return null;

  // Treemap expects data wrapped in an array if it's multiple roots, or a single root with children
  const treeData = [{ name: "Root", children: data }];

  return (
    <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-2xl p-5 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)] flex flex-col h-[500px] overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      
      <div className="mb-4">
        <h3 className="text-lg font-medium text-white">Contribución al Margen Total</h3>
        <p className="text-sm text-white/50">Área = Volumen de contribución | Color = Margen porcentual</p>
      </div>

      {loading ? (
        <div className="flex-1 animate-pulse bg-white/5 rounded-xl border border-white/10" />
      ) : (
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex-1 min-h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={treeData as any}
                dataKey="pct_contribucion_margen"
                aspectRatio={4 / 3}
                stroke="#fff"
                content={<CustomizedContent />}
                isAnimationActive={false}
              />
            </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="h-10 mt-auto flex items-center justify-center gap-3 text-xs text-white/70">
            <span>Menor Margen</span>
            <div className="w-48 h-3 rounded-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 border border-white/20" />
            <span>Mayor Margen</span>
          </div>
        </div>
      )}
    </div>
  );
}
