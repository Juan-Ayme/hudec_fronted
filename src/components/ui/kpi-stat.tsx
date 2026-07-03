import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { BadgeTone } from "./badge";

const bgTones: Record<BadgeTone, string> = {
  neutral: "from-surface-2/20 to-transparent",
  primary: "from-primary/10 to-transparent",
  success: "from-success/10 to-transparent",
  warning: "from-warning/10 to-transparent",
  danger: "from-danger/10 to-transparent",
  info: "from-info/10 to-transparent",
  violet: "from-violet/10 to-transparent",
};

/**
 * KpiStat — Premium Data Card
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
        "group relative overflow-hidden rounded-xl border border-border-soft bg-surface shadow-card",
        "animate-[fade-in-up_var(--duration-base)_var(--ease-premium)_both]",
        "transition-all duration-500 hover:-translate-y-1 hover:shadow-card-hover",
      )}
    >
      {/* 1. Dynamic Background Gradient */}
      <div 
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-60 transition-opacity duration-500 group-hover:opacity-100",
          bgTones[tone] || "from-surface-2/20 to-transparent"
        )} 
      />

      {/* 2. Premium Texture (Subtle Dot Pattern) */}
      <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* 3. Outer Glow Orb (Top Right) */}
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-20 blur-3xl transition-all duration-700 group-hover:opacity-40 group-hover:scale-125"
        style={{ backgroundColor: themeColor }}
      />

      {/* 4. Top Border Highlight (Glassmorphism inset) */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50" />

      <div className="relative z-10 p-5 flex flex-col justify-between gap-4">
        <div className="flex items-start justify-between gap-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted drop-shadow-sm mt-1">
            {label}
          </p>
          
          {/* Glass Icon Container */}
          {Icon && (
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 backdrop-blur-md",
                "transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3 shadow-lg"
              )}
              style={{ boxShadow: `0 8px 32px -8px ${themeColor}` }}
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
            <div className="mt-1 h-8 w-32 animate-pulse rounded-md bg-surface-3/50" />
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
              <div className="h-4 w-24 animate-pulse rounded bg-surface-3/30" />
            ) : sub ? (
              <p className="text-xs font-medium text-slate-400/90 flex items-center gap-1.5">
                {sub}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
