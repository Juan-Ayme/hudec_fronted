"use client";

import type { Dispatch, SetStateAction } from "react";
import { AlertCircle, History, Search, X } from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { LoadingState, EmptyState } from "@/components/ui/states";
import { num } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { RotacionHistoricaResponse, RotacionHistoricaSku } from "@/lib/types";
import { EMPTY_FILTER, type ParetoFilter, type TaxFilter } from "../lib";
import { SkuTable } from "./SkuTable";

export function CatalogoHistorico({
  data,
  filteredSkus,
  hasFilter,
  taxFilter,
  setTaxFilter,
  search,
  setSearch,
  paretoFilter,
  setParetoFilter,
  loading,
}: {
  data: RotacionHistoricaResponse | undefined;
  filteredSkus: RotacionHistoricaSku[];
  hasFilter: boolean;
  taxFilter: TaxFilter;
  setTaxFilter: Dispatch<SetStateAction<TaxFilter>>;
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  paretoFilter: ParetoFilter;
  setParetoFilter: Dispatch<SetStateAction<ParetoFilter>>;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            Catálogo histórico
            {hasFilter && (
              <span className="ml-1 inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                {taxFilter.subcat ?? taxFilter.cat ?? taxFilter.dept}
                <button
                  onClick={() => setTaxFilter(EMPTY_FILTER)}
                  className="hover:text-primary/70"
                  aria-label="Quitar filtro"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            )}
          </span>
        }
        subtitle={
          data
            ? `Mostrando ${num(filteredSkus.length)} de ${num(data.kpis.skus_con_venta)} SKUs`
            : "Cargando…"
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar SKU, producto…"
                className="h-8 w-44 rounded-md border border-border-soft bg-surface-2 pl-8 pr-2 text-xs text-fg placeholder:text-faint focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </label>
            <div className="inline-flex rounded-md border border-border-soft bg-surface-2 p-0.5">
              {(["todos", "A", "B", "C"] as ParetoFilter[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setParetoFilter(p)}
                  className={cn(
                    "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                    paretoFilter === p
                      ? p === "A"
                        ? "bg-success/15 text-success"
                        : p === "B"
                          ? "bg-info/15 text-info"
                          : p === "C"
                            ? "bg-surface-3 text-fg"
                            : "bg-primary/10 text-primary"
                      : "text-muted hover:text-fg",
                  )}
                >
                  {p === "todos" ? "Todos" : `Pareto ${p}`}
                </button>
              ))}
            </div>
          </div>
        }
      />
      <CardBody className="pt-0">
        {loading ? (
          <LoadingState label="Calculando rotación histórica…" />
        ) : filteredSkus.length === 0 ? (
          <EmptyState
            title="Sin SKUs para los filtros actuales"
            hint="Cambiá la ventana, el departamento o el filtro Pareto."
            icon={AlertCircle}
          />
        ) : (
          <SkuTable rows={filteredSkus} />
        )}
      </CardBody>
    </Card>
  );
}
