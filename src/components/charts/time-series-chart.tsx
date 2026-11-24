"use client";

import type { ComponentProps } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import type {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import {
  AXIS_PROPS,
  CHART_COLORS,
  ChartTooltip,
  GRID_PROPS,
  useMounted,
} from "./common";

/** Estado que Recharts pasa a onClick del chart (solo lo que usamos). */
interface ChartClickState {
  activePayload?: { payload?: unknown }[];
  activeLabel?: unknown;
  activeTooltipIndex?: unknown;
}

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

  const resolveItem = (state: ChartClickState | null | undefined): T | null => {
    if (!state) return null;
    if (state.activePayload && state.activePayload.length > 0 && state.activePayload[0].payload) {
      return state.activePayload[0].payload as T;
    }
    if (state.activeLabel !== undefined && state.activeLabel !== null) {
      const found = data.find((item) => String((item as Record<string, unknown>)[xKey]) === String(state.activeLabel));
      if (found) return found as T;
    }
    if (typeof state.activeTooltipIndex === "number" && data[state.activeTooltipIndex]) {
      return data[state.activeTooltipIndex] as T;
    }
    return null;
  };

  const handleChartClick = (state: ChartClickState | null | undefined) => {
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
          content={(props: TooltipContentProps<ValueType, NameType>) => {
            const item = props.payload && props.payload.length > 0 ? ((props.payload[0] as { payload?: unknown }).payload as T) : null;
            return (
              <ChartTooltip
                active={props.active}
                payload={props.payload as unknown as ComponentProps<typeof ChartTooltip>["payload"]}
                label={props.label as string | number | undefined}
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
                onClick: (_: unknown, event: unknown) => {
                  const payload = (event as { payload?: unknown } | null)?.payload;
                  if (payload && onClick) {
                    onClick(payload as T);
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
