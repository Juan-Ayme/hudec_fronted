"use client";

import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROOT_SELECTION, type Selection } from "@/lib/types";

/** Migas de pan de la selección jerárquica (lift del local de ComprasView). */
export function Breadcrumb({
  selection,
  onNavigate,
}: {
  selection: Selection;
  onNavigate: (s: Selection) => void;
}) {
  const crumbs: { label: string; target: Selection; icon?: typeof Home }[] = [
    { label: "Todos", target: ROOT_SELECTION, icon: Home },
  ];
  if (selection.dept) {
    crumbs.push({
      label: selection.dept,
      target: { dept: selection.dept, cat: null, subcat: null },
    });
  }
  if (selection.cat) {
    crumbs.push({
      label: selection.cat,
      target: { dept: selection.dept, cat: selection.cat, subcat: null },
    });
  }
  if (selection.subcat) {
    crumbs.push({
      label: selection.subcat,
      target: { ...selection },
    });
  }

  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 rounded-lg border border-border-soft bg-surface-2/50 px-3 py-2 text-xs">
      {crumbs.map((c, i) => {
        const isLast = i === crumbs.length - 1;
        const Icon = c.icon;
        return (
          <span key={i} className="flex items-center gap-1">
            <button
              onClick={() => onNavigate(c.target)}
              disabled={isLast}
              className={cn(
                "flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors",
                isLast
                  ? "font-semibold text-fg cursor-default"
                  : "text-muted hover:bg-surface-3 hover:text-fg",
              )}
            >
              {Icon && <Icon className="h-3 w-3" />}
              <span className="truncate max-w-[180px]">{c.label}</span>
            </button>
            {!isLast && <ChevronRight className="h-3 w-3 text-faint" aria-hidden />}
          </span>
        );
      })}
    </nav>
  );
}
