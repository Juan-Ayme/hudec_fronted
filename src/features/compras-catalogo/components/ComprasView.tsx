"use client";

import { useState } from "react";

import { AlertTriangle, Archive, Boxes, ChevronDown, ChevronRight, Download, Filter, Home, Layers, Package, Percent, Search, ShoppingCart, SlidersHorizontal, TrendingDown, TrendingUp, Wallet, X, AlertCircle, ArrowRight, MoreHorizontal, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";
import { PremiumLoaderOverlay, shmr } from "@/components/ui/premium-skeleton";
import { money, num, pct } from "@/lib/format";
import { useSucursal } from "@/components/sucursal-context";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { KpiStat } from "@/components/ui/kpi-stat";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { LoadingState, EmptyState } from "@/components/ui/states";
import { FloatingPagination } from "@/components/ui/floating-pagination";

import { Selection, ROOT_SELECTION } from "../types";
import { useComprasCatalogo } from "../hooks/useComprasCatalogo";
import { scopeTitle } from "../utils";
import { JerarquiaTree, RootNode } from "./HierarchySidebar";
import { SkuTable } from "./SkuTable";
import { SkuDetailDrawer } from "./SkuDetailDrawer";
import { TreeLoader, ListLoader, TableLoader } from "@/components/ui/chart-loaders";
import { comprasCatalogoExcelUrl, downloadExcelFile, reporteGerencialExcelUrl } from "@/lib/api";
import { INFORMES_GERENCIALES } from "../constants";

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
          ? cn(activeClass, "border") // Vibrant active chip with glow
          : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80 border border-transparent" // iOS inactive chip
      )}
    >
      {icon && <span className={cn("shrink-0 flex items-center justify-center", active ? "opacity-100" : "opacity-80")}>{icon}</span>}
      {label}
    </button>
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
  
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const LOADING_MESSAGES = [
    "Evaluando salud del catálogo...",
    "Procesando recomendaciones de compra...",
    "Calculando inventarios críticos...",
    "Generando sugerencias de reposición..."
  ];

  const downloadExcel = () => {
    if (officeId != null) {
      downloadExcelFile(comprasCatalogoExcelUrl({ office_id: officeId }), "compras_catalogo.xlsx").catch(console.error);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {officeId == null ? (
        <EmptyState title="Sucursal no seleccionada" hint="Usa el selector superior para elegir una sucursal y ver las sugerencias." />
      ) : query.isError ? (
        <div className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-danger text-sm">
          Error al cargar el catálogo. Por favor, intenta de nuevo.
        </div>
      ) : query.isLoading ? (
        <div className="relative">
          <div className="flex flex-col gap-6">
            <div className="mb-2">
              <div className={cn("h-8 w-44 rounded-full shrink-0", shmr)} />
            </div>
            
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
              <aside className="flex flex-col gap-4">
                <Card className="bg-surface/30 backdrop-blur-xl border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                  <CardBody className="p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <div className={cn("h-8 w-8 rounded-md", shmr)} />
                      <div className="flex-1 space-y-2">
                        <div className={cn("h-2.5 w-24 rounded-full", shmr)} />
                        <div className={cn("h-1.5 w-16 rounded-full", shmr)} />
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 px-2 mt-4">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex flex-col gap-2.5">
                          <div className="flex items-center gap-2">
                            <div className={cn("h-3 w-3 rounded-sm", shmr)} />
                            <div className={cn("h-2.5 w-28 rounded-full", shmr)} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>

                <Card className="bg-surface/30 backdrop-blur-xl border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.3)] h-48">
                  <CardBody className="p-3">
                    <div className={cn("h-4 w-32 rounded-full mb-4", shmr)} />
                    <div className="flex flex-col gap-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <div className={cn("h-2.5 w-24 rounded-full", shmr)} />
                          <div className={cn("h-2.5 w-8 rounded-full", shmr)} />
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              </aside>

              <main className="flex flex-col gap-4">
                <div className={cn("h-8 w-full rounded-lg", shmr)} />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                   {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className={cn("h-16 rounded-xl border border-white/5", shmr)} />
                   ))}
                </div>
                <div className="flex flex-col overflow-hidden bg-surface-2/30 backdrop-blur-2xl rounded-2xl border border-white/5 shadow-[0_12px_48px_rgba(0,0,0,0.4)] h-[50vh]">
                  <div className="border-b border-white/5 bg-surface/60 px-5 py-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    <div className={cn("h-6 w-48 rounded-full shrink-0", shmr)} />
                    <div className={cn("h-8 w-64 rounded-md shrink-0", shmr)} />
                  </div>
                  <div className="flex-1 p-5 flex flex-col gap-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className={cn("h-20 w-full rounded-xl border border-white/5", shmr)} />
                    ))}
                  </div>
                </div>
              </main>
            </div>
          </div>

          {/* Mensajes Flotantes (Overlay Centrado) */}
          <PremiumLoaderOverlay messages={LOADING_MESSAGES} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr] h-[calc(100vh-120px)]">
            <aside className="flex flex-col gap-4 h-full overflow-hidden">
              <Card className="flex flex-col h-full overflow-hidden">
                <CardHeader
                  title={
                    <span className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-primary" />
                      Jerarquía
                    </span>
                  }
                  subtitle="Click para profundizar · doble click para limpiar"
                />
                <CardBody className="space-y-1 px-2 pt-2 flex-1 overflow-y-auto custom-scrollbar">
                  <RootNode total={query.data?.kpis.skus_criticos_total ?? 0} active={!selection.dept && !selection.cat && !selection.subcat} onClick={() => setSelection(ROOT_SELECTION)} />
                  {query.isLoading ? (
                    <TreeLoader />
                  ) : (
                    <JerarquiaTree tree={tree} selection={selection} onSelect={setSelection} />
                  )}
                </CardBody>
              </Card>


            </aside>

            <main className="flex flex-col gap-4 h-full overflow-hidden">
              <Breadcrumb selection={selection} onNavigate={setSelection} />

              <Card className="flex flex-col flex-1 overflow-hidden">
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
                          onClick={() => setShowActionMenu((v) => !v)}
                          variant="outline"
                          size="sm"
                          className={cn(
                            "h-8 w-8 p-0 shrink-0 flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.95] rounded-full shadow-sm text-xs font-medium",
                            showActionMenu || fSeveridad !== "todas" || fTendencia !== "todas" || fStockAlmacen !== "todos"
                              ? "bg-primary/15 border-primary/20 text-primary hover:bg-primary/20"
                              : "bg-surface-2 border-border-soft text-muted hover:text-fg hover:bg-surface-3 hover:border-border"
                          )}
                          title="Más opciones"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          {(fSeveridad !== "todas" || fTendencia !== "todas" || fStockAlmacen !== "todos") && (
                            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary flex items-center justify-center border-2 border-surface shadow-sm">
                            </span>
                          )}
                        </Button>

                        {showActionMenu && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowActionMenu(false)} />
                            <div className="absolute right-0 top-full mt-2 w-48 bg-[#1e293b]/95 backdrop-blur-md border border-white/10 rounded-xl shadow-[0_16px_40px_-8px_rgba(0,0,0,0.6)] flex flex-col p-1.5 z-50 animate-[fade-in-up_var(--duration-fast)_ease-out]">
                              <button 
                                onClick={() => { setShowFilters(true); setShowActionMenu(false); }} 
                                className="flex items-center gap-2.5 px-3 py-2.5 text-[0.75rem] font-medium text-fg/90 hover:bg-surface-3 hover:text-primary rounded-lg transition-colors w-full text-left active:scale-[0.98]"
                              >
                                <Filter className="h-3.5 w-3.5" />
                                Filtros Avanzados
                                {(fSeveridad !== "todas" || fTendencia !== "todas" || fStockAlmacen !== "todos") && <span className="ml-auto flex h-2 w-2 rounded-full bg-primary" />}
                              </button>
                              <div className="h-px w-full bg-white/5 my-0.5" />
                              <button 
                                onClick={() => { setShowExport(true); setShowActionMenu(false); }} 
                                className="flex items-center gap-2.5 px-3 py-2.5 text-[0.75rem] font-medium text-fg/90 hover:bg-surface-3 hover:text-emerald-400 rounded-lg transition-colors w-full text-left active:scale-[0.98]"
                              >
                                <Download className="h-3.5 w-3.5" />
                                Exportar Excel
                              </button>
                            </div>
                          </>
                        )}

                        {showFilters && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowFilters(false)} />
                            <div className="absolute right-0 top-full mt-2 w-[340px] z-50 flex flex-col rounded-3xl border border-white/10 bg-surface/70 backdrop-blur-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)] animate-[fade-in-up_var(--duration-fast)_var(--ease-premium)] overflow-hidden">
                              
                              {/* FILTROS SECTION */}
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
                                  }}
                                >
                                  Limpiar Filtros
                                </Button>
                              </div>
                            </div>
                          </>
                        )}

                        {showExport && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowExport(false)} />
                            <div className="absolute right-0 top-full mt-2 w-[340px] z-50 flex flex-col rounded-3xl border border-white/10 bg-surface/70 backdrop-blur-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)] animate-[fade-in-up_var(--duration-fast)_var(--ease-premium)] overflow-hidden">
                              
                              <div className="flex items-center justify-between border-b border-white/5 px-4 py-3 bg-transparent">
                                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                  <Download className="h-4 w-4 text-white/70" /> Exportar
                                </h3>
                                <button onClick={() => setShowExport(false)} className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-[0.85] text-white/60 hover:text-white transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"><X className="h-3.5 w-3.5" /></button>
                              </div>
                              
                              {/* INFORMES GERENCIALES Y EXPORTAR SECTION */}
                              <div className="p-2">
                                <div className="px-2 pb-2 pt-1">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Informes Gerenciales</span>
                                </div>
                                <ul className="flex flex-col gap-0.5">
                                  {INFORMES_GERENCIALES.map((inf) => (
                                    <li key={inf.tipo}>
                                      <button
                                        onClick={() => {
                                          if (!officeId) return;
                                          downloadExcelFile(
                                            reporteGerencialExcelUrl(inf.tipo as any, { office_id: officeId }),
                                            `informe_${inf.tipo}.xlsx`
                                          ).catch(console.error);
                                          setShowExport(false);
                                        }}
                                        className="w-full text-left flex flex-col items-start px-3 py-2 rounded-xl hover:bg-white/10 active:bg-white/15 active:scale-[0.96] transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] text-sm"
                                      >
                                        <div className="flex items-center gap-2">
                                          {inf.tipo === "por-agotarse" ? (
                                            <div className="w-2.5 h-2.5 rounded-full bg-[#ff453a] shadow-[0_0_8px_rgba(255,69,58,0.5)]" />
                                          ) : inf.tipo === "estancados" ? (
                                            <Boxes className="w-3.5 h-3.5 text-[#32ade6]" />
                                          ) : (
                                            <Layers className="w-3.5 h-3.5 text-[#0a84ff]" />
                                          )}
                                          <span className="font-semibold text-white">{inf.label.substring(inf.label.indexOf(' ') + 1)}</span>
                                        </div>
                                        <span className="text-[10px] text-white/50 mt-0.5">{inf.desc}</span>
                                      </button>
                                    </li>
                                  ))}
                                  <li className="mt-1 border-t border-white/5 pt-1.5">
                                    <button
                                      onClick={() => { downloadExcel(); setShowExport(false); }}
                                      className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 active:bg-white/15 active:scale-[0.96] transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] text-sm font-semibold text-white"
                                    >
                                      <Download className="h-4 w-4 text-white/70" />
                                      Catálogo Completo
                                    </button>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  }
                />
                <CardBody className="pt-0 flex-1 overflow-y-auto custom-scrollbar relative">

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
            </main>
          </div>
        </>
      )}





      <SkuDetailDrawer sku={selectedSku} officeId={officeId} onClose={() => setSelectedSku(null)} />
    </div>
  );
}
