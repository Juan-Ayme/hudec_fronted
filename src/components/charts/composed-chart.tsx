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
  xKey: string;
  barKey: string;
  lineKey: string;
  barLabel?: string;
  lineLabel?: string;
  xTickFormatter?: (val: unknown) => string;
  barFormatter?: (val: unknown) => string;
  lineFormatter?: (val: unknown) => string;
  height?: number | string;
  onClick?: (entry: T) => void;
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
  onClick,
}: Props<T>) {
  const mounted = useMounted();
  if (!mounted) return <div style={{ height }} className="w-full bg-surface-2 animate-pulse rounded-xl" />;

  const resolveItem = (state: any): T | null => {
    if (!state) return null;
    if (state.activePayload && state.activePayload.length > 0 && state.activePayload[0].payload) {
      return state.activePayload[0].payload as T;
    }
    if (state.activeLabel !== undefined && state.activeLabel !== null) {
      const found = data.find((item: any) => String(item[xKey]) === String(state.activeLabel));
      if (found) return found as T;
    }
    if (typeof state.activeTooltipIndex === "number" && data[state.activeTooltipIndex]) {
      return data[state.activeTooltipIndex] as T;
    }
    return null;
  };

  const handleChartClick = (state: any) => {
    if (!onClick) return;
    const item = resolveItem(state);
    if (item) {
      onClick(item);
    }
  };

  return (
    <div style={{ height, width: "100%" }} className={onClick ? "cursor-pointer select-none" : ""}>
      <ResponsiveContainer>
        <RechartsComposedChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          onClick={handleChartClick}
        >
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
            content={(props: any) => {
              const item = props.payload && props.payload.length > 0 ? (props.payload[0].payload as T) : null;
              return (
                <ChartTooltip
                  {...props}
                  formatter={(val, name) => {
                    if (name === barLabel && barFormatter) return barFormatter(val);
                    if (name === lineLabel && lineFormatter) return lineFormatter(val);
                    return String(val);
                  }}
                  onClick={onClick && item ? () => onClick(item) : undefined}
                />
              );
            }}
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
