import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { BadgeTone } from "./badge";

const glowColors: Record<BadgeTone, string> = {
  neutral: "rgba(148,163,184,0.35)",
  primary: "rgba(59,130,246,0.35)",
  success: "rgba(16,185,129,0.35)",
  warning: "rgba(245,158,11,0.35)",
  danger: "rgba(239,68,68,0.35)",
  info: "rgba(14,165,233,0.35)",
  violet: "rgba(139,92,246,0.35)",
};

/**
 * KpiStat — Frosted-glass data card (iOS / macOS style).
 */
export function KpiStat({
  label,
  value,
  sub,
  icon: Icon,
  tone = "primary",
  loading,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: LucideIcon;
  tone?: BadgeTone;
  loading?: boolean;
}) {
  const themeColor = `var(--color-${tone === "neutral" ? "muted" : tone})`;

  return (
    <div
      className={cn(
        /* Glassmorphism shell */
        "group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-2xl",
        "shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]",
        "animate-[fade-in-up_var(--duration-base)_var(--ease-premium)_both]",
        "transition-all duration-500 hover:-translate-y-1 hover:bg-white/[0.07]",
        "hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)]",
      )}
    >
      {/* Glow orb (color diffusion) */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-30 blur-3xl transition-all duration-700 group-hover:opacity-50 group-hover:scale-125"
        style={{ backgroundColor: themeColor }}
      />

      {/* Subtle dot texture */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Top edge highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative z-10 p-5 flex flex-col justify-between gap-4">
        <div className="flex items-start justify-between gap-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/50 mt-1">
            {label}
          </p>
          
          {/* Glass icon pill */}
          {Icon && (
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                "border border-white/[0.08] bg-white/[0.06] backdrop-blur-md",
                "transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3",
              )}
              style={{ boxShadow: `0 8px 24px -6px ${glowColors[tone] || glowColors.primary}` }}
            >
              <Icon 
                className="h-5 w-5 drop-shadow-lg transition-colors" 
                style={{ color: themeColor }} 
                strokeWidth={2}
              />
            </div>
          )}
        </div>

        <div>
          {loading ? (
            <div className="mt-1 h-8 w-32 animate-pulse rounded-md bg-white/5" />
          ) : (
            <p
              className={cn(
                "text-2xl font-bold tracking-tight",
                "bg-gradient-to-br from-white via-slate-100 to-slate-400 bg-clip-text text-transparent drop-shadow-sm",
              )}
            >
              {value}
            </p>
          )}
          
          <div className="mt-1.5 min-h-[20px]">
            {loading ? (
              <div className="h-4 w-24 animate-pulse rounded bg-white/5" />
            ) : sub ? (
              <p className="text-xs font-medium text-white/40 flex items-center gap-1.5">
                {sub}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
