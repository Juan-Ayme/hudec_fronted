"use client";

import { useState } from "react";
import { Download, FileJson, Flame, PackageX, ShoppingCart, Snowflake, TrendingUp, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KpiStat } from "@/components/ui/kpi-stat";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { downloadExcelFile } from "@/lib/api";
import { money, moneyCompact, pct } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useBIQuery } from "@/features/bi/shared";
import { useSucursal } from "@/components/sucursal-context";
import {
  descargarJson,
  getInformeSurtido,
  getPeriodos,
  informeSurtidoExcelUrl,
  informesQueryKeys,
  surtidoQueryKey,
  type EstadoLote,
  type InformeSurtido,
  type PeriodosDisponibles,
  type SkuSurtido,
} from "@/lib/informes-api";

/**
 * Surtido: en qué escalón de precio gana dinero cada subcategoría, qué lote se
 * vende y cuál congela capital. HOY decide (comprar, liquidar, ajustar surtido,
 * costo subió); PERIODO evalúa contra el mismo periodo del año pasado.
 */

const ESTADO: Record<EstadoLote, { label: string; color: string }> = {
  estrella: { label: "Estrella", color: "bg-emerald-500" },
  normal: { label: "Normal", color: "bg-sky-500" },
  lento: { label: "Lento", color: "bg-amber-500" },
  estancado: { label: "Estancado", color: "bg-rose-500" },
  recien: { label: "Recién llegado", color: "bg-violet-400" },
  agotado: { label: "Agotado", color: "bg-white/20" },
};

const chip = (activo: boolean) =>
  cn("rounded-full border px-3.5 py-1.5 text-sm transition-colors",
    activo ? "border-primary/50 bg-primary/15 text-fg" : "border-white/10 bg-white/[0.03] text-muted hover:text-fg");

export function SurtidoSection() {
  const { officeId } = useSucursal();
  const periodos = useBIQuery<PeriodosDisponibles>({
    queryKey: informesQueryKeys.periodos(),
    queryFn: ({ signal }) => getPeriodos(signal),
  });
  const [rango, setRango] = useState<{ desde: string; hasta: string; nombre: string } | null>(null);
  const params = { desde: rango?.desde, hasta: rango?.hasta, officeId };
  const q = useBIQuery<InformeSurtido>({
    queryKey: surtidoQueryKey(params),
    queryFn: ({ signal }) => getInformeSurtido(params, signal),
  });
  const d = q.data;
  const meses = periodos.data?.meses ?? [];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button className={chip(!rango)} onClick={() => setRango(null)}>
          <Flame className="mr-1 inline h-3.5 w-3.5 text-primary" /> Hoy <span className="text-xs text-faint">· decidir</span>
        </button>
        <select
          aria-label="Evaluar un mes"
          value={rango && meses.some((m) => m.desde === rango.desde) ? rango.desde : ""}
          onChange={(e) => {
            const m = meses.find((x) => x.desde === e.target.value);
            if (m) setRango({ desde: m.desde, hasta: m.hasta, nombre: m.nombre });
          }}
          className={cn(chip(!!rango), "bg-transparent pr-2 [&>option]:bg-bg")}
        >
          <option value="" disabled>Evaluar un mes vs año pasado…</option>
          {meses.map((m) => <option key={m.clave} value={m.desde}>{m.nombre}</option>)}
        </select>
        {d && (
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" className="gap-1.5 rounded-full"
              onClick={() => downloadExcelFile(informeSurtidoExcelUrl(params),
                `Surtido_${d.meta.ventana.desde}_a_${d.meta.ventana.hasta}.xlsx`).catch(() => { /* downloadExcelFile ya avisó */ })}>
              <Download className="h-4 w-4" /> Excel
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 rounded-full"
              onClick={() => descargarJson(d, `Surtido_${d.meta.ventana.desde}_a_${d.meta.ventana.hasta}.json`)}>
              <FileJson className="h-4 w-4" /> JSON
            </Button>
          </div>
        )}
      </div>

      {q.isError ? (
        <ErrorState error={q.error} />
      ) : !d ? (
        <LoadingState label="Analizando surtido (lotes, bandas de precio, ABC)… puede tardar unos segundos" />
      ) : (
        <SurtidoPanel d={d} />
      )}
    </div>
  );
}

function SurtidoPanel({ d }: { d: InformeSurtido }) {
  const k = d.kpis;
  const v = d.meta.ventana;
  const comp = d.comparacion_ano_pasado;
  const vivos = (["estrella", "normal", "lento", "estancado", "recien"] as EstadoLote[]);
  const totalVivos = Math.max(1, vivos.reduce((s, e) => s + (k.lotes[e] ?? 0), 0));
  const bandas = Object.entries(k.por_banda);
  const maxBanda = Math.max(1, ...bandas.map(([, x]) => x));

  return (
    <div className="space-y-5">
      <Card className="border-l-4 border-l-primary p-4">
        <p className="text-xs uppercase tracking-wider text-muted">
          <span className="mr-1.5 rounded bg-primary/15 px-1.5 py-0.5 font-semibold normal-case text-primary">
            {d.meta.sucursal ?? "Todas las tiendas"}
          </span>
          {d.meta.modo === "hoy" ? "Hoy · últimos 30 días" : "Periodo"} · {v.desde} → {v.hasta}
        </p>
        <p className="mt-1 text-base font-semibold text-fg">{d.resumen[1] ?? d.resumen[0]}</p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiStat label="Ganancia" value={money(k.ganancia)} sub={`Markup ${pct(k.markup_pct)} · GMROI ${k.gmroi ?? "—"}`}
          icon={Wallet} tone="success" />
        {comp ? (
          <KpiStat label="Vs. año pasado" icon={TrendingUp}
            value={comp.kpis.ganancia_vs_ano_pasado_pct == null ? "—"
              : `${comp.kpis.ganancia_vs_ano_pasado_pct > 0 ? "+" : ""}${comp.kpis.ganancia_vs_ano_pasado_pct}%`}
            sub={`Ganancia, mismas tiendas · GMROI ${comp.kpis.actual.gmroi ?? "—"} vs ${comp.kpis.ano_pasado.gmroi ?? "—"}`}
            tone={(comp.kpis.ganancia_vs_ano_pasado_pct ?? 0) < 0 ? "danger" : "success"} />
        ) : (
          <KpiStat label="Se pierde por quiebre" value={`${money(k.lucro_cesante_dia)}/día`}
            sub={`${k.urgencia_compra} productos A/B agotados o por agotarse`} icon={ShoppingCart} tone="danger" />
        )}
        <KpiStat label="Capital congelado" value={money(k.capital_congelado)}
          sub={`De ${money(k.capital)} en stock a costo (clases C y Z)`} icon={Snowflake} tone="warning" />
        <KpiStat label="Para liquidar" value={money(k.capital_a_liquidar)}
          sub={`${k.liquidar} productos casi sin salida`} icon={PackageX} tone="primary" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-4">
          <p className="text-sm font-semibold text-fg">Estado de los lotes con stock</p>
          <p className="mb-3 text-xs text-muted">
            En cuántos días se vendería cada lote, comparado con su subcategoría
          </p>
          <div className="flex h-6 overflow-hidden rounded-md">
            {vivos.map((e) => (
              <div key={e} className={ESTADO[e].color} title={`${ESTADO[e].label}: ${k.lotes[e]}`}
                style={{ width: `${(100 * (k.lotes[e] ?? 0)) / totalVivos}%` }} />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            {vivos.map((e) => (
              <span key={e} className="flex items-center gap-1.5">
                <i className={cn("inline-block h-2.5 w-2.5 rounded-sm", ESTADO[e].color)} />
                {ESTADO[e].label} <b className="text-fg">{k.lotes[e] ?? 0}</b>
              </span>
            ))}
          </div>
          <p className="mb-2 mt-4 text-sm font-semibold text-fg">Venta por banda de precio</p>
          <div className="space-y-2">
            {bandas.map(([b, x]) => (
              <div key={b} className="grid grid-cols-[6rem_1fr_5rem] items-center gap-2 text-sm">
                <span className="text-muted">{b}</span>
                <div className="h-3 rounded bg-white/[0.04]">
                  <div className="h-full rounded bg-primary" style={{ width: `${(100 * x) / maxBanda}%` }} />
                </div>
                <span className="text-right font-mono text-xs text-fg">{moneyCompact(x)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-sm font-semibold text-fg">1 · Comprar ya</p>
          <p className="mb-3 text-xs text-muted">
            Clase A/B agotados o con stock para menos de {d.meta.lead_time_dias} días · ganancia que se pierde por día
          </p>
          <ListaSkus filas={d.urgencia_compra.slice(0, 7)} valor={(s) => `${money(s.lucro_cesante_dia)}/día`}
            detalle={(s) =>
              s.trasladar
                ? `comprar ${s.comprar_30d ?? s.pedir_30d - s.trasladar} u · trasladar ${s.trasladar} del almacén`
                : `pedir ${s.pedir_30d} u` + (s.stock_almacen > 0 ? ` · ${s.stock_almacen} en almacén` : "")} />
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-4">
          <p className="text-sm font-semibold text-fg">2 · Liquidar (remate / packs)</p>
          <p className="mb-3 text-xs text-muted">Clases C y Z casi sin salida · capital congelado a costo</p>
          <ListaSkus filas={d.liquidar.slice(0, 7)} valor={(s) => money(s.capital_congelado)}
            detalle={(s) => `${s.stock} u · sell-through ${pct(s.sell_through_pct, 0)}` +
              (s.vida_proyectada_dias ? ` · se vendería en ${s.vida_proyectada_dias} días` : " · sin venta")} />
        </Card>
        <Card className="p-4">
          <p className="text-sm font-semibold text-fg">3 · No volver a importar en esta banda</p>
          <p className="mb-3 text-xs text-muted">Subcategorías que sí rotan, con un escalón de precio que no se mueve</p>
          {d.ajuste_surtido.length ? (
            <div className="divide-y divide-white/5">
              {d.ajuste_surtido.slice(0, 7).map((b) => (
                <div key={`${b.subcategoria}-${b.banda}`} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate text-fg">{b.subcategoria} <span className="text-faint">· {b.banda}</span></p>
                    <p className="text-xs text-faint">{b.motivo} · {b.skus} productos</p>
                  </div>
                  <span className="shrink-0 font-mono text-xs text-warning">{money(b.capital)}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted">Ninguna banda estancada.</p>}
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-4">
          <p className="text-sm font-semibold text-fg">4 · El costo subió</p>
          <p className="mb-3 text-xs text-muted">Costo más de 10% sobre el más bajo del {d.meta.modo === "hoy" ? "año" : "periodo"} · markup antes → ahora</p>
          {d.costo_subio.length ? (
            <div className="divide-y divide-white/5">
              {d.costo_subio.slice(0, 7).map((c) => (
                <div key={c.sku} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate text-fg" title={c.nombre}>{c.nombre}</p>
                    <p className="text-xs text-faint">
                      costo {money(c.costo_min)} → {money(c.costo_actual)} · markup {pct(c.markup_costo_min_pct, 0)} → {pct(c.markup_actual_pct, 0)}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-xs text-danger">−{money(c.ganancia_perdida)}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted">Ningún producto subió de costo más de 10%.</p>}
        </Card>
        <Card className="p-4">
          <p className="text-sm font-semibold text-fg">En pocas palabras</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-muted">
            {d.resumen.map((r) => <li key={r}>{r}</li>)}
            {d.meta.alertas.map((a) => <li key={a} className="text-warning">{a}</li>)}
          </ul>
          <p className="mt-3 text-xs text-faint">Matriz completa subcategoría × banda y todos los productos en el Excel.</p>
        </Card>
      </div>
    </div>
  );
}

function ListaSkus({ filas, valor, detalle }: {
  filas: SkuSurtido[]; valor: (s: SkuSurtido) => string; detalle: (s: SkuSurtido) => string;
}) {
  if (!filas.length) return <p className="text-sm text-muted">Nada en esta lista.</p>;
  return (
    <div className="divide-y divide-white/5">
      {filas.map((s) => (
        <div key={s.sku} className="flex items-center justify-between gap-3 py-2 text-sm">
          <div className="min-w-0">
            <p className="truncate text-fg" title={s.nombre}>{s.producto}</p>
            <p className="text-xs text-faint">{s.sku} · {s.banda} · {detalle(s)}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="rounded border border-white/10 px-1.5 py-0.5 text-[0.65rem] font-semibold text-muted">
              {s.abc_ganancia}
            </span>
            <span className={cn("rounded px-1.5 py-0.5 text-[0.65rem] font-semibold text-white", ESTADO[s.estado_vida].color)}>
              {ESTADO[s.estado_vida].label}
            </span>
            <span className="font-mono text-xs text-fg">{valor(s)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
