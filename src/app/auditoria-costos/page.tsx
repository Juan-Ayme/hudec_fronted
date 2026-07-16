"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CircleDollarSign, AlertTriangle, CheckCircle, Search, Settings2, SlidersHorizontal, ArrowUpDown, XCircle, FileDown, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { KpiStat } from "@/components/ui/kpi-stat";
import { DataTable, Pagination, type Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { getVariantCostsByOffice, exportVariantCostsExcel, biQueryKeys } from "@/lib/bi-api";
import type { VariantCostHealthDetail, VariantCostByOfficeParams } from "@/lib/bi-types";
import { money, pct, num } from "@/lib/format";
import { useSucursal } from "@/components/sucursal-context";

export default function AuditoriaCostosPage() {
  const { officeId } = useSucursal();
  const [isExporting, setIsExporting] = useState(false);

  const [params, setParams] = useState<VariantCostByOfficeParams>({
    days: 90,
    umbral_margen_bajo: 20.0,
    umbral_margen_alto: 70.0,
    umbral_outlier_pct: 50.0,
    umbral_desactualizado_pct: 20.0,
    umbral_ratio_max_min: 2.0,
    solo_problemas: false,
    page: 1,
    page_size: 100,
  });

  const queryParams = { ...params, office_id: officeId };

  const { data, isLoading, error } = useQuery({
    queryKey: biQueryKeys.variantCostsByOffice(queryParams),
    queryFn: ({ signal }) => getVariantCostsByOffice(queryParams, signal),
  });

  const handleParamChange = (key: keyof VariantCostByOfficeParams, value: number | boolean) => {
    // Si cambian los filtros (que no sean la página en sí), regresamos a la primera página.
    setParams((prev) => ({ 
      ...prev, 
      [key]: value,
      ...(key !== "page" ? { page: 1 } : {}) 
    }));
  };

  const handlePaginationChange = (offset: number) => {
    const newPage = Math.floor(offset / (params.page_size || 100)) + 1;
    setParams((prev) => ({ ...prev, page: newPage }));
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await exportVariantCostsExcel(params);
    } catch (err) {
      console.error(err);
      // Aqui podrías mostrar un toast con el error
    } finally {
      setIsExporting(false);
    }
  };

  const columns: Column<VariantCostHealthDetail>[] = [
    {
      key: "sucursal",
      header: "Sucursal",
      render: (row) => <span className="font-medium">{row.sucursal}</span>,
    },
    {
      key: "producto",
      header: "Producto",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-fg">{row.producto}</span>
          <span className="text-[11px] text-muted">SKU: {row.codigo_sku}</span>
        </div>
      ),
    },
    {
      key: "costo_efectivo",
      header: "Costo / Origen",
      render: (row) => (
        <div className="flex flex-col" title={row.tabla_costo}>
          <span>{money(row.costo_efectivo)}</span>
          <span className="text-[11px] text-muted">{row.costo_origen}</span>
        </div>
      ),
      align: "right",
    },
    {
      key: "precio_venta",
      header: "Precio Venta",
      render: (row) => (
        <span title={row.tabla_precio}>{money(row.precio_venta)}</span>
      ),
      align: "right",
    },
    {
      key: "margen_pct",
      header: "Margen",
      render: (row) => {
        const isNegative = row.margen_pct < 0;
        return (
          <div className="flex flex-col items-end">
            <span className={isNegative ? "text-danger font-medium" : ""}>
              {pct(row.margen_pct)}
            </span>
            <span className="text-[11px] text-muted">{money(row.margen_soles)}</span>
          </div>
        );
      },
      align: "right",
    },
    {
      key: "alertas",
      header: "Severidad / Alertas",
      render: (row) => {
        return (
          <div className="flex flex-col gap-1 items-start">
            <Badge tone={row.severidad === "ERROR" ? "danger" : row.severidad === "WARNING" ? "warning" : "success"}>
              {row.severidad}
            </Badge>
            {row.alertas.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {row.alertas.map((a) => (
                  <span key={a} className="text-[10px] bg-surface-2 px-1.5 py-0.5 rounded text-muted whitespace-nowrap">
                    {a.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "impacto_soles",
      header: "Impacto Est.",
      render: (row) => (
        <div className="flex flex-col items-end">
          <span className="font-semibold text-fg">{money(row.impacto_soles)}</span>
          <span className="text-[11px] text-muted">{num(row.uds_vendidas_periodo)} uds vendidas</span>
        </div>
      ),
      align: "right",
    },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start justify-between">
        <PageHeader
          eyebrow="Operaciones"
          title="Auditoría de Costos"
          description="Diagnóstico de salud de costos por sucursal. Identifica problemas de rentabilidad, márgenes negativos y costos desactualizados."
        />
        
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-2 mt-1 px-4 py-2 bg-surface-2 border border-border-soft hover:bg-surface-3 hover:border-border text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? <Loader2 className="h-4 w-4 animate-spin text-muted" /> : <FileDown className="h-4 w-4 text-primary" />}
          {isExporting ? "Exportando..." : "Descargar Excel"}
        </button>
      </div>

      {/* Panel de Filtros */}
      <div className="mb-6 p-4 rounded-xl border border-border-soft bg-surface-2/30">
        <div className="flex items-center gap-2 mb-4">
          <SlidersHorizontal className="h-4 w-4 text-muted" />
          <h3 className="text-sm font-medium text-fg">Parámetros de Auditoría</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted">Días (Ventana de análisis)</label>
            <input
              type="number"
              className="flex h-9 w-full rounded-md border border-border-soft bg-surface px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              value={params.days}
              onChange={(e) => handleParamChange("days", Number(e.target.value))}
              min={7}
              max={365}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted">Margen Mínimo (%)</label>
            <input
              type="number"
              className="flex h-9 w-full rounded-md border border-border-soft bg-surface px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              value={params.umbral_margen_bajo}
              onChange={(e) => handleParamChange("umbral_margen_bajo", Number(e.target.value))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted">Margen Máximo (%)</label>
            <input
              type="number"
              className="flex h-9 w-full rounded-md border border-border-soft bg-surface px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              value={params.umbral_margen_alto}
              onChange={(e) => handleParamChange("umbral_margen_alto", Number(e.target.value))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted">Outlier Avg Diff (%)</label>
            <input
              type="number"
              className="flex h-9 w-full rounded-md border border-border-soft bg-surface px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              value={params.umbral_outlier_pct}
              onChange={(e) => handleParamChange("umbral_outlier_pct", Number(e.target.value))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted">Dif. Costo Últ. Recep (%)</label>
            <input
              type="number"
              className="flex h-9 w-full rounded-md border border-border-soft bg-surface px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              value={params.umbral_desactualizado_pct}
              onChange={(e) => handleParamChange("umbral_desactualizado_pct", Number(e.target.value))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted">Ratio Max/Min Costo</label>
            <input
              type="number"
              className="flex h-9 w-full rounded-md border border-border-soft bg-surface px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              value={params.umbral_ratio_max_min}
              step="0.1"
              onChange={(e) => handleParamChange("umbral_ratio_max_min", Number(e.target.value))}
            />
          </div>
          
          <div className="flex flex-col gap-1.5 md:col-span-2 lg:col-span-2 justify-end pb-1">
            <label className="flex items-center gap-2 text-sm font-medium text-fg cursor-pointer select-none">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border-soft text-primary focus:ring-primary"
                checked={params.solo_problemas}
                onChange={(e) => handleParamChange("solo_problemas", e.target.checked)}
              />
              Mostrar solo problemas (Ocultar OK)
            </label>
          </div>
        </div>
      </div>

      {/* KPIs Summary */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStat
          label="Total Analizado"
          value={data ? num(data.resumen.variantes_analizadas) : "—"}
          sub={`${data ? num(data.resumen.filas_total) : "—"} filas sucursal-producto`}
          icon={Search}
          tone="neutral"
          loading={isLoading}
        />
        <KpiStat
          label="Salud General"
          value={data ? pct(data.resumen.salud.pct_ok) : "—"}
          sub="Variantes sin alertas"
          icon={CheckCircle}
          tone={data ? (data.resumen.salud.pct_ok > 90 ? "success" : data.resumen.salud.pct_ok > 70 ? "warning" : "danger") : "primary"}
          loading={isLoading}
        />
        <KpiStat
          label="Problemas"
          value={data ? num(data.resumen.salud.error + data.resumen.salud.warning) : "—"}
          sub={`${data ? num(data.resumen.salud.error) : "—"} Errores • ${data ? num(data.resumen.salud.warning) : "—"} Advertencias`}
          icon={AlertTriangle}
          tone="warning"
          loading={isLoading}
        />
        <KpiStat
          label="Impacto Potencial"
          value={data ? money(data.resumen.impacto_total_soles) : "—"}
          sub={`Est. últimos ${params.days} días`}
          icon={CircleDollarSign}
          tone="danger"
          loading={isLoading}
        />
      </div>

      {/* Data Table */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-h4 font-semibold text-fg">Detalle de Diagnóstico</h3>
        {data && (
          <span className="text-sm text-muted">{data.nota}</span>
        )}
      </div>

      <DataTable
        columns={columns}
        rows={data?.detalle}
        isLoading={isLoading}
        error={error}
        emptyTitle="Sin datos"
        emptyHint="No se encontraron registros con los filtros actuales."
        zebra
      />

      {data?.paginacion && data.paginacion.total_pages > 1 && (
        <div className="mt-4 flex justify-end">
          <Pagination
            total={data.paginacion.total_items}
            limit={data.paginacion.page_size}
            offset={(data.paginacion.page - 1) * data.paginacion.page_size}
            onChange={handlePaginationChange}
          />
        </div>
      )}
    </div>
  );
}
