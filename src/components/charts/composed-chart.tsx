"use client";

import {
  ResponsiveContainer,
  ComposedChart as RechartsComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Line,
  Cell,
} from "recharts";
import {
  useMounted,
  CHART_COLORS,
  AXIS_PROPS,
  GRID_PROPS,
  ChartTooltip,
} from "./common";

interface Props<T> {
  data: T[];
  xKey: keyof T;
  barKey: keyof T;
  lineKey: keyof T;
  barLabel?: string;
  lineLabel?: string;
  xTickFormatter?: (val: unknown) => string;
  barFormatter?: (val: unknown) => string;
  lineFormatter?: (val: unknown) => string;
  height?: number | string;
}

export function ComposedChart<T>({
  data,
  xKey,
  barKey,
  lineKey,
  barLabel = "Barras",
  lineLabel = "Línea",
  xTickFormatter,
  barFormatter,
  lineFormatter,
  height = 300,
}: Props<T>) {
  const mounted = useMounted();
  if (!mounted) return <div style={{ height }} className="w-full bg-surface-2 animate-pulse rounded-xl" />;

  return (
    <div style={{ height, width: "100%" }}>
      <ResponsiveContainer>
        <RechartsComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis
            dataKey={xKey as string}
            tickFormatter={xTickFormatter}
            {...AXIS_PROPS}
            dy={8}
            minTickGap={20}
          />
          <YAxis
            yAxisId="left"
            tickFormatter={barFormatter}
            {...AXIS_PROPS}
            dx={-8}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tickFormatter={lineFormatter}
            {...AXIS_PROPS}
            dx={8}
          />
          <Tooltip
            content={
              <ChartTooltip
                formatter={(val, name) => {
                  if (name === barLabel && barFormatter) return barFormatter(val);
                  if (name === lineLabel && lineFormatter) return lineFormatter(val);
                  return String(val);
                }}
              />
            }
            cursor={{ fill: "#ffffff0a" }}
          />
          
          <Bar
            yAxisId="left"
            dataKey={barKey as string}
            name={barLabel}
            fill="url(#colorBarra)"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          >
            {data.map((_, i) => (
              <Cell key={`cell-${i}`} fill="url(#colorBarra)" />
            ))}
          </Bar>
          <Line
            yAxisId="right"
            type="monotone"
            dataKey={lineKey as string}
            name={lineLabel}
            stroke={CHART_COLORS[3]} // Indigo
            strokeWidth={3}
            dot={{ r: 3, fill: CHART_COLORS[3], strokeWidth: 0 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />

          <defs>
            <linearGradient id="colorBarra" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.9} />
              <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0.2} />
            </linearGradient>
          </defs>
        </RechartsComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
