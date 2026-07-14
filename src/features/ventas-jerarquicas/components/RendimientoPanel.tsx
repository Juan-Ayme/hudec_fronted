"use client";

import {
  ChevronRight, Filter, X, Calendar, Package, Timer, Target, BarChart2, ShieldAlert,
} from "lucide-react";
import { num } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/states";
import { ProductDetailPanel } from "@/components/product-detail-panel";
import { cn } from "@/lib/utils";
import { PremiumLoaderOverlay, shmr } from "@/components/ui/premium-skeleton";
import { FloatingPagination } from "@/components/ui/floating-pagination";
import type { Selection } from "@/lib/types";

import { Row } from "../types";
import { useRendimientoPanel } from "../hooks/useRendimientoPanel";
import { n, s } from "../utils";
import { TAB_ACTIVE_BORDER, TAB_TONE_ACTIVE, TAB_TONE_INACTIVE, TAB_BADGE_ACTIVE, TAB_BADGE_INACTIVE } from "../utils/kanbanConfig";
import { ProductListItem } from "./ProductListItem";
import { FilterChip } from "./FilterChip";

const LOADING_MESSAGES = [
  "Construyendo el árbol de jerarquías...",
  "Analizando la salud del inventario...",
  "Calculando cobertura y rotación...",
  "Procesando el historial de 90 días...",
];

/**
 * RendimientoPanel — la columna principal de la vieja página
 * /ventas-jerarquicas (kanban + filtros + lista + detalle), sin árbol ni
 * búsqueda propios: la selección y las filas llegan del contenedor.
 */
export function RendimientoPanel({
  rows,
  allRows,
  selection,
  sucursalName,
  isLoading,
  isError,
  error,
  comprasSkuSet,
  solicitadasSkuSet,
  onSkuJump,
}: {
  /** Filas post-búsqueda global. */
  rows: Row[];
  /** Universo completo (similares / abrir similar). */
  allRows: Row[];
  selection: Selection;
  sucursalName: string | null;
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  /** SKUs presentes en el universo de compras → muestra el salto "Pedir en Compras". */
  comprasSkuSet?: Set<string>;
  /** SKUs que ya han sido solicitados → cambia el aspecto visual. */
  solicitadasSkuSet?: Set<string>;
  onSkuJump?: (sku: string) => void;
}) {
  const state = useRendimientoPanel({ rows, allRows, selection });
  const {
    selectedSku, setSelectedSku, activeTab, setActiveTab, setCurrentPage, ITEMS_PER_PAGE,
    fStock, setFStock, fDias, setFDias, fMesIngreso, setFMesIngreso,
    fXYZ, setFXYZ, fTendencia, setFTendencia, fCobertura, setFCobertura,
    showFilters, setShowFilters, showAdvancedFilters, setShowAdvancedFilters,
    mesesDisponibles, tabCounts, tabItems, safePage, pageItems,
    hasActiveFilters, similarityIndex, sortedCols,
  } = state;

  const selectedSimilares = selectedSku
    ? similarityIndex.get(s(selectedSku["Código SKU"]))
    : undefined;

  const openSimilarSku = (skuCode: string) => {
    const found = allRows.find((r) => s(r["Código SKU"]) === skuCode);
    if (found) setSelectedSku(found);
  };

  if (isError) {
    return (
      <div className="flex min-h-0 flex-1 flex-col justify-center">
        <ErrorState error={error} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-surface-2/30 backdrop-blur-2xl rounded-2xl border border-white/5 shadow-[0_12px_48px_rgba(0,0,0,0.4)]">
        {/* Toolbar Skeleton */}
        <div className="border-b border-white/5 bg-surface/60 px-5 py-2.5 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex gap-1.5 flex-1 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={cn("h-7 w-28 rounded-full shrink-0", shmr)} />
            ))}
          </div>
          <div className={cn("h-8 w-8 rounded-full shrink-0", shmr)} />
        </div>

        {/* List Skeleton - simulating detailed rows */}
        <div className="flex-1 p-5 flex flex-col gap-3 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-surface/10">
              <div className="flex items-center gap-4 flex-1">
                <div className={cn("h-10 w-10 rounded-lg shrink-0", shmr)} />
                <div className="flex flex-col gap-2.5 flex-1">
                  <div className={cn("h-3.5 w-1/3 rounded-full", shmr)} />
                  <div className={cn("h-2 w-1/4 rounded-full", shmr)} />
                </div>
              </div>
              <div className="flex flex-col items-end gap-2.5">
                <div className={cn("h-4 w-24 rounded-full", shmr)} />
                <div className={cn("h-2 w-16 rounded-full", shmr)} />
              </div>
            </div>
          ))}
        </div>

        <PremiumLoaderOverlay messages={LOADING_MESSAGES} />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-surface-2/30 backdrop-blur-2xl rounded-2xl border border-white/5 shadow-[0_12px_48px_rgba(0,0,0,0.4)]">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-violet/5 pointer-events-none" />

      {/* Toolbar (sub-tabs Kanban + Filtros) */}
      <div className="flex flex-col gap-3 border-b border-white/5 bg-surface/60 px-5 py-2.5 relative z-30 backdrop-blur-md">
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-1.5 overflow-x-auto pb-1 flex-1 min-w-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            {sortedCols.map((col) => {
              const count = tabCounts[col.id];
              const isActive = activeTab === col.id;
              const Icon = col.icon;
              return (
                <button
                  key={col.id}
                  onClick={() => setActiveTab(col.id)}
                  className={cn(
                    "group flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.95]",
                    isActive ? TAB_ACTIVE_BORDER[col.tone] : "border-transparent text-muted hover:bg-surface-2 hover:text-fg hover:border-white/10",
                    isActive && "shadow-sm"
                  )}
                >
                  <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors", isActive ? TAB_TONE_ACTIVE[col.tone] : TAB_TONE_INACTIVE[col.tone])}>
                    <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
                  </span>
                  <span className={cn("overflow-hidden whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]", isActive ? "max-w-[200px] opacity-100 text-fg" : "max-w-0 opacity-0 group-hover:max-w-[200px] group-hover:opacity-100")}>
                    <span className="hidden md:inline">{col.label}</span><span className="md:hidden">{col.short}</span>
                  </span>
                  <span className={cn("rounded-full px-1.5 py-0.5 text-[0.6rem] font-bold tabular-nums", isActive ? TAB_BADGE_ACTIVE[col.tone] : TAB_BADGE_INACTIVE[col.tone])}>
                    {num(count)}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative shrink-0 flex items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(true)}
              title="Filtros Avanzados"
              className={cn(
                "relative h-8 w-8 p-0 shrink-0 flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.95] rounded-full shadow-sm text-xs font-medium",
                hasActiveFilters
                  ? "bg-primary/15 border-primary/20 text-primary hover:bg-primary/20"
                  : "bg-surface-2 border-border-soft text-muted hover:text-fg hover:bg-surface-3 hover:border-border"
              )}
            >
              <Filter className="h-4 w-4" />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary border-2 border-[#09090b] text-[8px] font-bold text-white">
                  !
                </span>
              )}
            </Button>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 animate-[fade-in-up_var(--duration-fast)_var(--ease-premium)_both]">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted mr-1">Filtros Activos:</span>
            {fStock !== "todos" && <span className="inline-flex items-center gap-1 rounded-full bg-surface-3 pl-2 pr-1 py-1 text-xs text-fg shadow-sm border border-white/5">Stock: {fStock === "con_stock" ? "Con stock" : "Agotado"}<button onClick={() => setFStock("todos")} className="rounded-full p-0.5 hover:bg-surface-active"><X className="h-3 w-3" /></button></span>}
            {fDias !== "todos" && <span className="inline-flex items-center gap-1 rounded-full bg-surface-3 pl-2 pr-1 py-1 text-xs text-fg shadow-sm border border-white/5">Estancamiento: &gt;{fDias} días<button onClick={() => setFDias("todos")} className="rounded-full p-0.5 hover:bg-surface-active"><X className="h-3 w-3" /></button></span>}
            {fMesIngreso.size > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-surface-3 pl-2 pr-1 py-1 text-xs text-fg shadow-sm border border-white/5">Meses: {fMesIngreso.size} selec.<button onClick={() => setFMesIngreso(new Set())} className="rounded-full p-0.5 hover:bg-surface-active"><X className="h-3 w-3" /></button></span>}
            {fXYZ !== "todos" && <span className="inline-flex items-center gap-1 rounded-full bg-surface-3 pl-2 pr-1 py-1 text-xs text-fg shadow-sm border border-white/5">XYZ: {fXYZ}<button onClick={() => setFXYZ("todos")} className="rounded-full p-0.5 hover:bg-surface-active"><X className="h-3 w-3" /></button></span>}
            {fTendencia !== "todos" && <span className="inline-flex items-center gap-1 rounded-full bg-surface-3 pl-2 pr-1 py-1 text-xs text-fg shadow-sm border border-white/5">Tendencia: {fTendencia}<button onClick={() => setFTendencia("todos")} className="rounded-full p-0.5 hover:bg-surface-active"><X className="h-3 w-3" /></button></span>}
            {fCobertura !== "todos" && <span className="inline-flex items-center gap-1 rounded-full bg-surface-3 pl-2 pr-1 py-1 text-xs text-fg shadow-sm border border-white/5">Cobertura: {fCobertura}<button onClick={() => setFCobertura("todos")} className="rounded-full p-0.5 hover:bg-surface-active"><X className="h-3 w-3" /></button></span>}

            <button onClick={() => { setFStock("todos"); setFDias("todos"); setFMesIngreso(new Set()); setFXYZ("todos"); setFTendencia("todos"); setFCobertura("todos"); }} className="ml-auto text-[0.7rem] font-semibold text-danger hover:underline">
              Limpiar todos
            </button>
          </div>
        )}
      </div>

      {/* Panel Lateral de Filtros (Drawer) */}
      {showFilters && (
        <div className="absolute inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-[fade-in_var(--duration-fast)_ease-out]" onClick={() => setShowFilters(false)} />
          <div className="relative w-full max-w-sm flex flex-col bg-surface border-l border-white/10 shadow-2xl animate-[slide-in-right_var(--duration-slow)_var(--ease-premium)] h-full overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 p-4 bg-surface/50 backdrop-blur-md">
              <h3 className="text-lg font-bold text-fg flex items-center gap-2">
                <Filter className="h-5 w-5 text-violet" /> Filtros Avanzados
              </h3>
              <button onClick={() => setShowFilters(false)} className="p-2 rounded-full hover:bg-white/10 text-muted hover:text-fg transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
              <div className="flex flex-col gap-6">
                {/* Mes de Ingreso Block */}
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1 mb-0.5">
                    <div className="flex items-center gap-2 text-faint">
                      <Calendar className="h-4 w-4" /> <span className="text-xs font-bold uppercase tracking-wider text-muted">Mes de Ingreso</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pl-6 max-h-[160px] overflow-y-auto custom-scrollbar pr-2 pb-1">
                    <FilterChip label="Todos" active={fMesIngreso.size === 0} onClick={() => setFMesIngreso(new Set())} />
                    {mesesDisponibles.map(ym => {
                      const [y, m] = ym.split("-");
                      const d = new Date(parseInt(y), parseInt(m) - 1, 1);
                      const label = new Intl.DateTimeFormat('es-PE', { month: 'short', year: '2-digit' }).format(d);
                      return (
                        <FilterChip
                          key={ym}
                          label={label.charAt(0).toUpperCase() + label.slice(1)}
                          active={fMesIngreso.has(ym)}
                          onClick={() => setFMesIngreso(prev => { const next = new Set(prev); if (next.has(ym)) next.delete(ym); else next.add(ym); return next; })}
                          tone="violet"
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Stock Block */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-faint mb-0.5"><Package className="h-4 w-4" /> <span className="text-xs font-bold uppercase tracking-wider text-muted">Stock Disponible</span></div>
                  <div className="flex flex-wrap gap-2 pl-6">
                    <FilterChip label="Todos" active={fStock === "todos"} onClick={() => setFStock("todos")} />
                    <FilterChip label="Con stock" active={fStock === "con_stock"} onClick={() => setFStock("con_stock")} tone="success" />
                    <FilterChip label="Agotado" active={fStock === "sin_stock"} onClick={() => setFStock("sin_stock")} tone="danger" />
                  </div>
                </div>

                {/* Cobertura Block */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-faint mb-0.5">
                    <ShieldAlert className="h-4 w-4" /> <span className="text-xs font-bold uppercase tracking-wider text-muted">Cobertura</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pl-6">
                    <FilterChip label="Todos" active={fCobertura === "todos"} onClick={() => setFCobertura("todos")} />
                    <FilterChip label="🚨 Crítico (Menos de 10 días)" active={fCobertura === "critica_10"} onClick={() => setFCobertura("critica_10")} tone="danger" />
                    <FilterChip label="⚠️ Alerta (Entre 10 y 15 días)" active={fCobertura === "critica"} onClick={() => setFCobertura("critica")} tone="danger" />
                    <FilterChip label="📉 Bajo (Entre 15 y 30 días)" active={fCobertura === "baja"} onClick={() => setFCobertura("baja")} tone="warning" />
                    <FilterChip label="✅ Óptimo (Más de 30 días)" active={fCobertura === "ok"} onClick={() => setFCobertura("ok")} tone="success" />
                  </div>
                </div>

                <div className="mt-2 border-t border-white/5 pt-4">
                  <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className="flex items-center gap-2 text-sm font-semibold text-muted hover:text-fg transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98] w-full group rounded-xl p-2 -ml-2 hover:bg-surface-2/40">
                    <span className="flex-1 text-left">Búsqueda Avanzada</span>
                    <ChevronRight className={cn("h-4 w-4 transition-transform group-hover:text-fg", showAdvancedFilters && "rotate-90")} />
                  </button>
                </div>

                {showAdvancedFilters && (
                  <div className="flex flex-col gap-6 animate-in slide-in-from-top-4 fade-in duration-300 pb-10">

                    {/* Estancamiento */}
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 text-faint mb-0.5"><Timer className="h-4 w-4" /> <span className="text-xs font-bold uppercase tracking-wider text-muted">Estancamiento</span></div>
                      <div className="flex flex-wrap gap-2 pl-6">
                        <FilterChip label="Todos" active={fDias === "todos"} onClick={() => setFDias("todos")} />
                        <FilterChip label=">7 días" active={fDias === "7"} onClick={() => setFDias("7")} tone="warning" />
                        <FilterChip label=">15 días" active={fDias === "15"} onClick={() => setFDias("15")} tone="warning" />
                        <FilterChip label=">30 días" active={fDias === "30"} onClick={() => setFDias("30")} tone="danger" />
                      </div>
                    </div>

                    {/* XYZ */}
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 text-faint mb-0.5"><Target className="h-4 w-4" /> <span className="text-xs font-bold uppercase tracking-wider text-muted">Categorización XYZ</span></div>
                      <div className="flex flex-wrap gap-2 pl-6">
                        <FilterChip label="Todos" active={fXYZ === "todos"} onClick={() => setFXYZ("todos")} />
                        <FilterChip label="X (frecuente)" active={fXYZ === "X"} onClick={() => setFXYZ("X")} tone="success" />
                        <FilterChip label="Y (moderado)" active={fXYZ === "Y"} onClick={() => setFXYZ("Y")} tone="info" />
                        <FilterChip label="Z (esporádico)" active={fXYZ === "Z"} onClick={() => setFXYZ("Z")} tone="warning" />
                      </div>
                    </div>

                    {/* Tendencia */}
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 text-faint mb-0.5"><BarChart2 className="h-4 w-4" /> <span className="text-xs font-bold uppercase tracking-wider text-muted">Tendencia</span></div>
                      <div className="flex flex-wrap gap-2 pl-6">
                        <FilterChip label="Todos" active={fTendencia === "todos"} onClick={() => setFTendencia("todos")} />
                        <FilterChip label="↑ Creciendo" active={fTendencia === "creciendo"} onClick={() => setFTendencia("creciendo")} tone="success" />
                        <FilterChip label="→ Estable" active={fTendencia === "estable"} onClick={() => setFTendencia("estable")} tone="info" />
                        <FilterChip label="↓ Bajando" active={fTendencia === "bajando"} onClick={() => setFTendencia("bajando")} tone="danger" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="border-t border-white/10 p-4 bg-surface/80 backdrop-blur-md flex justify-end gap-3">
              {hasActiveFilters && (
                <Button variant="ghost" onClick={() => { setFStock("todos"); setFDias("todos"); setFMesIngreso(new Set()); setFXYZ("todos"); setFTendencia("todos"); setFCobertura("todos"); }} className="text-danger hover:bg-danger/10 hover:text-danger rounded-xl active:scale-[0.95] transition-all">
                  Limpiar
                </Button>
              )}
              <Button onClick={() => setShowFilters(false)} className="bg-violet hover:bg-violet/90 text-white shadow-md shadow-violet/20 rounded-xl active:scale-[0.95] transition-all">
                Ver Resultados
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Lista del tab activo */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-transparent relative z-10">
        {tabItems.length === 0 ? (
          <div className="flex h-full items-center justify-center px-4 py-12 text-center text-sm text-faint">
            No hay productos en esta categoría con los filtros actuales.
          </div>
        ) : (
          <div className="flex flex-col pt-2 pb-20">
            {pageItems.map((sku, i) => {
              const code = s(sku["Código SKU"]);
              return (
                <ProductListItem
                  key={`${code}-${(safePage - 1) * ITEMS_PER_PAGE + i}`}
                  sku={sku}
                  ventas={n(sku["Vendido SKU S/"])}
                  unidades={n(sku["Unds Vend (90d)"])}
                  stock={n(sku["Stock Disp"])}
                  similares={similarityIndex.get(code)}
                  onClick={() => setSelectedSku(sku)}
                  isSolicitado={solicitadasSkuSet?.has(code)}
                  onJumpToCompras={
                    onSkuJump && comprasSkuSet?.has(code)
                      ? () => onSkuJump(code)
                      : undefined
                  }
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Pie de paginación flotante (estilo Compras) */}
      <FloatingPagination
        total={tabItems.length}
        limit={ITEMS_PER_PAGE}
        offset={(safePage - 1) * ITEMS_PER_PAGE}
        onChange={(newOffset) => setCurrentPage(Math.floor(newOffset / ITEMS_PER_PAGE) + 1)}
      />

      <ProductDetailPanel
        row={selectedSku || {}}
        open={!!selectedSku}
        onClose={() => setSelectedSku(null)}
        sucursalName={sucursalName}
        similares={selectedSimilares}
        onOpenSimilar={openSimilarSku}
      />
    </div>
  );
}
