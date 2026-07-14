"use client";

import { useEffect } from "react";
import {
  AlertTriangle, Archive, ArrowRight, AlertCircle, Filter, Package, Send,
  ShoppingCart, TrendingDown, TrendingUp, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { num } from "@/lib/format";
import { useCompany } from "@/components/company-context";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { FloatingPagination } from "@/components/ui/floating-pagination";
import { TableLoader } from "@/components/ui/chart-loaders";
import type { ComprasCatalogoSku, Selection } from "@/lib/types";
import type { PurchaseDecision } from "@/lib/api";

import { useComprasPanel } from "../hooks/useComprasPanel";
import { scopeTitle } from "../utils";
import { SkuTable } from "./SkuTable";
import { SkuDetailDrawer } from "./SkuDetailDrawer";

function FilterChip({
  label,
  active,
  onClick,
  tone,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  tone?: "danger" | "warning" | "success" | "primary" | "violet";
  icon?: React.ReactNode;
}) {
  const toneClasses = {
    danger: "bg-[#ff453a]/20 text-[#ff453a] border-[#ff453a]/30 shadow-[0_0_12px_rgba(255,69,58,0.2)]",
    warning: "bg-[#ff9f0a]/20 text-[#ff9f0a] border-[#ff9f0a]/30 shadow-[0_0_12px_rgba(255,159,10,0.2)]",
    success: "bg-[#30d158]/20 text-[#30d158] border-[#30d158]/30 shadow-[0_0_12px_rgba(48,209,88,0.2)]",
    primary: "bg-[#0a84ff]/20 text-[#0a84ff] border-[#0a84ff]/30 shadow-[0_0_12px_rgba(10,132,255,0.2)]",
    violet: "bg-[#bf5af2]/20 text-[#bf5af2] border-[#bf5af2]/30 shadow-[0_0_12px_rgba(191,90,242,0.2)]",
  };

  const activeClass = tone
    ? toneClasses[tone]
    : "bg-white/20 text-white shadow-[0_2px_10px_rgba(255,255,255,0.1)] border border-white/10";

  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-3.5 py-1.5 text-[11px] font-bold flex items-center gap-1.5 transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] active:scale-[0.92] backdrop-blur-md",
        active
          ? cn(activeClass, "border")
          : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80 border border-transparent",
      )}
    >
      {icon && <span className={cn("shrink-0 flex items-center justify-center", active ? "opacity-100" : "opacity-80")}>{icon}</span>}
      {label}
    </button>
  );
}

/**
 * ComprasPanel — la columna principal de la vieja página /compras-catalogo
 * (tabla de sugerencias + filtros + drawer de decisión), sin árbol, sin
 * breadcrumb y sin búsqueda propios: eso vive en el contenedor.
 */
export function ComprasPanel({
  skus,
  kpisTotal,
  selection,
  officeId,
  isLoading,
  isError,
  solicitadasBySku,
  openSkuRequest,
  onSkuRequestHandled,
}: {
  /** SKUs post-búsqueda global (pre-selección). */
  skus: ComprasCatalogoSku[];
  /** Total del universo compras (kpis.skus_criticos_total) para "Mostrando X de Y". */
  kpisTotal?: number;
  selection: Selection;
  officeId: number | null;
  isLoading: boolean;
  isError: boolean;
  solicitadasBySku: Map<string, PurchaseDecision>;
  /** Salto cruzado: SKU cuyo drawer debe abrirse al llegar desde Rendimiento. */
  openSkuRequest?: ComprasCatalogoSku | null;
  onSkuRequestHandled?: () => void;
}) {
  const { activeRole } = useCompany();
  // operador/admin deciden compras; viewer (encargado de tienda) solo solicita.
  const canDecidir = activeRole === "admin" || activeRole === "operador";

  const {
    filteredSkus,
    handleAction,
    fSeveridad, setFSeveridad,
    fTendencia, setFTendencia,
    fStockAlmacen, setFStockAlmacen,
    fSolicitado, setFSolicitado,
    showFilters, setShowFilters,
    selectedSku, setSelectedSku,
    currentPage, setCurrentPage,
    pageItems, ITEMS_PER_PAGE,
  } = useComprasPanel({ skus, selection, solicitadasBySku, officeId });

  // Salto cruzado desde Rendimiento: abre el drawer del SKU aunque los
  // filtros de la tabla no lo muestren.
  useEffect(() => {
    if (!openSkuRequest) return;
    setSelectedSku(openSkuRequest);
    onSkuRequestHandled?.();
  }, [openSkuRequest, onSkuRequestHandled, setSelectedSku]);

  const hasActiveFilters =
    fSeveridad !== "todas" || fTendencia !== "todas" || fStockAlmacen !== "todos" || fSolicitado;

  if (officeId == null) {
    return (
      <Card className="flex min-h-0 flex-1 flex-col items-center justify-center">
        <EmptyState
          title="Sucursal no seleccionada"
          hint="Usa el selector superior para elegir una sucursal y ver las sugerencias de compra."
        />
      </Card>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-primary" />
              {scopeTitle(selection)}
            </span>
          }
          subtitle={
            isLoading
              ? "Cargando…"
              : `Mostrando ${num(filteredSkus.length)} de ${num(kpisTotal ?? 0)} SKUs`
          }
          action={
            <div className="relative">
              <Button
                onClick={() => setShowFilters((v: boolean) => !v)}
                variant="outline"
                size="sm"
                className={cn(
                  "relative h-8 w-8 p-0 shrink-0 flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.95] rounded-full shadow-sm text-xs font-medium",
                  showFilters || hasActiveFilters
                    ? "bg-primary/15 border-primary/20 text-primary hover:bg-primary/20"
                    : "bg-surface-2 border-border-soft text-muted hover:text-fg hover:bg-surface-3 hover:border-border",
                )}
                title="Filtros"
              >
                <Filter className="h-4 w-4" />
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary flex items-center justify-center border-2 border-surface shadow-sm" />
                )}
              </Button>

              {showFilters && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowFilters(false)} />
                  <div className="absolute right-0 top-full mt-2 w-[340px] z-50 flex flex-col rounded-3xl border border-white/10 bg-surface/70 backdrop-blur-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)] animate-[fade-in-up_var(--duration-fast)_var(--ease-premium)] overflow-hidden">

                    <div className="flex items-center justify-between border-b border-white/5 px-4 py-3 bg-transparent">
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Filter className="h-4 w-4 text-white/70" /> Filtros
                      </h3>
                      <button onClick={() => setShowFilters(false)} className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-[0.85] text-white/60 hover:text-white transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"><X className="h-3.5 w-3.5" /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar max-h-[40vh]">
                      <div className="flex flex-col gap-6">

                        <div className="flex flex-col gap-2.5">
                          <div className="flex items-center gap-2 text-faint">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Severidad del Quiebre</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            <FilterChip label="Todas" active={fSeveridad === "todas"} onClick={() => setFSeveridad("todas")} tone="violet" />
                            <FilterChip label="Crítico" icon={<div className="w-2 h-2 rounded-full bg-danger" />} active={fSeveridad === "critico"} onClick={() => setFSeveridad("critico")} tone="danger" />
                            <FilterChip label="Alta" icon={<div className="w-2 h-2 rounded-full bg-warning" />} active={fSeveridad === "alta"} onClick={() => setFSeveridad("alta")} tone="warning" />
                          </div>
                        </div>

                        <div className="flex flex-col gap-2.5">
                          <div className="flex items-center gap-2 text-faint">
                            <TrendingUp className="h-4 w-4" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Tendencia de Demanda</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            <FilterChip label="Todas" active={fTendencia === "todas"} onClick={() => setFTendencia("todas")} tone="violet" />
                            <FilterChip label="Creciente" icon={<TrendingUp className="w-3.5 h-3.5" />} active={fTendencia === "creciente"} onClick={() => setFTendencia("creciente")} tone="success" />
                            <FilterChip label="Estable" icon={<ArrowRight className="w-3.5 h-3.5" />} active={fTendencia === "estable"} onClick={() => setFTendencia("estable")} tone="primary" />
                            <FilterChip label="Decreciente" icon={<TrendingDown className="w-3.5 h-3.5" />} active={fTendencia === "decreciente"} onClick={() => setFTendencia("decreciente")} tone="warning" />
                          </div>
                        </div>

                        <div className="flex flex-col gap-2.5">
                          <div className="flex items-center gap-2 text-faint">
                            <Archive className="h-4 w-4" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Stock en CD</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            <FilterChip label="Todos" active={fStockAlmacen === "todos"} onClick={() => setFStockAlmacen("todos")} tone="violet" />
                            <FilterChip label="Con Stock" icon={<Package className="w-3.5 h-3.5" />} active={fStockAlmacen === "con_stock"} onClick={() => setFStockAlmacen("con_stock")} tone="success" />
                            <FilterChip label="Sin Stock" icon={<AlertCircle className="w-3.5 h-3.5" />} active={fStockAlmacen === "sin_stock"} onClick={() => setFStockAlmacen("sin_stock")} tone="danger" />
                          </div>
                        </div>

                        <div className="flex flex-col gap-2.5">
                          <div className="flex items-center gap-2 text-faint">
                            <Send className="h-4 w-4" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Estado de solicitud</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            <FilterChip label="Todas" active={!fSolicitado} onClick={() => setFSolicitado(false)} tone="violet" />
                            <FilterChip label="Solicitados" icon={<Send className="w-3.5 h-3.5" />} active={fSolicitado} onClick={() => setFSolicitado(true)} tone="warning" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 border-t border-white/5 bg-transparent p-4 pb-2">
                      <Button
                        variant="outline"
                        className="w-full rounded-full border border-white/10 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white backdrop-blur-md h-9 text-xs font-bold transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] active:scale-[0.96]"
                        onClick={() => {
                          setFSeveridad("todas");
                          setFTendencia("todas");
                          setFStockAlmacen("todos");
                          setFSolicitado(false);
                        }}
                      >
                        Limpiar Filtros
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          }
        />
        <CardBody className="pt-0 flex-1 min-h-0 overflow-y-auto custom-scrollbar relative">
          {isError ? (
            <div className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-danger text-sm">
              Error al cargar el catálogo. Por favor, intenta de nuevo.
            </div>
          ) : isLoading ? (
            <TableLoader />
          ) : filteredSkus.length === 0 ? (
            <EmptyState
              title="Sin SKUs para los filtros actuales"
              hint="Probá cambiar la severidad, navegá a otro nivel o limpiá la búsqueda."
            />
          ) : (
            <>
              <SkuTable
                rows={pageItems}
                onSelect={setSelectedSku}
                onAction={handleAction}
                solicitadasBySku={solicitadasBySku}
                canDecidir={canDecidir}
              />
              <FloatingPagination
                total={filteredSkus.length}
                limit={ITEMS_PER_PAGE}
                offset={(currentPage - 1) * ITEMS_PER_PAGE}
                onChange={(newOffset) => setCurrentPage(Math.floor(newOffset / ITEMS_PER_PAGE) + 1)}
              />
            </>
          )}
        </CardBody>
      </Card>

      <SkuDetailDrawer sku={selectedSku} officeId={officeId} onClose={() => setSelectedSku(null)} />
    </div>
  );
}
