"use client";

import type { Dispatch, SetStateAction } from "react";
import { ChevronRight, FolderTree, Layers, X } from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/states";
import { num } from "@/lib/format";
import { cn } from "@/lib/utils";
import { EMPTY_FILTER, type DeptNode, type TaxFilter } from "../lib";
import { TaxonomyTree } from "./TaxonomyTree";

type Breadcrumb = { label: string; level: "dept" | "cat" | "subcat" };

export function TaxonomyPanel({
  tree,
  taxFilter,
  setTaxFilter,
  hasFilter,
  filterBreadcrumbs,
  skusConVenta,
  loading,
  onSelectDept,
  onSelectCat,
  onSelectSubcat,
}: {
  tree: DeptNode[];
  taxFilter: TaxFilter;
  setTaxFilter: Dispatch<SetStateAction<TaxFilter>>;
  hasFilter: boolean;
  filterBreadcrumbs: Breadcrumb[];
  skusConVenta: number | undefined;
  loading: boolean;
  onSelectDept: (dept: string | null) => void;
  onSelectCat: (dept: string, cat: string | null) => void;
  onSelectSubcat: (dept: string, cat: string, subcat: string | null) => void;
}) {
  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <FolderTree className="h-4 w-4 text-primary" />
            Taxonomía
          </span>
        }
        subtitle="Explora departamentos, categorías y subcategorías"
      />
      <CardBody className="space-y-2 pt-3">
        {/* "All" button */}
        <button
          onClick={() => setTaxFilter(EMPTY_FILTER)}
          className={cn(
            "group flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs transition-all",
            !hasFilter
              ? "bg-primary/10 text-primary ring-1 ring-primary/20"
              : "text-muted hover:bg-surface-2 hover:text-fg",
          )}
        >
          <Layers className={cn("h-3.5 w-3.5 shrink-0", !hasFilter ? "text-primary" : "text-faint")} />
          <span className="flex-1 font-semibold">Todos los departamentos</span>
          <span className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums",
            !hasFilter ? "bg-primary/15 text-primary" : "bg-surface-3 text-faint",
          )}>
            {num(skusConVenta ?? 0)}
          </span>
        </button>

        {/* Active filter breadcrumbs */}
        {hasFilter && (
          <div className="flex flex-wrap items-center gap-1.5 px-1 pt-1">
            {filterBreadcrumbs.map((bc, i) => (
              <span key={bc.level} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-2.5 w-2.5 text-faint" />}
                <span className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold",
                  bc.level === "dept" ? "bg-primary/10 text-primary" :
                  bc.level === "cat" ? "bg-accent/10 text-accent" :
                  "bg-violet/10 text-violet",
                )}>
                  {bc.label}
                  <button
                    onClick={() => {
                      if (bc.level === "dept") setTaxFilter(EMPTY_FILTER);
                      else if (bc.level === "cat") setTaxFilter((p) => ({ ...p, cat: null, subcat: null }));
                      else setTaxFilter((p) => ({ ...p, subcat: null }));
                    }}
                    className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-white/10"
                    aria-label={`Quitar filtro ${bc.label}`}
                  >
                    <X className="h-2 w-2" />
                  </button>
                </span>
              </span>
            ))}
          </div>
        )}

        {/* Tree */}
        {loading ? (
          <LoadingState label="Cargando…" />
        ) : (
          <TaxonomyTree
            tree={tree}
            filter={taxFilter}
            onSelectDept={onSelectDept}
            onSelectCat={onSelectCat}
            onSelectSubcat={onSelectSubcat}
          />
        )}
      </CardBody>
    </Card>
  );
}
