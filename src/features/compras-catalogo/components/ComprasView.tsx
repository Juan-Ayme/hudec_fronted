"use client";

import { useState } from "react";

import { AlertTriangle, Archive, ChevronDown, ChevronRight, Download, Filter, Home, Layers, Package, Percent, Search, ShoppingCart, SlidersHorizontal, TrendingDown, TrendingUp, Wallet, X, AlertCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { money, num, pct } from "@/lib/format";
import { useSucursal } from "@/components/sucursal-context";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { KpiStat } from "@/components/ui/kpi-stat";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { LoadingState, EmptyState } from "@/components/ui/states";
import { Pagination } from "@/components/ui/data-table";

import { Selection, ROOT_SELECTION } from "../types";
import { useComprasCatalogo } from "../hooks/useComprasCatalogo";
import { scopeTitle } from "../utils";
import { JerarquiaTree, RootNode } from "./HierarchySidebar";
import { SkuTable } from "./SkuTable";
import { SkuDetailDrawer } from "./SkuDetailDrawer";
import { TreeLoader, ListLoader, TableLoader } from "@/components/ui/chart-loaders";
import { comprasCatalogoExcelUrl, downloadExcelFile } from "@/lib/api";

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
  const activeClass = tone
    ? {
        danger: "border-danger/40 bg-danger/10 text-danger shadow-[0_0_0_1px_rgba(var(--color-danger),0.1)_inset]",
        warning: "border-warning/40 bg-warning/10 text-warning text-yellow-500 shadow-[0_0_0_1px_rgba(var(--color-warning),0.1)_inset]",
        success: "border-success/40 bg-success/10 text-success shadow-[0_0_0_1px_rgba(var(--color-success),0.1)_inset]",
        primary: "border-primary/40 bg-primary/10 text-primary shadow-[0_0_0_1px_rgba(var(--color-primary),0.1)_inset]",
        violet: "border-violet/40 bg-violet/10 text-violet shadow-[0_0_0_1px_rgba(var(--color-violet),0.1)_inset]",
      }[tone]
    : "border-fg/20 bg-fg/5 text-fg shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset]";

  const hoverClass = tone
    ? {
        danger: "hover:border-danger/30 hover:bg-danger/5 hover:text-danger",
        warning: "hover:border-warning/30 hover:bg-warning/5 hover:text-yellow-500",
        success: "hover:border-success/30 hover:bg-success/5 hover:text-success",
        primary: "hover:border-primary/30 hover:bg-primary/5 hover:text-primary",
        violet: "hover:border-violet/30 hover:bg-violet/5 hover:text-violet",
      }[tone]
    : "hover:border-border hover:bg-surface-3 hover:text-fg";

  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all duration-200 flex items-center gap-1.5",
        active
          ? activeClass
          : cn("border-border-soft bg-surface-2 text-muted", hoverClass),
      )}
    >
      {icon && <span className={cn("shrink-0 flex items-center justify-center", active ? "opacity-100" : "opacity-70")}>{icon}</span>}
      {label}
    </button>
  );
}

function MiniKpi({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "danger" | "warning" | "primary" | "success";
}) {
  const colorClass = accent
    ? {
        danger: "text-danger",
        warning: "text-warning",
        primary: "text-primary",
        success: "text-success",
      }[accent]
    : "text-fg";
  return (
    <div className="rounded-lg border border-border-soft bg-surface-2 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-faint">
        {label}
      </p>
      <p className={cn("mt-0.5 text-base font-bold tabular-nums", colorClass)}>
        {value}
      </p>
    </div>
  );
}

function CompactKpi({
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
  icon?: any;
  tone?: "danger" | "warning" | "primary" | "success" | "info" | "violet";
  loading?: boolean;
}) {
  const iconColors = {
    danger: "text-danger bg-danger/10",
    warning: "text-warning bg-warning/10",
    primary: "text-primary bg-primary/10",
    success: "text-success bg-success/10",
    info: "text-info bg-info/10",
    violet: "text-violet bg-violet/10",
  }[tone];

  return (
    <div className="flex flex-col justify-between gap-1.5 rounded-xl border border-border-soft bg-surface-2 p-3 shadow-sm transition-all hover:bg-surface-3">
      <div className="flex items-center gap-2">
        {Icon && (
          <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md", iconColors)}>
            <Icon className="h-3.5 w-3.5" />
          </div>
        )}
        <p className="truncate text-[10px] font-bold uppercase tracking-wider text-muted">
          {label}
        </p>
      </div>
      {loading ? (
        <div className="h-6 w-16 animate-pulse rounded bg-surface-3" />
      ) : (
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-lg font-bold tabular-nums text-fg leading-none">
            {value}
          </span>
        </div>
      )}
      {sub && !loading && (
        <p className="truncate text-[10px] font-medium text-faint">
          {sub}
        </p>
      )}
    </div>
  );
}

function ScopeStats({
  scopeKpis,
}: {
  scopeKpis: {
    total: number;
    critico: number;
    alta: number;
    venta: number;
    reponer: number;
  };
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <MiniKpi label="SKUs en el nivel" value={num(scopeKpis.total)} />
      <MiniKpi label="Críticos" value={num(scopeKpis.critico)} accent="danger" />
      <MiniKpi label="Venta 90d (S/)" value={money(scopeKpis.venta)} accent="primary" />
      <MiniKpi label="Unds a reponer" value={num(scopeKpis.reponer)} accent="success" />
    </div>
  );
}

function Breadcrumb({
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

export function ComprasView() {
  const [showKpis, setShowKpis] = useState(false);
  const { officeId, sucursalName } = useSucursal();
  const {
    query,
    tree,
    filteredSkus,
    scopeKpis,
    handleAction,
    fSeveridad, setFSeveridad,
    fTendencia, setFTendencia,
    fStockAlmacen, setFStockAlmacen,
    showFilters, setShowFilters,
    selection, setSelection,
    search, setSearch,
    selectedSku, setSelectedSku,
    currentPage, setCurrentPage,
    pageItems, ITEMS_PER_PAGE
  } = useComprasCatalogo(officeId);
  const downloadExcel = () => {
    if (officeId != null) {
      downloadExcelFile(comprasCatalogoExcelUrl({ office_id: officeId }), "compras_catalogo.xlsx").catch(console.error);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {officeId == null ? (
        <EmptyState title="Sucursal no seleccionada" hint="Usa el selector superior para elegir una sucursal y ver las sugerencias." />
      ) : query.isError ? (
        <div className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-danger text-sm">
          Error al cargar el catálogo. Por favor, intenta de nuevo.
        </div>
      ) : (
        <>
          <div className="mb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowKpis(!showKpis)}
              className="text-muted hover:text-fg rounded-full px-4 border-border-soft bg-surface-2"
            >
              {showKpis ? "Ocultar Resumen" : "Ver Resumen General"}
              <ChevronDown className={cn("ml-2 h-4 w-4 transition-transform", showKpis && "rotate-180")} />
            </Button>
          </div>

          {showKpis && (
            <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 animate-in slide-in-from-top-2 fade-in duration-200">
            <CompactKpi
              label="SKUs en quiebre"
              value={num(query.data?.kpis.skus_criticos_total)}
              icon={AlertTriangle}
              tone="danger"
              loading={query.isLoading}
              sub={
                query.data ? (
                  <span>
                    <span className="font-semibold text-danger">{num(query.data.kpis.skus_critico)}</span> crít ·{" "}
                    <span className="font-semibold text-warning">{num(query.data.kpis.skus_alta)}</span> alta
                  </span>
                ) : null
              }
            />
            <CompactKpi
              label="Venta en riesgo (90d)"
              value={money(query.data?.kpis.venta_90d_en_riesgo)}
              icon={Wallet}
              tone="warning"
              loading={query.isLoading}
              sub="Pérdida potencial"
            />
            <CompactKpi
              label="Unidades a reponer"
              value={num(query.data?.kpis.unidades_a_reponer)}
              icon={Package}
              tone="primary"
              loading={query.isLoading}
              sub={query.data ? `Cobertura obj: ${query.data.cobertura_objetivo_dias}d` : null}
            />
            <CompactKpi
              label="Margen prom."
              value={
                query.data?.kpis.margen_promedio_pct !== null && query.data?.kpis.margen_promedio_pct !== undefined
                  ? pct(query.data.kpis.margen_promedio_pct)
                  : "—"
              }
              icon={Percent}
              tone="success"
              loading={query.isLoading}
              sub="Ponderado (90d)"
            />
            </section>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
            <aside className="flex flex-col gap-4">
              <Card className="overflow-hidden">
                <CardHeader
                  title={
                    <span className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-primary" />
                      Jerarquía
                    </span>
                  }
                  subtitle="Click para profundizar · doble click para limpiar"
                />
                <CardBody className="space-y-1 px-2 pt-2">
                  <RootNode total={query.data?.kpis.skus_criticos_total ?? 0} active={!selection.dept && !selection.cat && !selection.subcat} onClick={() => setSelection(ROOT_SELECTION)} />
                  {query.isLoading ? (
                    <TreeLoader />
                  ) : (
                    <JerarquiaTree tree={tree} selection={selection} onSelect={setSelection} />
                  )}
                </CardBody>
              </Card>

              <Card>
                <CardHeader
                  title={
                    <span className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-warning" />
                      Por acción sugerida
                    </span>
                  }
                />
                <CardBody className="pt-3">
                  {query.isLoading ? (
                    <ListLoader />
                  ) : query.data?.por_accion.length ? (
                    <ul className="space-y-1.5 text-xs">
                      {query.data.por_accion.map((a) => (
                        <li key={a.accion} className="flex items-center justify-between rounded px-2 py-1.5 text-muted hover:bg-surface-2">
                          <span className="font-medium text-fg">{a.accion}</span>
                          <span className="tabular-nums font-semibold text-primary">{num(a.skus)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="py-2 text-center text-xs text-faint">Sin acciones pendientes</p>
                  )}
                </CardBody>
              </Card>
            </aside>

            <main className="flex flex-col gap-4">
              <Breadcrumb selection={selection} onNavigate={setSelection} />

              {(selection.dept || selection.cat || selection.subcat) && (
                <ScopeStats scopeKpis={scopeKpis} />
              )}

              <Card>
                <CardHeader
                  title={
                    <span className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-primary" />
                      {scopeTitle(selection)}
                    </span>
                  }
                  subtitle={
                    query.data
                      ? `Mostrando ${num(filteredSkus.length)} de ${num(query.data.kpis.skus_criticos_total)} SKUs`
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
                      <div className="relative">
                        <Button
                          onClick={() => setShowFilters(!showFilters)}
                          variant="outline"
                          size="sm"
                          className={cn(
                            "h-8 shrink-0 relative transition-all",
                            (fSeveridad !== "todas" || fTendencia !== "todas" || fStockAlmacen !== "todos")
                              ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary/60"
                              : "border-border-soft bg-surface-2 hover:bg-surface-3 hover:text-fg text-muted"
                          )}
                        >
                          <SlidersHorizontal className="h-3.5 w-3.5 mr-2" />
                          <span className="hidden sm:inline font-medium">Filtros</span>
                          {(fSeveridad !== "todas" || fTendencia !== "todas" || fStockAlmacen !== "todos") && (
                            <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-primary text-[8px] font-bold text-black flex items-center justify-center border-2 border-surface shadow-sm">
                              {(fSeveridad !== "todas" ? 1 : 0) + (fTendencia !== "todas" ? 1 : 0) + (fStockAlmacen !== "todos" ? 1 : 0)}
                            </span>
                          )}
                        </Button>

                        {showFilters && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowFilters(false)} />
                            <div className="absolute right-0 top-full mt-2 w-[340px] z-50 flex flex-col rounded-xl border border-white/10 bg-surface shadow-2xl animate-[fade-in-up_var(--duration-fast)_var(--ease-premium)] overflow-hidden">
                              <div className="flex items-center justify-between border-b border-white/10 p-3 bg-surface/50 backdrop-blur-md">
                                <h3 className="text-sm font-bold text-fg flex items-center gap-2">
                                  <Filter className="h-4 w-4 text-violet" /> Filtros Avanzados
                                </h3>
                                <button onClick={() => setShowFilters(false)} className="p-1 rounded-full hover:bg-white/10 text-muted hover:text-fg transition-colors"><X className="h-4 w-4" /></button>
                              </div>
                              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar max-h-[60vh]">
                                <div className="flex flex-col gap-5">
                                  
                                  <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2 text-faint">
                                      <AlertTriangle className="h-4 w-4" />
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Severidad del Quiebre</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                      <FilterChip label="Todas" active={fSeveridad === "todas"} onClick={() => setFSeveridad("todas")} tone="violet" />
                                      <FilterChip label="Crítico" icon={<div className="w-2 h-2 rounded-full bg-danger shadow-[0_0_6px_rgba(var(--color-danger),0.8)]" />} active={fSeveridad === "critico"} onClick={() => setFSeveridad("critico")} tone="danger" />
                                      <FilterChip label="Alta" icon={<div className="w-2 h-2 rounded-full bg-warning shadow-[0_0_6px_rgba(var(--color-warning),0.8)]" />} active={fSeveridad === "alta"} onClick={() => setFSeveridad("alta")} tone="warning" />
                                    </div>
                                  </div>

                                  <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2 text-faint">
                                      <TrendingUp className="h-4 w-4" />
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Tendencia de Demanda</span>
                                    </div>
                                    <p className="text-[0.6rem] text-faint/80 leading-tight">Compara últimos 30d vs 90d históricos.</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      <FilterChip label="Todas" active={fTendencia === "todas"} onClick={() => setFTendencia("todas")} tone="violet" />
                                      <FilterChip label="Creciente" icon={<TrendingUp className="w-3.5 h-3.5" />} active={fTendencia === "creciente"} onClick={() => setFTendencia("creciente")} tone="success" />
                                      <FilterChip label="Estable" icon={<ArrowRight className="w-3.5 h-3.5" />} active={fTendencia === "estable"} onClick={() => setFTendencia("estable")} tone="primary" />
                                      <FilterChip label="Decreciente" icon={<TrendingDown className="w-3.5 h-3.5" />} active={fTendencia === "decreciente"} onClick={() => setFTendencia("decreciente")} tone="warning" />
                                    </div>
                                  </div>

                                  <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2 text-faint">
                                      <Archive className="h-4 w-4" />
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Stock en CD</span>
                                    </div>
                                    <p className="text-[0.6rem] text-faint/80 leading-tight">¿Tenemos unidades para trasladar hoy?</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      <FilterChip label="Todos" active={fStockAlmacen === "todos"} onClick={() => setFStockAlmacen("todos")} tone="violet" />
                                      <FilterChip label="Con Stock" icon={<Package className="w-3.5 h-3.5" />} active={fStockAlmacen === "con_stock"} onClick={() => setFStockAlmacen("con_stock")} tone="success" />
                                      <FilterChip label="Sin Stock" icon={<AlertCircle className="w-3.5 h-3.5" />} active={fStockAlmacen === "sin_stock"} onClick={() => setFStockAlmacen("sin_stock")} tone="danger" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="shrink-0 border-t border-white/5 bg-surface-2 p-3">
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 border-white/5 bg-surface hover:bg-surface-3 hover:text-fg text-muted"
                                    onClick={() => {
                                      setFSeveridad("todas");
                                      setFTendencia("todas");
                                      setFStockAlmacen("todos");
                                    }}
                                  >
                                    Limpiar
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="flex-1 bg-violet text-white hover:bg-violet/90"
                                    onClick={() => setShowFilters(false)}
                                  >
                                    Ver Resultados
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="w-px h-6 bg-border-soft mx-1 hidden sm:block" />
                      <Button 
                        onClick={downloadExcel} 
                        variant="outline" 
                        size="sm"
                        className="h-8 shrink-0 border-success/40 bg-success/12 text-success transition-colors hover:bg-success/25 hover:border-success/60"
                      >
                        <Download className="h-3.5 w-3.5 mr-1" />
                        <span className="hidden sm:inline">Exportar</span>
                      </Button>
                    </div>
                  }
                />
                <CardBody className="pt-0 min-h-[400px]">

                  {query.isLoading ? (
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
                      />
                      {filteredSkus.length > ITEMS_PER_PAGE && (
                        <div className="border-t border-border-soft px-4 py-2">
                          <Pagination
                            total={filteredSkus.length}
                            limit={ITEMS_PER_PAGE}
                            offset={(currentPage - 1) * ITEMS_PER_PAGE}
                            onChange={(newOffset) => setCurrentPage(Math.floor(newOffset / ITEMS_PER_PAGE) + 1)}
                          />
                        </div>
                      )}
                    </>
                  )}
                </CardBody>
              </Card>
            </main>
          </div>
        </>
      )}





      <SkuDetailDrawer sku={selectedSku} officeId={officeId} onClose={() => setSelectedSku(null)} />
    </div>
  );
}
