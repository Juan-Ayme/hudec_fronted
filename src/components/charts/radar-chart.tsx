"use client";

import {
  ResponsiveContainer,
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
} from "recharts";
import { useMounted, CHART_COLORS, ChartTooltip } from "./common";

interface Props<T> {
  data: T[];
  nameKey: string;
  dataKey: string;
  valueFormatter?: (val: unknown) => string;
  height?: number | string;
}

export function RadarChart<T>({
  data,
  nameKey,
  dataKey,
  valueFormatter,
  height = 300,
}: Props<T>) {
  const mounted = useMounted();
  if (!mounted) return <div style={{ height }} className="w-full bg-surface-2 animate-pulse rounded-xl" />;

  return (
    <div style={{ height, width: "100%" }}>
      <ResponsiveContainer>
        <RechartsRadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="#ffffff1a" />
          <PolarAngleAxis 
            dataKey={nameKey as string} 
            tick={{ fill: "#8a98ae", fontSize: 11 }}
          />
          <PolarRadiusAxis angle={30} domain={['auto', 'auto']} tick={false} axisLine={false} />
          <Tooltip
            content={
              <ChartTooltip
                formatter={(val) => (valueFormatter ? valueFormatter(val) : String(val))}
              />
            }
            cursor={{ fill: "#ffffff0a" }}
          />
          <Radar
            name="Valor"
            dataKey={dataKey as string}
            stroke={CHART_COLORS[4]}
            fill={CHART_COLORS[4]}
            fillOpacity={0.5}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
