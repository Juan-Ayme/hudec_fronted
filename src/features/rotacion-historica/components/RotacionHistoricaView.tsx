"use client";

/**
 * Rotación Histórica — Productos vendidos en una ventana arbitraria.
 *
 * Responde "¿qué se vendió más en 2024?", "Top productos del Q4", "Alta
 * rotación en marzo-mayo del año pasado", etc.
 *
 * Backend: GET /analytics/rotacion-historica?from&to&office_id
 * SQL:     04h_rotacion_historica.sql (variante PARAMETRIZABLE del 04b)
 *
 * IMPORTANTE: la clasificación NO reusa las 38 reglas del 04b (dependen del
 * presente: stock actual, días sin venta vs HOY, etc.). Usa una cascada
 * adaptada para retrospectiva histórica: Pareto ABC + frecuencia + tendencia
 * intra-ventana.
 */

import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/states";
import { useRotacionHistorica } from "../hooks/useRotacionHistorica";
import { RotacionHistoricaSkeleton } from "./RotacionHistoricaSkeleton";
import { PeriodSelector } from "./PeriodSelector";
import { RotacionKpis } from "./RotacionKpis";
import { TaxonomyPanel } from "./TaxonomyPanel";
import { ClasificacionSummary } from "./ClasificacionSummary";
import { CatalogoHistorico } from "./CatalogoHistorico";

export function RotacionHistoricaView() {
  const {
    sucursalName,
    presetId,
    setPresetId,
    customRange,
    setCustomRange,
    paretoFilter,
    setParetoFilter,
    taxFilter,
    setTaxFilter,
    search,
    setSearch,
    range,
    query,
    tree,
    filteredSkus,
    handleSelectDept,
    handleSelectCat,
    handleSelectSubcat,
    hasFilter,
    filterBreadcrumbs,
  } = useRotacionHistorica();

  if (query.isLoading) {
    return <RotacionHistoricaSkeleton sucursalName={sucursalName} />;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Reportes · Análisis retrospectivo"
        title="Rotación Histórica"
        description={
          sucursalName
            ? `Productos vendidos en la ventana seleccionada — ${sucursalName}`
            : "Productos vendidos en la ventana seleccionada (consolidado de todas las tiendas)"
        }
      />

      {/* ───────────── Selector de ventana ───────────── */}
      <PeriodSelector
        presetId={presetId}
        setPresetId={setPresetId}
        customRange={customRange}
        setCustomRange={setCustomRange}
        range={range}
        meta={query.data?.meta}
      />

      {query.isError ? (
        <ErrorState error={query.error} />
      ) : (
        <>
          {/* ───────────── KPIs ───────────── */}
          <RotacionKpis data={query.data} loading={query.isLoading} />

          {/* ───────────── Layout principal ───────────── */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
            <aside className="space-y-4">
              {/* ── Taxonomy drill-down ── */}
              <TaxonomyPanel
                tree={tree}
                taxFilter={taxFilter}
                setTaxFilter={setTaxFilter}
                hasFilter={hasFilter}
                filterBreadcrumbs={filterBreadcrumbs}
                skusConVenta={query.data?.kpis.skus_con_venta}
                loading={query.isLoading}
                onSelectDept={handleSelectDept}
                onSelectCat={handleSelectCat}
                onSelectSubcat={handleSelectSubcat}
              />

              {/* ── Clasificación summary ── */}
              <ClasificacionSummary
                porClasificacion={query.data?.por_clasificacion}
                loading={query.isLoading}
              />
            </aside>

            <main>
              <CatalogoHistorico
                data={query.data}
                filteredSkus={filteredSkus}
                hasFilter={hasFilter}
                taxFilter={taxFilter}
                setTaxFilter={setTaxFilter}
                search={search}
                setSearch={setSearch}
                paretoFilter={paretoFilter}
                setParetoFilter={setParetoFilter}
                loading={query.isLoading}
              />
            </main>
          </div>
        </>
      )}
    </div>
  );
}
