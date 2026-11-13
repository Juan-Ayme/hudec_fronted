"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  X,
  Search,
  AlertTriangle,
  ShoppingBag,
  TrendingUp,
  Store,
  ChevronLeft,
  ChevronRight,
  Package,
  Layers,
} from "lucide-react";
import { getDailySalesDetail } from "@/lib/api";
import { money, num } from "@/lib/format";
import { useSucursal } from "@/components/sucursal-context";
import { LineChartLoader } from "@/components/ui/chart-loaders";
import { ErrorState, EmptyState } from "@/components/ui/states";
import { cn } from "@/lib/utils";

interface DayDrillDownPanelProps {
  date: string; // YYYY-MM-DD
  onClose: () => void;
  onNavigateDate?: (newDate: string) => void;
}

export function DayDrillDownPanel({
  date,
  onClose,
  onNavigateDate,
}: DayDrillDownPanelProps) {
  const { officeId } = useSucursal();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"productos" | "quiebres" | "sucursales">("productos");

  const query = useQuery({
    queryKey: ["daily-sales-detail", date, officeId],
    queryFn: ({ signal }) => getDailySalesDetail(date, officeId, signal),
    enabled: Boolean(date),
    staleTime: 5 * 60_000,
  });

  const detail = query.data;

  // Format display date: "23 de Julio, 2026"
  const formattedDate = (() => {
    try {
      const [y, m, d] = date.split("-").map(Number);
      const obj = new Date(y, m - 1, d);
      return obj.toLocaleDateString("es-PE", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return date;
    }
  })();

  const handlePrevDay = () => {
    try {
      const [y, m, d] = date.split("-").map(Number);
      const dt = new Date(y, m - 1, d - 1);
      const iso = dt.toISOString().split("T")[0];
      onNavigateDate?.(iso);
    } catch {
      /* ignore */
    }
  };

  const handleNextDay = () => {
    try {
      const [y, m, d] = date.split("-").map(Number);
      const dt = new Date(y, m - 1, d + 1);
      const iso = dt.toISOString().split("T")[0];
      onNavigateDate?.(iso);
    } catch {
      /* ignore */
    }
  };

  const filteredProducts = (detail?.productos ?? []).filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.producto.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.categoria.toLowerCase().includes(q) ||
      p.departamento.toLowerCase().includes(q)
    );
  });

  return (
    <div className="rounded-2xl border border-primary/20 bg-surface-2/40 backdrop-blur-2xl p-5 shadow-2xl animate-[fade-in-up_0.4s_cubic-bezier(0.16,1,0.3,1)] relative overflow-hidden">
      {/* Background glow sutil */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />

      {/* Header del Panel */}
      <div className="flex flex-col gap-3 pb-4 border-b border-border/40 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 border border-primary/20 text-primary shadow-sm">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-fg capitalize tracking-tight">
                {formattedDate}
              </h2>
              <span className="text-xs font-mono bg-surface-3 text-muted px-2 py-0.5 rounded-md border border-white/5">
                {date}
              </span>
            </div>
            <p className="text-xs text-muted">
              Inspección detallada de productos vendidos, quiebres de stock y tiendas
            </p>
          </div>
        </div>

        {/* Acciones del Header */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {onNavigateDate && (
            <div className="flex items-center gap-1 bg-surface-3/60 rounded-lg p-0.5 border border-white/5">
              <button
                onClick={handlePrevDay}
                className="p-1 text-muted hover:text-fg transition-colors rounded-md hover:bg-surface-4"
                title="Día anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleNextDay}
                className="p-1 text-muted hover:text-fg transition-colors rounded-md hover:bg-surface-4"
                title="Día siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-surface-3/80 text-muted hover:text-fg hover:bg-surface-4 transition-all"
            title="Cerrar detalle"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {query.isLoading ? (
        <div className="py-12">
          <LineChartLoader />
        </div>
      ) : query.isError ? (
        <div className="py-8">
          <ErrorState error={query.error} />
        </div>
      ) : !detail ? (
        <EmptyState title="Sin datos para esta fecha" />
      ) : (
        <div className="mt-5 space-y-6">
          {/* KPI Cards del Día */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-white/5 bg-surface/60 p-3.5 shadow-sm backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs font-medium text-muted mb-1">
                <ShoppingBag className="h-3.5 w-3.5 text-primary" /> Ventas Totales
              </div>
              <p className="text-xl font-bold text-fg tracking-tight">
                {money(detail.summary.ventas)}
              </p>
            </div>

            <div className="rounded-xl border border-white/5 bg-surface/60 p-3.5 shadow-sm backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs font-medium text-muted mb-1">
                <TrendingUp className="h-3.5 w-3.5 text-success" /> Tickets
              </div>
              <p className="text-xl font-bold text-fg tracking-tight">
                {num(detail.summary.tickets)} <span className="text-xs font-normal text-muted">transacciones</span>
              </p>
            </div>

            <div className="rounded-xl border border-white/5 bg-surface/60 p-3.5 shadow-sm backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs font-medium text-muted mb-1">
                <Layers className="h-3.5 w-3.5 text-accent" /> Ticket Promedio
              </div>
              <p className="text-xl font-bold text-fg tracking-tight">
                {money(detail.summary.ticket_promedio)}
              </p>
            </div>

            <div className={cn(
              "rounded-xl border p-3.5 shadow-sm backdrop-blur-md transition-all",
              detail.quiebres.length > 0
                ? "border-danger/30 bg-danger/10 text-danger"
                : "border-white/5 bg-surface/60 text-muted"
            )}>
              <div className="flex items-center gap-2 text-xs font-medium mb-1">
                <AlertTriangle className={cn("h-3.5 w-3.5", detail.quiebres.length > 0 ? "text-danger" : "text-muted")} />
                Quiebres Detectados
              </div>
              <p className={cn("text-xl font-bold tracking-tight", detail.quiebres.length > 0 ? "text-danger" : "text-fg")}>
                {detail.quiebres.length} <span className="text-xs font-normal opacity-80">artículos agotados</span>
              </p>
            </div>
          </div>

          {/* Navegación por pestañas */}
          <div className="flex items-center justify-between border-b border-border/40 pb-2 flex-wrap gap-2">
            <div className="flex items-center gap-1.5 bg-surface-3/50 p-1 rounded-xl border border-white/5">
              <button
                onClick={() => setActiveTab("productos")}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                  activeTab === "productos"
                    ? "bg-primary text-primary-fg shadow-sm font-semibold"
                    : "text-muted hover:text-fg hover:bg-surface-4/60"
                )}
              >
                <Package className="h-3.5 w-3.5" />
                Productos Vendidos ({detail.productos.length})
              </button>

              <button
                onClick={() => setActiveTab("quiebres")}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all relative",
                  activeTab === "quiebres"
                    ? "bg-danger text-danger-fg shadow-sm font-semibold"
                    : "text-muted hover:text-fg hover:bg-surface-4/60"
                )}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Agotados / Quiebre ({detail.quiebres.length})
                {detail.quiebres.length > 0 && activeTab !== "quiebres" && (
                  <span className="h-2 w-2 rounded-full bg-danger animate-ping absolute -top-0.5 -right-0.5" />
                )}
              </button>

              <button
                onClick={() => setActiveTab("sucursales")}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                  activeTab === "sucursales"
                    ? "bg-primary text-primary-fg shadow-sm font-semibold"
                    : "text-muted hover:text-fg hover:bg-surface-4/60"
                )}
              >
                <Store className="h-3.5 w-3.5" />
                Sucursales ({detail.por_sucursal.length})
              </button>
            </div>

            {/* Buscador para productos */}
            {activeTab === "productos" && (
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Buscar SKU o producto..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-surface/50 pl-9 pr-3 py-1.5 text-xs text-fg placeholder:text-muted/50 outline-none focus:border-primary/40"
                />
              </div>
            )}
          </div>

          {/* TAB 1: Productos Vendidos */}
          {activeTab === "productos" && (
            <div className="overflow-x-auto rounded-xl border border-white/5 bg-surface/30">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/40 bg-surface-3/50 font-medium text-muted uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3">Producto</th>
                    <th className="py-2.5 px-3">Categoría</th>
                    <th className="py-2.5 px-3 text-right">Unds Vendidas</th>
                    <th className="py-2.5 px-3 text-right">Total Soles</th>
                    <th className="py-2.5 px-3 text-right">Stock Actual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-muted">
                        No se encontraron productos coincidentes
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p, idx) => (
                      <tr key={idx} className="hover:bg-surface-2/60 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-muted text-[11px]">{p.sku || "—"}</td>
                        <td className="py-2.5 px-3 font-medium text-fg max-w-[220px] truncate" title={p.producto}>
                          {p.producto}
                        </td>
                        <td className="py-2.5 px-3 text-muted">{p.categoria}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-fg">{num(p.unidades_vendidas)}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-primary">{money(p.total_ventas)}</td>
                        <td className="py-2.5 px-3 text-right">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                              p.stock_actual <= 0
                                ? "bg-danger/20 text-danger border border-danger/30"
                                : p.stock_actual <= 2
                                ? "bg-warning/20 text-warning border border-warning/30"
                                : "bg-success/15 text-success"
                            )}
                          >
                            {num(p.stock_actual)} unds
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: Quiebres de Stock */}
          {activeTab === "quiebres" && (
            <div className="space-y-3">
              {detail.quiebres.length === 0 ? (
                <div className="p-6 text-center rounded-xl border border-success/20 bg-success/5 text-success">
                  🎉 ¡Excelente! Ninguno de los productos vendidos ese día quedó en quiebre de stock.
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 p-3 rounded-xl border border-danger/30 bg-danger/10 text-danger text-xs">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>
                      Los siguientes <strong>{detail.quiebres.length} productos</strong> tuvieron alta demanda en esta fecha pero actualmente tienen un stock crítico (≤ 2 unidades o 0).
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-white/5 bg-surface/30">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-border/40 bg-surface-3/50 font-medium text-muted uppercase tracking-wider text-[10px]">
                          <th className="py-2.5 px-3">SKU</th>
                          <th className="py-2.5 px-3">Producto Agotado</th>
                          <th className="py-2.5 px-3">Categoría</th>
                          <th className="py-2.5 px-3 text-right">Vendidas en la fecha</th>
                          <th className="py-2.5 px-3 text-right">Monto Generado</th>
                          <th className="py-2.5 px-3 text-right">Stock Disponible</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20">
                        {detail.quiebres.map((p, idx) => (
                          <tr key={idx} className="hover:bg-danger/5 transition-colors">
                            <td className="py-2.5 px-3 font-mono text-muted text-[11px]">{p.sku || "—"}</td>
                            <td className="py-2.5 px-3 font-medium text-fg max-w-[220px] truncate" title={p.producto}>
                              {p.producto}
                            </td>
                            <td className="py-2.5 px-3 text-muted">{p.categoria}</td>
                            <td className="py-2.5 px-3 text-right font-semibold text-fg">{num(p.unidades_vendidas)}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-primary">{money(p.total_ventas)}</td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-danger/20 text-danger border border-danger/40 animate-pulse">
                                {p.stock_actual <= 0 ? "AGOTADO (0)" : `${num(p.stock_actual)} crítico`}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 3: Ventas por Sucursal */}
          {activeTab === "sucursales" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {detail.por_sucursal.map((s) => (
                <div
                  key={s.bsale_office_id}
                  className="rounded-xl border border-white/5 bg-surface/50 p-4 backdrop-blur-md flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Store className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-fg text-sm">{s.sucursal}</p>
                      <p className="text-xs text-muted">{num(s.tickets)} tickets registrados</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary text-base">{money(s.ventas)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
