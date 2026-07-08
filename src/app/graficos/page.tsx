"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart4, 
  TrendingUp, 
  PieChart, 
  Target, 
  MapPin, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Layers
} from "lucide-react";
import {
  getSalesByDay,
  getSalesByDepartment,
  getSalesByCategory,
  getSalesByOffice,
  getTicketAnatomy,
  getTopProducts,
} from "@/lib/api";
import { money, moneyCompact, num, dayLabel } from "@/lib/format";
import { DateRangeSelect } from "@/components/ui/date-range-select";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { ErrorState, EmptyState } from "@/components/ui/states";
import { LineChartLoader, BarChartLoader, DonutChartLoader } from "@/components/ui/chart-loaders";
import { useSucursal } from "@/components/sucursal-context";

// Dynamic imports for Recharts to avoid SSR issues
const ComposedChart = dynamic(() => import("@/components/charts/composed-chart").then(mod => mod.ComposedChart), { ssr: false });
const CategoryBarChart = dynamic(() => import("@/components/charts/category-bar-chart").then(mod => mod.CategoryBarChart), { ssr: false });
const DonutChart = dynamic(() => import("@/components/charts/donut-chart").then(mod => mod.DonutChart), { ssr: false });
const RadarChart = dynamic(() => import("@/components/charts/radar-chart").then(mod => mod.RadarChart), { ssr: false });
const TimeSeriesChart = dynamic(() => import("@/components/charts/time-series-chart").then(mod => mod.TimeSeriesChart), { ssr: false });

export default function GraficosPage() {
  const [days, setDays] = useState(30);
  const { officeId } = useSucursal();

  const byDay = useQuery({
    queryKey: ["sales-by-day", days, officeId],
    queryFn: ({ signal }) => getSalesByDay(days, signal, officeId),
  });

  const byDept = useQuery({
    queryKey: ["sales-by-department", days, officeId],
    queryFn: ({ signal }) => getSalesByDepartment(days, signal, officeId),
  });

  const byCategory = useQuery({
    queryKey: ["sales-by-category", days, officeId],
    queryFn: ({ signal }) => getSalesByCategory(days, signal, officeId),
  });

  const byOffice = useQuery({
    queryKey: ["sales-by-office", days],
    queryFn: ({ signal }) => getSalesByOffice(days, signal),
  });

  const ticketAnatomy = useQuery({
    queryKey: ["ticket-anatomy", days, officeId],
    queryFn: ({ signal }) => getTicketAnatomy(days, "previous_period", signal, officeId),
  });

  const topProducts = useQuery({
    queryKey: ["top-products", days, officeId],
    queryFn: ({ signal }) => getTopProducts(days, 15, signal, officeId),
  });

  const anat = ticketAnatomy.data?.delta_pct;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-soft pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg">Analítica Visual</h1>
          <p className="text-sm text-muted">Explora la evolución y distribución de tus ventas en detalle.</p>
        </div>
        <div className="shrink-0 relative z-10">
           <DateRangeSelect value={days} onChange={setDays} />
        </div>
      </div>

      {/* Anatomía del Ticket (KPI Cards instead of Waterfall) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Ventas (Total)", value: anat?.ventas, icon: Target },
          { label: "Tráfico (Tickets)", value: anat?.tickets, icon: Activity },
          { label: "Canasta (Unds/Ticket)", value: anat?.unds_per_ticket, icon: Layers },
          { label: "Precio (Monto/Und)", value: anat?.monto_per_und, icon: BarChart4 },
        ].map((kpi, i) => {
          const val = kpi.value ?? 0;
          const isPos = val >= 0;
          const Icon = isPos ? ArrowUpRight : ArrowDownRight;
          return (
            <Card key={i} className="relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-100 transition-opacity">
                <kpi.icon className="h-5 w-5" />
              </div>
              <CardBody className="p-4">
                <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">{kpi.label}</p>
                {ticketAnatomy.isLoading ? (
                  <div className="h-8 bg-surface-3 animate-pulse rounded w-1/2" />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-fg">
                      {isPos ? "+" : ""}{(val * 100).toFixed(1)}%
                    </span>
                    <Icon className={`h-4 w-4 ${isPos ? "text-success" : "text-danger"}`} />
                  </div>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        
        {/* ROW 1 */}
        <div className="md:col-span-12">
          <Card className="h-full flex flex-col overflow-hidden relative">
            <div className="pointer-events-none absolute top-0 left-0 h-full w-full bg-gradient-to-b from-primary/5 to-transparent opacity-50" />
            <CardHeader
              title={<span className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Evolución de Ventas vs Ticket Promedio</span>}
              subtitle="Analiza la correlación entre el volumen ingresado y el valor promedio de compra"
            />
            <CardBody className="flex-1 relative z-10 pt-0 pb-6 min-h-[350px]">
              {byDay.isLoading ? <LineChartLoader /> : byDay.isError ? <ErrorState error={byDay.error} /> : (
                <ComposedChart
                  data={byDay.data ?? []}
                  xKey="dia"
                  barKey="ventas"
                  lineKey="ticket_promedio"
                  barLabel="Ventas Totales"
                  lineLabel="Ticket Promedio"
                  xTickFormatter={dayLabel}
                  barFormatter={(v) => moneyCompact(v)}
                  lineFormatter={(v) => money(v)}
                  height="100%"
                />
              )}
            </CardBody>
          </Card>
        </div>

        {/* ROW 2 */}
        <div className="md:col-span-6">
          <Card className="h-full flex flex-col">
            <CardHeader
              title={<span className="flex items-center gap-2"><PieChart className="h-5 w-5 text-accent" /> Mix de Departamentos</span>}
              subtitle="Participación de cada departamento en la facturación total"
            />
            <CardBody className="flex-1 flex items-center justify-center pt-0 min-h-[300px]">
              {byDept.isLoading ? <DonutChartLoader /> : byDept.isError ? <ErrorState error={byDept.error} /> : (
                <DonutChart
                  data={(byDept.data ?? []).map((d) => ({
                    name: d.departamento,
                    value: d.ventas,
                  }))}
                  valueFormatter={(v) => money(v)}
                  height={300}
                />
              )}
            </CardBody>
          </Card>
        </div>

        <div className="md:col-span-6">
          <Card className="h-full flex flex-col">
            <CardHeader
              title={<span className="flex items-center gap-2"><MapPin className="h-5 w-5 text-warning" /> Rendimiento por Sucursal</span>}
              subtitle="Balance radial de facturación (S/)"
            />
            <CardBody className="flex-1 pt-0 min-h-[300px]">
              {byOffice.isLoading ? <BarChartLoader /> : byOffice.isError ? <ErrorState error={byOffice.error} /> : (
                <RadarChart
                  data={byOffice.data ?? []}
                  nameKey="sucursal"
                  dataKey="ventas"
                  valueFormatter={(v) => money(v)}
                  height={300}
                />
              )}
            </CardBody>
          </Card>
        </div>

        {/* ROW 3 */}
        <div className="md:col-span-12">
          <Card className="h-full flex flex-col">
            <CardHeader
              title={<span className="flex items-center gap-2"><Layers className="h-5 w-5 text-violet-500" /> Top Categorías</span>}
              subtitle="Las categorías con mayor volumen de ventas"
            />
            <CardBody className="flex-1 pt-0 pb-6 min-h-[400px]">
              {byCategory.isLoading ? <BarChartLoader /> : byCategory.isError ? <ErrorState error={byCategory.error} /> : (
                <CategoryBarChart
                  data={(byCategory.data ?? []).sort((a, b) => b.ventas - a.ventas).slice(0, 15)}
                  categoryKey="categoria"
                  valueKey="ventas"
                  valueLabel="Ventas"
                  colorful
                  xTickFormatter={(v) => moneyCompact(v)}
                  valueFormatter={(v) => money(v)}
                  height={400}
                />
              )}
            </CardBody>
          </Card>
        </div>

        <div className="md:col-span-12">
          <Card className="h-full flex flex-col">
            <CardHeader
              title={<span className="flex items-center gap-2"><Target className="h-5 w-5 text-rose-500" /> Unidades vs Ingresos (Top Productos)</span>}
              subtitle="Desempeño de los productos estrella (Unidades vendidas vs Ingresos generados)"
            />
            <CardBody className="flex-1 pt-0 pb-6 min-h-[400px]">
              {topProducts.isLoading ? <BarChartLoader /> : topProducts.isError ? <ErrorState error={topProducts.error} /> : (
                <ComposedChart
                  data={(topProducts.data ?? []).map(p => ({
                    ...p,
                    productoCorto: p.producto.length > 20 ? p.producto.substring(0, 20) + "..." : p.producto
                  }))}
                  xKey="productoCorto"
                  barKey="ventas"
                  lineKey="unidades"
                  barLabel="Ingresos (S/)"
                  lineLabel="Unidades"
                  xTickFormatter={(v) => v}
                  barFormatter={(v) => moneyCompact(v)}
                  lineFormatter={(v) => num(v)}
                  height={400}
                />
              )}
            </CardBody>
          </Card>
        </div>

      </div>
    </div>
  );
}
