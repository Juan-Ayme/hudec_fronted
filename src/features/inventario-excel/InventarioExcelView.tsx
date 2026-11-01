"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Download,
  FileSpreadsheet,
  Search,
  RotateCcw,
  Store,
  Filter,
  Package,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select, Field } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { TaxonomyFilter } from "@/components/ui/taxonomy-filter";
import { getStockValuation } from "@/lib/api";
import { useInventarioExcel } from "./hooks/useInventarioExcel";
import { BulkDeactivateTab } from "./components/BulkDeactivateTab";
import { cn } from "@/lib/utils";

export function InventarioExcelView() {
  const {
    filters,
    setFilter,
    download,
    isDownloading,
    lastResult,
    error,
    resetFilters,
  } = useInventarioExcel();

  const [activeTab, setActiveTab] = useState<"excel" | "deactivate">("excel");
  const [searchInput, setSearchInput] = useState("");

  const handleResetFilters = () => {
    resetFilters();
    setSearchInput("");
  };

  // Offices from stock valuation (reuses existing query)
  const valuation = useQuery({
    queryKey: ["stock-valuation"],
    queryFn: ({ signal }) => getStockValuation(signal),
    staleTime: 10 * 60_000,
  });

  const offices = valuation.data?.por_sucursal ?? [];

  // Derive display info
  const selectedOfficeName = filters.office_id
    ? offices.find((o) => o.bsale_office_id === filters.office_id)?.sucursal ?? "Sucursal"
    : null;

  const hasActiveFilters =
    !!filters.office_id ||
    filters.only_with_stock ||
    filters.include_inactive ||
    !!filters.department ||
    !!filters.category ||
    !!filters.subcategory ||
    !!filters.q;

  const handleSearch = () => {
    setFilter("q", searchInput.trim());
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleOfficeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFilter("office_id", val ? Number(val) : null);
  };

  return (
    <div className="space-y-6 relative">
      {/* ── Ambient background ── */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-32 right-1/4 h-[420px] w-[420px] rounded-full bg-primary/[0.06] blur-[120px] animate-[pulse_9s_ease-in-out_infinite]" />
        <div className="absolute top-1/2 -left-20 h-[350px] w-[350px] rounded-full bg-success/[0.05] blur-[120px] animate-[pulse_11s_ease-in-out_infinite_2s]" />
        <div className="absolute bottom-10 right-10 h-[300px] w-[300px] rounded-full bg-violet/[0.04] blur-[120px] animate-[pulse_13s_ease-in-out_infinite_1s]" />
      </div>

      <div className="relative z-10">
        <PageHeader
          title={
            activeTab === "excel"
              ? "Exportar Inventario"
              : "Depuración Masiva de Productos"
          }
          eyebrow="Stock & Catálogo"
          description={
            activeTab === "excel"
              ? "Genera y descarga un reporte Excel consolidado de todo el inventario con formato Matriz KAWII y filtros personalizados."
              : "Simula y desactiva variantes obsoletas en BSale y base de datos con protección de stock."
          }
          actions={
            activeTab === "excel" ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                disabled={!hasActiveFilters}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Limpiar filtros
              </Button>
            ) : undefined
          }
        />

        {/* Tab switcher */}
        <div className="mb-6">
          <Tabs
            items={[
              {
                id: "excel",
                label: "Exportar Inventario (.xlsx)",
                icon: FileSpreadsheet,
              },
              {
                id: "deactivate",
                label: "Depuración Masiva por SKU",
                icon: Zap,
              },
            ]}
            value={activeTab}
            onChange={setActiveTab}
          />
        </div>

        {activeTab === "deactivate" ? (
          <BulkDeactivateTab />
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* ── LEFT: Filters ── */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-5">
            {/* Sucursal filter */}
            <Card>
              <CardHeader
                eyebrow="Sucursal"
                title={
                  <span className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-primary" />
                    Alcance del reporte
                  </span>
                }
              />
              <CardBody>
                <Field label="Sucursal">
                  <Select
                    value={filters.office_id?.toString() ?? ""}
                    onChange={handleOfficeChange}
                    disabled={valuation.isLoading}
                  >
                    <option value="">Todas las tiendas (consolidado)</option>
                    {offices.map((o) => (
                      <option key={o.bsale_office_id} value={o.bsale_office_id}>
                        {o.sucursal}
                      </option>
                    ))}
                  </Select>
                </Field>

                {filters.office_id && (
                  <div className="mt-3 flex items-center gap-2 text-caption text-primary animate-fade-in">
                    <ArrowRight className="h-3 w-3" />
                    <span>
                      Reporte enfocado en{" "}
                      <strong>{selectedOfficeName}</strong>
                    </span>
                  </div>
                )}
                {!filters.office_id && (
                  <p className="mt-3 text-caption text-faint">
                    Incluirá columnas de stock por cada tienda activa + totales.
                  </p>
                )}
              </CardBody>
            </Card>

            {/* Taxonomy filters */}
            <Card>
              <CardHeader
                eyebrow="Taxonomía"
                title={
                  <span className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-accent" />
                    Filtros por categoría
                  </span>
                }
              />
              <CardBody className="space-y-3">
                <TaxonomyFilter
                  departamento={filters.department ?? ""}
                  onChangeDepartamento={(v) => {
                    setFilter("department", v);
                    setFilter("category", "");
                    setFilter("subcategory", "");
                  }}
                  categoria={filters.category ?? ""}
                  onChangeCategoria={(v) => {
                    setFilter("category", v);
                    setFilter("subcategory", "");
                  }}
                  subcategoria={filters.subcategory ?? ""}
                  onChangeSubcategoria={(v) => setFilter("subcategory", v)}
                />
              </CardBody>
            </Card>

            {/* Toggles */}
            <Card>
              <CardHeader
                eyebrow="Opciones"
                title={
                  <span className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-warning" />
                    Alcance del catálogo
                  </span>
                }
              />
              <CardBody className="space-y-4">
                <ToggleRow
                  id="only-with-stock"
                  label="Solo con stock disponible"
                  hint="Excluye productos con stock 0 en todas las tiendas."
                  checked={filters.only_with_stock ?? false}
                  onChange={(v) => setFilter("only_with_stock", v)}
                />
                <div className="border-t border-white/[0.04]" />
                <ToggleRow
                  id="include-inactive"
                  label="Incluir inactivos"
                  hint="Incluye productos/variantes descontinuadas o inactivas."
                  checked={filters.include_inactive ?? false}
                  onChange={(v) => setFilter("include_inactive", v)}
                />
              </CardBody>
            </Card>

            {/* Search */}
            <Card>
              <CardHeader
                eyebrow="Búsqueda"
                title={
                  <span className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-info" />
                    Buscar producto
                  </span>
                }
              />
              <CardBody>
                <div className="flex gap-2">
                  <Input
                    placeholder="SKU, nombre o código de barras…"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    className="flex-1"
                  />
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={handleSearch}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                {filters.q && (
                  <div className="mt-2 flex items-center gap-2 text-caption text-muted animate-fade-in">
                    <span>
                      Buscando: <strong className="text-fg">{filters.q}</strong>
                    </span>
                    <button
                      className="text-faint hover:text-fg transition-colors"
                      onClick={() => {
                        setFilter("q", "");
                        setSearchInput("");
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* ── RIGHT: Download Panel ── */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-5">
            {/* Main download card */}
            <Card className="overflow-hidden">
              <div className="relative">
                {/* Hero gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.08] via-transparent to-success/[0.06]" />
                <div className="relative p-8 sm:p-10 text-center">
                  {/* Animated icon */}
                  <div className="mx-auto mb-6 relative">
                    <div className="h-20 w-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-white/[0.08] flex items-center justify-center shadow-[0_8px_32px_-8px_rgba(59,130,246,0.3)]">
                      <FileSpreadsheet className="h-9 w-9 text-primary" />
                    </div>
                    <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-success/20 border border-success/30 flex items-center justify-center">
                      <Sparkles className="h-3 w-3 text-success" />
                    </div>
                  </div>

                  <h3 className="text-h2 font-heading font-semibold text-fg mb-2">
                    Inventario Consolidado
                  </h3>
                  <p className="text-body text-muted max-w-md mx-auto mb-8">
                    Genera un archivo Excel (.xlsx) con el catálogo completo,
                    niveles de stock por sucursal y toda la información del producto.
                  </p>

                  {/* Active filters summary */}
                  {hasActiveFilters && (
                    <div className="mb-6 animate-fade-in">
                      <div className="inline-flex flex-wrap items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                        <Filter className="h-3.5 w-3.5 text-muted shrink-0" />
                        {filters.office_id && (
                          <FilterPill label={selectedOfficeName ?? "Sucursal"} />
                        )}
                        {filters.department && (
                          <FilterPill label={filters.department} />
                        )}
                        {filters.category && (
                          <FilterPill label={filters.category} />
                        )}
                        {filters.subcategory && (
                          <FilterPill label={filters.subcategory} />
                        )}
                        {filters.only_with_stock && (
                          <FilterPill label="Con stock" />
                        )}
                        {filters.include_inactive && (
                          <FilterPill label="+ Inactivos" />
                        )}
                        {filters.q && (
                          <FilterPill label={`"${filters.q}"`} />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Download button */}
                  <Button
                    variant="primary"
                    size="md"
                    loading={isDownloading}
                    onClick={download}
                    className="px-8 py-3 text-body shadow-[0_4px_24px_-4px_rgba(59,130,246,0.5)] hover:shadow-[0_8px_32px_-4px_rgba(59,130,246,0.6)]"
                  >
                    <Download className="h-4.5 w-4.5" />
                    {isDownloading ? "Generando reporte…" : "Descargar Excel"}
                  </Button>

                  {!hasActiveFilters && (
                    <p className="mt-4 text-caption text-faint">
                      Sin filtros: se exporta el catálogo completo de todas las tiendas.
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* Success result */}
            {lastResult && !error && (
              <Card className="animate-fade-in-up border-success/20">
                <CardBody>
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="text-body font-semibold text-fg">
                        Descarga completada
                      </p>
                      <p className="text-caption text-muted mt-1">
                        Archivo:{" "}
                        <span className="font-mono text-fg">
                          {lastResult.filename}
                        </span>
                      </p>
                      <p className="text-caption text-muted">
                        Total de productos exportados:{" "}
                        <strong className="text-success">
                          {lastResult.totalRows.toLocaleString()}
                        </strong>
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Error */}
            {error && (
              <Card className="animate-fade-in-up border-danger/20">
                <CardBody>
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-danger/10 border border-danger/20 flex items-center justify-center shrink-0">
                      <AlertCircle className="h-5 w-5 text-danger" />
                    </div>
                    <div>
                      <p className="text-body font-semibold text-fg">
                        Error al generar el reporte
                      </p>
                      <p className="text-caption text-danger/80 mt-1">
                        {error}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Info cards row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InfoCard
                icon={<FileSpreadsheet className="h-4 w-4 text-primary" />}
                title="Formato"
                value=".xlsx"
                subtitle="Compatible con Excel, Google Sheets"
              />
              <InfoCard
                icon={<Store className="h-4 w-4 text-accent" />}
                title="Sucursales"
                value={
                  filters.office_id
                    ? "1"
                    : offices.length > 0
                      ? String(offices.length)
                      : "—"
                }
                subtitle={
                  filters.office_id
                    ? selectedOfficeName ?? "Seleccionada"
                    : "Columnas de stock por tienda"
                }
              />
              <InfoCard
                icon={<Package className="h-4 w-4 text-warning" />}
                title="Alcance"
                value={
                  filters.only_with_stock ? "Con stock" : "Completo"
                }
                subtitle={
                  filters.include_inactive
                    ? "Incluyendo inactivos"
                    : "Solo productos activos"
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);
}

/* ──────────────── Sub-components ──────────────── */

function ToggleRow({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex items-start gap-3 cursor-pointer group">
      <div className="relative mt-0.5 shrink-0">
        <input
          id={id}
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div
          className={cn(
            "h-5 w-9 rounded-full transition-all duration-300",
            "border border-white/10",
            checked
              ? "bg-primary shadow-[0_0_12px_rgba(59,130,246,0.3)]"
              : "bg-surface-3",
          )}
        />
        <div
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-300",
            checked ? "left-[18px]" : "left-0.5",
          )}
        />
      </div>
      <div>
        <p className="text-body text-fg font-medium group-hover:text-primary transition-colors">
          {label}
        </p>
        <p className="text-caption text-faint">{hint}</p>
      </div>
    </label>
  );
}

function FilterPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-caption text-primary font-medium border border-primary/20">
      {label}
    </span>
  );
}

function InfoCard({
  icon,
  title,
  value,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <Card>
      <CardBody className="text-center py-5">
        <div className="flex justify-center mb-2">{icon}</div>
        <p className="text-caption text-faint uppercase tracking-wide font-semibold">
          {title}
        </p>
        <p className="text-h2 font-heading font-bold text-fg mt-1">{value}</p>
        <p className="text-caption text-muted mt-1">{subtitle}</p>
      </CardBody>
    </Card>
  );
}
