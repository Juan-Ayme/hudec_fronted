"use client";

import { useState } from "react";
import {
  Coins,
  Download,
  FileSpreadsheet,
  Landmark,
  Package,
  Percent,
  Receipt,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DateRangeSelect } from "@/components/ui/date-range-select";
import { KpiStat } from "@/components/ui/kpi-stat";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { CategoryBarChart } from "@/components/charts/category-bar-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { TimeSeriesChart } from "@/components/charts/time-series-chart";
import { money, moneyCompact, num, pct } from "@/lib/format";

import { ReporteTable } from "./components/ReporteTable";
import { descargarExcel, useReporteVentas } from "./hooks/useReporteVentas";

/** Panel de vidrio: el contenedor estándar de esta app. */
function Panel({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-2xl p-5 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)] ${className ?? ""}`}
    >
      <h3 className="mb-4 text-sm font-semibold text-white/80">{title}</h3>
      {children}
    </div>
  );
}

export function ReporteVentasView() {
  const { days, setDays, desde, hasta, officeId, reporteQ } = useReporteVentas();
  const [bajando, setBajando] = useState(false);

  const handleDescargar = async () => {
    setBajando(true);
    try {
      await descargarExcel({ desde, hasta, officeId });
      toast.success("Excel descargado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo generar el Excel");
    } finally {
      setBajando(false);
    }
  };

  if (reporteQ.isError) return <ErrorState error={reporteQ.error} />;
  if (reporteQ.isLoading || !reporteQ.data)
    return <LoadingState label="Calculando el reporte de ventas…" />;

  const { meta, totales, departamentos, serie_diaria } = reporteQ.data;

  // Los departamentos ya vienen ordenados por ingresos desde el backend.
  // El gráfico se queda con los 10 primeros: más barras no se leen.
  const topDeps = departamentos.slice(0, 10);
  const donutData = topDeps.map((d) => ({ name: d.departamento, value: d.ingresos }));

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* ── Cabecera ── */}
      <div className="relative z-30 -mx-6 -mt-6 p-6">
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent opacity-50" />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 backdrop-blur-md shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]">
              <FileSpreadsheet className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Reporte de Ventas
              </h1>
              <p className="text-sm text-white/50">
                {meta.sucursal} · {meta.desde} al {meta.hasta} ({meta.dias}{" "}
                {meta.dias === 1 ? "día" : "días"})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <DateRangeSelect value={days} onChange={setDays} maxDays={366} />
            <Button onClick={handleDescargar} loading={bajando} disabled={bajando}>
              <Download className="h-4 w-4" />
              {bajando ? "Generando…" : "Descargar Excel"}
            </Button>
          </div>
        </div>
      </div>

      {/* ── KPIs ──
          Orden deliberado: Ingresos − Costo = Ganancia se lee de corrido, así
          la resta cierra a la vista. Antes el titular mostraba ingresos con
          IGV contra un margen calculado sobre venta neta y no reconciliaba. */}
      <section className="grid gap-4 px-1 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStat
          label="Ingresos"
          value={money(totales.ingresos)}
          sub="IGV incluido"
          icon={Coins}
          tone="primary"
        />
        <KpiStat
          label="Costo de lo vendido"
          value={money(totales.costo)}
          sub="costo neto de proveedor"
          icon={Package}
          tone="neutral"
        />
        <KpiStat
          label="Ganancia"
          value={money(totales.ganancia)}
          sub="ingresos − costo"
          icon={TrendingUp}
          tone="success"
        />
        <KpiStat
          label="Margen"
          value={pct(totales.margen_pct)}
          sub="ganancia / ingresos"
          icon={TrendingUp}
          tone={totales.margen_pct >= 15 ? "success" : "warning"}
        />
        <KpiStat
          label="Markup"
          value={pct(totales.markup_pct)}
          sub="ganancia / costo"
          icon={Percent}
          tone="info"
        />
        <KpiStat
          label="IGV incluido"
          value={money(totales.igv)}
          sub={`venta neta ${moneyCompact(totales.ingresos_netos)}`}
          icon={Landmark}
          tone="neutral"
        />
        <KpiStat
          label="Unidades"
          value={num(totales.unidades)}
          icon={Package}
          tone="info"
        />
        <KpiStat
          label="Tickets"
          value={num(totales.tickets)}
          sub={`promedio ${money(totales.ticket_promedio)}`}
          icon={Receipt}
          tone="violet"
        />
      </section>

      {/* ── Gráficos ── */}
      <section className="grid gap-6 px-1 lg:grid-cols-2">
        <Panel title="Ingresos por departamento">
          <CategoryBarChart
            data={topDeps}
            categoryKey="departamento"
            valueKey="ingresos"
            valueLabel="Ingresos"
            height={320}
            colorful
            xTickFormatter={(v) => moneyCompact(v)}
            valueFormatter={(v) => money(v)}
          />
        </Panel>
        <Panel title="Desglose de los ingresos">
          <DonutChart
            data={donutData}
            height={260}
            valueFormatter={(v) => money(v)}
          />
        </Panel>
      </section>

      <section className="px-1">
        <Panel title="Evolución diaria de la venta">
          <TimeSeriesChart
            data={serie_diaria}
            xKey="fecha"
            series={[{ key: "ingresos", label: "Ingresos" }]}
            height={280}
            yTickFormatter={(v) => moneyCompact(v)}
            valueFormatter={(v) => money(v)}
          />
        </Panel>
      </section>

      {/* ── Detalle jerárquico ── */}
      <section className="flex flex-col gap-4 px-1">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-white/90">Detalle por departamento</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
          <span className="text-xs text-white/40">
            Tocá una fila para abrir sus categorías y productos
          </span>
        </div>
        <ReporteTable departamentos={departamentos} />
        <p className="px-1 text-xs leading-relaxed text-white/35">
          Se excluyen notas de crédito y líneas de regalo. El costo es cantidad ×
          costo efectivo de la variante en la sucursal de la venta.{" "}
          <span className="text-white/50">
            La ganancia es ingresos <strong>con IGV</strong> menos costo
          </span>
          , porque el IGV cobrado se queda en la empresa y los proveedores no
          facturan IGV. Por eso este margen es más alto que el de las vistas de
          Rentabilidad y Diagnóstico, que usan el margen contable sobre venta
          neta.
        </p>
      </section>
    </div>
  );
}
