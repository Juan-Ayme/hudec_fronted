"use client";

import { TrendingUp, Layers } from "lucide-react";
import { LoadingState, ErrorState } from "@/components/ui/states";
import { DateRangeSelect } from "@/components/ui/date-range-select";
import { useRentabilidad, type RentabilidadLevel } from "./hooks/useRentabilidad";
import { MarginKpiRow } from "./components/MarginKpiRow";
import { ProfitabilityRanking } from "./components/ProfitabilityRanking";
import { MarginScatterMatrix } from "./components/MarginScatterMatrix";
import { MarginContributionTreemap } from "./components/MarginContributionTreemap";
import { MarginTrendComparison } from "./components/MarginTrendComparison";
import { DetailTable } from "./components/DetailTable";
import { cn } from "@/lib/utils";

const LEVEL_TABS: { value: RentabilidadLevel; label: string }[] = [
  { value: "department", label: "Departamentos" },
  { value: "category", label: "Categorías" },
  { value: "subcategory", label: "Subcategorías" },
];

export function RentabilidadView() {
  const {
    days, setDays,
    level, setLevel,
    rankingQ, matrixQ, evolucionQ,
  } = useRentabilidad();

  if (rankingQ.isError) return <ErrorState error={rankingQ.error} />;
  if (rankingQ.isLoading || !rankingQ.data)
    return <LoadingState label="Analizando rentabilidad…" />;

  const ranking = rankingQ.data;
  const levelItems = ranking.ranking.filter((r) => r.level === level);

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* ── Header Area with Accent ── */}
      <div className="relative z-30 rounded-2xl border border-white/[0.06] p-6">
        <div className="pointer-events-none absolute inset-0 z-0 rounded-2xl bg-gradient-to-b from-primary/10 via-primary/5 to-transparent opacity-50" />
        <div className="pointer-events-none absolute top-0 left-4 right-4 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
        
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 backdrop-blur-md shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]">
              <TrendingUp className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Análisis de Rentabilidad
              </h1>
              <p className="text-sm text-white/50">Métricas de margen, contribución y análisis multidimensional</p>
            </div>
          </div>
          <DateRangeSelect value={days} onChange={setDays} />
        </div>
      </div>

      {/* ── KPIs ── */}
      <section className="px-1">
        <MarginKpiRow
          global={ranking.global}
          // Pass full ranking items for department level calculation
          departments={ranking.ranking.filter((r) => r.level === "department") as any}
          loading={rankingQ.isLoading}
        />
      </section>

      {/* ── Level Tabs ── */}
      <section className="flex flex-col items-center">
        <div className="relative inline-flex items-center justify-center rounded-full bg-white/5 p-1.5 backdrop-blur-md border border-white/10 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.5)]">
          {LEVEL_TABS.map((tab) => {
            const isActive = level === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setLevel(tab.value)}
                className={cn(
                  "relative flex items-center gap-2 rounded-full px-6 py-2 text-sm font-medium transition-all duration-300",
                  isActive ? "text-white" : "text-white/50 hover:text-white/80"
                )}
              >
                {isActive && (
                  <div
                    className="absolute inset-0 rounded-full bg-primary/20 shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)] border border-primary/30"
                    style={{ zIndex: 0 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Layers className={cn("h-4 w-4", isActive ? "text-primary" : "text-white/40")} />
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Analysis Content ── */}
      <div className="flex flex-col gap-8">
        {/* Section: Distribución y Posicionamiento */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-white/90">Posicionamiento</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-2xl p-5 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]">
              <ProfitabilityRanking data={levelItems} />
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-2xl p-5 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]">
              <MarginScatterMatrix
                data={matrixQ.data}
                loading={matrixQ.isLoading}
              />
            </div>
          </div>
        </section>

        {/* Section: Contribución al Margen */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-white/90">Estructura de Contribución</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-2xl p-5 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]">
            <MarginContributionTreemap data={levelItems} />
          </div>
        </section>

        {/* Section: Tendencias */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-white/90">Evolución de Rentabilidad</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-2xl p-5 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]">
            <MarginTrendComparison
              data={evolucionQ.data}
              loading={evolucionQ.isLoading}
            />
          </div>
        </section>

        {/* Section: Detalle */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-white/90">Detalle Analítico</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
          </div>
          <DetailTable items={levelItems as any} level={level} />
        </section>
      </div>
    </div>
  );
}

