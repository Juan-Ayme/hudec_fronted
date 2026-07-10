"use client";

import { useCallback, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { money, num } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DeptNode, TaxFilter } from "../lib";

/** Palette for department dots & bars — cycling through 12 distinct hues. */
const DEPT_COLORS = [
  { dot: "bg-emerald-400", bar: "bg-emerald-500", text: "text-emerald-400" },
  { dot: "bg-amber-400", bar: "bg-amber-500", text: "text-amber-400" },
  { dot: "bg-blue-400", bar: "bg-blue-500", text: "text-blue-400" },
  { dot: "bg-violet-400", bar: "bg-violet-500", text: "text-violet-400" },
  { dot: "bg-rose-400", bar: "bg-rose-500", text: "text-rose-400" },
  { dot: "bg-cyan-400", bar: "bg-cyan-500", text: "text-cyan-400" },
  { dot: "bg-orange-400", bar: "bg-orange-500", text: "text-orange-400" },
  { dot: "bg-indigo-400", bar: "bg-indigo-500", text: "text-indigo-400" },
  { dot: "bg-pink-400", bar: "bg-pink-500", text: "text-pink-400" },
  { dot: "bg-teal-400", bar: "bg-teal-500", text: "text-teal-400" },
  { dot: "bg-lime-400", bar: "bg-lime-500", text: "text-lime-400" },
  { dot: "bg-fuchsia-400", bar: "bg-fuchsia-500", text: "text-fuchsia-400" },
];

export function TaxonomyTree({
  tree,
  filter,
  onSelectDept,
  onSelectCat,
  onSelectSubcat,
}: {
  tree: DeptNode[];
  filter: TaxFilter;
  onSelectDept: (dept: string | null) => void;
  onSelectCat: (dept: string, cat: string | null) => void;
  onSelectSubcat: (dept: string, cat: string, subcat: string | null) => void;
}) {
  // Track which departments and categories are expanded (independent of filter selection)
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  const toggleDept = useCallback((dept: string) => {
    setExpandedDepts((prev) => {
      const next = new Set(prev);
      if (next.has(dept)) next.delete(dept);
      else next.add(dept);
      return next;
    });
  }, []);

  const toggleCat = useCallback((catKey: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(catKey)) next.delete(catKey);
      else next.add(catKey);
      return next;
    });
  }, []);

  if (tree.length === 0) {
    return <p className="py-4 text-center text-xs text-faint">Sin datos de departamentos</p>;
  }

  const maxVenta = tree[0]?.venta_soles || 1;

  return (
    <div className="space-y-0.5">
      {tree.map((dept, deptIdx) => {
        const isSelectedDept = filter.dept === dept.name;
        const isExpanded = expandedDepts.has(dept.name) || isSelectedDept;
        const colorSet = DEPT_COLORS[deptIdx % DEPT_COLORS.length];
        const barPct = Math.max(4, Math.round((dept.venta_soles / maxVenta) * 100));

        return (
          <div key={dept.name} className="group/dept">
            {/* Department row */}
            <div className={cn(
              "flex items-center rounded-lg transition-all",
              isSelectedDept && !filter.cat ? "bg-primary/8 ring-1 ring-primary/15" : "hover:bg-surface-2",
            )}>
              {/* Expand chevron */}
              <button
                onClick={() => toggleDept(dept.name)}
                className="flex h-8 w-7 shrink-0 items-center justify-center text-faint transition-colors hover:text-fg"
                aria-label={isExpanded ? "Colapsar" : "Expandir"}
              >
                <ChevronRight
                  className={cn(
                    "h-3 w-3 transition-transform duration-200",
                    isExpanded && "rotate-90",
                  )}
                />
              </button>

              {/* Department button */}
              <button
                onClick={() => onSelectDept(dept.name)}
                className="flex min-w-0 flex-1 items-center gap-2 py-2 pr-2.5 text-left"
              >
                <span className={cn("h-2 w-2 shrink-0 rounded-full", colorSet.dot)} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn(
                      "truncate text-xs font-medium",
                      isSelectedDept && !filter.cat ? "text-fg" : "text-fg/85",
                    )}>
                      {dept.name}
                    </span>
                    <span className="shrink-0 text-[10px] tabular-nums text-faint">
                      {num(dept.skus)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-surface-3">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500", colorSet.bar)}
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-[10px] tabular-nums text-muted">
                      {money(dept.venta_soles)}
                    </span>
                  </div>
                </div>
              </button>
            </div>

            {/* Categories (expandable) */}
            {isExpanded && dept.cats.length > 0 && (
              <div className="animate-tree-expand ml-3 border-l border-border-soft/60 pl-1">
                {dept.cats.map((cat) => {
                  const catKey = `${dept.name}::${cat.name}`;
                  const isSelectedCat = isSelectedDept && filter.cat === cat.name;
                  const isCatExpanded = expandedCats.has(catKey) || isSelectedCat;
                  const catMaxVenta = dept.cats[0]?.venta_soles || 1;
                  const catBarPct = Math.max(4, Math.round((cat.venta_soles / catMaxVenta) * 100));

                  return (
                    <div key={cat.name}>
                      {/* Category row */}
                      <div className={cn(
                        "flex items-center rounded-md transition-all",
                        isSelectedCat && !filter.subcat
                          ? "bg-accent/8 ring-1 ring-accent/15"
                          : "hover:bg-surface-2/70",
                      )}>
                        {/* Expand chevron for subcats */}
                        <button
                          onClick={() => toggleCat(catKey)}
                          className={cn(
                            "flex h-7 w-6 shrink-0 items-center justify-center text-faint transition-colors hover:text-fg",
                            cat.subcats.length === 0 && "invisible",
                          )}
                          aria-label={isCatExpanded ? "Colapsar" : "Expandir"}
                        >
                          <ChevronRight
                            className={cn(
                              "h-2.5 w-2.5 transition-transform duration-200",
                              isCatExpanded && "rotate-90",
                            )}
                          />
                        </button>

                        {/* Category button */}
                        <button
                          onClick={() => onSelectCat(dept.name, cat.name)}
                          className="flex min-w-0 flex-1 items-center gap-1.5 py-1.5 pr-2 text-left"
                        >
                          <ChevronDown className={cn(
                            "h-2.5 w-2.5 shrink-0 transition-colors",
                            isSelectedCat ? "text-accent" : "text-faint",
                          )} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className={cn(
                                "truncate text-[11px]",
                                isSelectedCat && !filter.subcat
                                  ? "font-semibold text-accent"
                                  : "font-medium text-muted",
                              )}>
                                {cat.name}
                              </span>
                              <span className="shrink-0 text-[10px] tabular-nums text-faint">
                                {num(cat.skus)}
                              </span>
                            </div>
                            <div className="mt-0.5 flex items-center gap-2">
                              <div className="h-[2px] flex-1 overflow-hidden rounded-full bg-surface-3">
                                <div
                                  className="h-full rounded-full bg-accent/60 transition-all duration-500"
                                  style={{ width: `${catBarPct}%` }}
                                />
                              </div>
                              <span className="shrink-0 text-[9px] tabular-nums text-faint">
                                {money(cat.venta_soles)}
                              </span>
                            </div>
                          </div>
                        </button>
                      </div>

                      {/* Subcategories (expandable) */}
                      {isCatExpanded && cat.subcats.length > 0 && (
                        <div className="animate-tree-expand ml-4 border-l border-border-soft/40 pl-1">
                          {cat.subcats.map((subcat) => {
                            const isSelectedSubcat =
                              isSelectedCat && filter.subcat === subcat.name;
                            const subMaxVenta = cat.subcats[0]?.venta_soles || 1;
                            const subBarPct = Math.max(
                              4,
                              Math.round((subcat.venta_soles / subMaxVenta) * 100),
                            );

                            return (
                              <button
                                key={subcat.name}
                                onClick={() =>
                                  onSelectSubcat(dept.name, cat.name, subcat.name)
                                }
                                className={cn(
                                  "flex w-full items-center gap-1.5 rounded-md py-1.5 pl-2 pr-2 text-left transition-all",
                                  isSelectedSubcat
                                    ? "bg-violet/8 ring-1 ring-violet/15"
                                    : "hover:bg-surface-2/50",
                                )}
                              >
                                <span className={cn(
                                  "h-1.5 w-1.5 shrink-0 rounded-full",
                                  isSelectedSubcat ? "bg-violet" : "bg-surface-3",
                                )} />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className={cn(
                                      "truncate text-[10px]",
                                      isSelectedSubcat
                                        ? "font-semibold text-violet"
                                        : "text-faint",
                                    )}>
                                      {subcat.name}
                                    </span>
                                    <span className="shrink-0 text-[9px] tabular-nums text-faint">
                                      {num(subcat.skus)}
                                    </span>
                                  </div>
                                  <div className="mt-0.5 flex items-center gap-2">
                                    <div className="h-[2px] flex-1 overflow-hidden rounded-full bg-surface-3/60">
                                      <div
                                        className="h-full rounded-full bg-violet/50 transition-all duration-500"
                                        style={{ width: `${subBarPct}%` }}
                                      />
                                    </div>
                                    <span className="shrink-0 text-[9px] tabular-nums text-faint">
                                      {money(subcat.venta_soles)}
                                    </span>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
