import { TimeSeriesChart } from "@/components/charts/time-series-chart";
import { num, money } from "@/lib/format";
import { TrendingUp, DollarSign, PackagePlus } from "lucide-react";

export function SkuHistoryChart({
  points,
}: {
  points: { fecha: string; unds_vendidas: number; monto: number; unds_recibidas: number }[];
}) {
  const totalVendido = points.reduce((s, p) => s + p.unds_vendidas, 0);
  const totalRecibido = points.reduce((s, p) => s + p.unds_recibidas, 0);
  const totalMonto = points.reduce((s, p) => s + p.monto, 0);
  const series = points.map((p) => ({
    fecha: p.fecha,
    vendidas: p.unds_vendidas,
    recibidas: p.unds_recibidas,
  }));
  return (
    <div className="w-full">
      <div className="mb-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex items-center gap-3 rounded-xl border border-border-soft bg-surface-2 p-3 shadow-sm">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Ventas (Unds)</p>
            <p className="font-mono text-sm font-bold text-fg">{num(totalVendido)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border-soft bg-surface-2 p-3 shadow-sm">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Ingresos Totales</p>
            <p className="font-mono text-sm font-bold text-fg">{money(totalMonto)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border-soft bg-surface-2 p-3 shadow-sm">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
            <PackagePlus className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Unidades Recibidas</p>
            <p className="font-mono text-sm font-bold text-fg">{num(totalRecibido)}</p>
          </div>
        </div>
      </div>
      
      <div className="rounded-xl border border-border-soft bg-surface/50 p-4 pt-5 shadow-inner">
        <TimeSeriesChart
          data={series}
          xKey="fecha"
          height={260}
          series={[
            { key: "vendidas", label: "Ventas", color: "#22d3ee" },
            { key: "recibidas", label: "Recepciones", color: "#f97316" },
          ]}
          xTickFormatter={(v) => {
            const d = new Date(String(v) + "T00:00:00Z");
            return d.toLocaleDateString("es-PE", {
              day: "2-digit",
              month: "short",
              timeZone: "UTC",
            });
          }}
          valueFormatter={(v) => num(typeof v === "number" ? v : Number(v))}
        />
      </div>
    </div>
  );
}
