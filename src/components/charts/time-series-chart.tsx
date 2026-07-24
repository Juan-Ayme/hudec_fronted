"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AXIS_PROPS,
  CHART_COLORS,
  ChartTooltip,
  GRID_PROPS,
  useMounted,
} from "./common";

export interface SeriesDef {
  key: string;
  label: string;
  color?: string;
}

export function TimeSeriesChart<T>({
  data,
  xKey,
  series,
  height = 280,
  xTickFormatter,
  yTickFormatter,
  valueFormatter,
  onClick,
}: {
  data: T[];
  xKey: string;
  series: SeriesDef[];
  height?: number | `${number}%`;
  xTickFormatter?: (v: unknown) => string;
  yTickFormatter?: (v: unknown) => string;
  valueFormatter?: (v: number | string, name: string) => string;
  onClick?: (entry: T) => void;
}) {
  const mounted = useMounted();

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

  if (!mounted) return <div style={{ height }} />;

  return (
    <div style={{ height, width: "100%" }} className={onClick ? "cursor-pointer select-none" : ""}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 8, right: 12, left: 4, bottom: 0 }}
          onClick={handleChartClick}
        >
        <defs>
          {series.map((s, i) => {
            const color = s.color ?? CHART_COLORS[i % CHART_COLORS.length];
            return (
              <linearGradient
                key={s.key}
                id={`grad-${s.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={color} stopOpacity={0.8} />
                <stop offset="80%" stopColor={color} stopOpacity={0.15} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            );
          })}
        </defs>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis
          dataKey={xKey}
          {...AXIS_PROPS}
          tickFormatter={xTickFormatter as (v: string) => string}
          minTickGap={24}
        />
        <YAxis {...AXIS_PROPS} width={64} tickFormatter={yTickFormatter as (v: string) => string} />
        <Tooltip
          content={(props: any) => {
            const item = props.payload && props.payload.length > 0 ? (props.payload[0].payload as T) : null;
            return (
              <ChartTooltip
                {...props}
                formatter={valueFormatter}
                onClick={onClick && item ? () => onClick(item) : undefined}
              />
            );
          }}
          cursor={{ stroke: "#233044" }}
        />
        {series.map((s, i) => {
          const color = s.color ?? CHART_COLORS[i % CHART_COLORS.length];
          return (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={color}
              strokeWidth={3}
              fill={`url(#grad-${s.key})`}
              dot={false}
              activeDot={{
                r: 7,
                strokeWidth: 3,
                stroke: "var(--color-bg)",
                fill: color,
                onClick: (_: any, event: any) => {
                  if (event && event.payload && onClick) {
                    onClick(event.payload as T);
                  }
                },
              }}
            />
          );
        })}
      </AreaChart>
    </ResponsiveContainer>
  </div>
  );
}
