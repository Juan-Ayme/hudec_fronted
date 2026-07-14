"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { num } from "@/lib/format";

export type TabBadgeTone = "primary" | "danger" | "neutral";

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: LucideIcon;
  /** Contador a la derecha del label (se omite si es null/undefined). */
  badge?: number | string | null;
  badgeTone?: TabBadgeTone;
  disabled?: boolean;
  /** Tooltip (title) del botón — ej. "Selecciona una sucursal". */
  hint?: string;
}

const BADGE_TONE: Record<TabBadgeTone, string> = {
  primary: "bg-primary/15 text-primary",
  danger: "bg-danger/15 text-danger",
  neutral: "bg-surface-3 text-muted",
};

/**
 * Tabs — segmented control controlado (sin slots de contenido: el padre
 * decide qué panel renderizar). Estilo pill como el de /configuracion.
 */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (tab: T) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-xl border border-border/40 bg-surface-2 p-1",
        "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']",
        className,
      )}
    >
      {items.map((it) => {
        const active = value === it.id;
        const Icon = it.icon;
        return (
          <button
            key={it.id}
            role="tab"
            aria-selected={active}
            disabled={it.disabled}
            title={it.hint}
            onClick={() => {
              if (!it.disabled) onChange(it.id);
            }}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold",
              "transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]",
              active ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg",
              it.disabled && "cursor-not-allowed opacity-50",
            )}
          >
            {Icon && (
              <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-faint")} />
            )}
            <span className="whitespace-nowrap">{it.label}</span>
            {it.badge != null && it.badge !== 0 && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[0.65rem] font-bold tabular-nums",
                  BADGE_TONE[it.badgeTone ?? "neutral"],
                )}
              >
                {typeof it.badge === "number" ? num(it.badge) : it.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
