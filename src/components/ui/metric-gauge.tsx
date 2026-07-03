"use client";

import { cn } from "@/lib/utils";

/* ── Shared types & helpers ─────────────────────────────────── */

type Tone = "auto" | "primary" | "success" | "warning" | "danger";

interface Thresholds {
  danger: number;
  warning: number;
}

/** Resolve auto-tone based on value vs thresholds. */
function resolveTone(
  value: number,
  tone: Tone,
  thresholds?: Thresholds,
): Exclude<Tone, "auto"> {
  if (tone !== "auto") return tone;
  if (!thresholds) return "primary";
  if (value < thresholds.danger) return "danger";
  if (value < thresholds.warning) return "warning";
  return "success";
}

/** Map resolved tone → CSS custom-property color string. */
const toneColor: Record<Exclude<Tone, "auto">, string> = {
  primary: "var(--color-primary)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  danger: "var(--color-danger)",
};

/** Tailwind text class by tone. */
const toneText: Record<Exclude<Tone, "auto">, string> = {
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

/** Tailwind bg (track fill) by tone. */
const toneBg: Record<Exclude<Tone, "auto">, string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

const toneBgDim: Record<Exclude<Tone, "auto">, string> = {
  primary: "bg-primary/15",
  success: "bg-success/15",
  warning: "bg-warning/15",
  danger: "bg-danger/15",
};

/* ══════════════════════════════════════════════════════════════
   MetricBar — horizontal progress bar with label + value
   ══════════════════════════════════════════════════════════════ */

interface MetricBarProps {
  label: string;
  value: number;
  max?: number;
  suffix?: string;
  tone?: Tone;
  thresholds?: Thresholds;
  size?: "sm" | "md";
}

export function MetricBar({
  label,
  value,
  max = 100,
  suffix = "",
  tone = "auto",
  thresholds,
  size = "md",
}: MetricBarProps) {
  const resolved = resolveTone(value, tone, thresholds);
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className="group">
      {/* Label row */}
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span
          className={cn(
            "font-medium text-muted",
            size === "sm" ? "text-caption" : "text-body",
          )}
        >
          {label}
        </span>
        <span
          className={cn(
            "font-mono tabular-nums font-semibold",
            toneText[resolved],
            size === "sm" ? "text-caption" : "text-body",
          )}
        >
          {Number.isInteger(value) ? value : value.toFixed(1)}
          {suffix}
        </span>
      </div>

      {/* Track */}
      <div
        className={cn(
          "w-full overflow-hidden rounded-pill",
          toneBgDim[resolved],
          size === "sm" ? "h-1" : "h-1.5",
        )}
      >
        <div
          className={cn(
            "h-full rounded-pill transition-all duration-500 ease-[var(--ease-premium)]",
            toneBg[resolved],
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MetricGauge — SVG semi-circular gauge for hero metrics
   ══════════════════════════════════════════════════════════════ */

interface MetricGaugeProps {
  value: number;
  max: number;
  label: string;
  suffix?: string;
  tone?: Tone;
  thresholds?: Thresholds;
  size?: number;
}

export function MetricGauge({
  value,
  max,
  label,
  suffix = "",
  tone = "auto",
  thresholds,
  size = 120,
}: MetricGaugeProps) {
  const resolved = resolveTone(value, tone, thresholds);
  const ratio = Math.min(Math.max(value / max, 0), 1);

  // SVG geometry — semi-circle (180°) opening upward
  const strokeWidth = size * 0.08;
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2 + radius * 0.1; // shift center slightly down

  // Arc from 180° (left) to 0° (right), i.e. the bottom half inverted
  const startAngle = Math.PI; // left
  const endAngle = 0; // right
  const totalArc = Math.PI; // 180°

  // Background arc (full semi-circle)
  const bgStartX = cx + radius * Math.cos(startAngle);
  const bgStartY = cy - radius * Math.sin(startAngle);
  const bgEndX = cx + radius * Math.cos(endAngle);
  const bgEndY = cy - radius * Math.sin(endAngle);
  const bgPath = `M ${bgStartX},${bgStartY} A ${radius},${radius} 0 0,1 ${bgEndX},${bgEndY}`;

  // Fill arc — from startAngle to (startAngle - ratio * totalArc)
  const fillAngle = startAngle - ratio * totalArc;
  const fillEndX = cx + radius * Math.cos(fillAngle);
  const fillEndY = cy - radius * Math.sin(fillAngle);
  const largeArc = 0; // Arc is at most 180° (Math.PI), so large-arc-flag is always 0
  const fillPath =
    ratio > 0
      ? `M ${bgStartX},${bgStartY} A ${radius},${radius} 0 ${largeArc},1 ${fillEndX},${fillEndY}`
      : "";

  // Circumference for stroke-dasharray animation
  const circumference = Math.PI * radius;
  const fillLength = ratio * circumference;

  const color = toneColor[resolved];

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <svg
        width={size}
        height={size * 0.6}
        viewBox={`0 0 ${size} ${cy + strokeWidth / 2}`}
        className="overflow-visible"
      >
        {/* Glow filter */}
        <defs>
          <filter id={`glow-${resolved}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background track */}
        <path
          d={bgPath}
          fill="none"
          stroke="var(--color-surface-3)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Filled arc */}
        {fillPath && (
          <path
            d={fillPath}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${fillLength} ${circumference}`}
            strokeDashoffset="0"
            className="transition-all duration-700 ease-[var(--ease-premium)]"
            filter={`url(#glow-${resolved})`}
          />
        )}

        {/* Tip dot */}
        {ratio > 0 && (
          <circle
            cx={fillEndX}
            cy={fillEndY}
            r={strokeWidth * 0.4}
            fill={color}
            className="drop-shadow-sm"
          />
        )}
      </svg>

      {/* Value */}
      <p
        className={cn(
          "mt-0.5 font-mono tabular-nums font-bold",
          toneText[resolved],
          size >= 120 ? "text-h2" : "text-body",
        )}
      >
        {Number.isInteger(value) ? value : value.toFixed(1)}
        {suffix && (
          <span className="ml-0.5 text-caption font-medium text-muted">
            {suffix}
          </span>
        )}
      </p>

      {/* Label */}
      <p className="mt-0.5 text-center text-caption font-medium text-faint">
        {label}
      </p>
    </div>
  );
}
