"use client";

import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowUpRight, Download, FileJson, FileText, Sparkles, TrendingUp, Users, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KpiStat } from "@/components/ui/kpi-stat";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { AXIS_PROPS, ChartTooltip, GRID_PROPS, useMounted } from "@/components/charts/common";
import { downloadExcelFile } from "@/lib/api";
import { money, moneyCompact, pct } from "@/lib/format";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useBIQuery } from "@/features/bi/shared";
import { useSucursal } from "@/components/sucursal-context";
import {
  abrirAnalisisIlustrado,
  abrirInformePeriodoPdf,
  descargarJson,
  getInformePeriodo,
  getPeriodos,
  informePeriodoExcelUrl,
  informesQueryKeys,
  type CategoriaPeriodo,
  type InformePeriodo,
  type PeriodoItem,
  type PeriodosDisponibles,
} from "@/lib/informes-api";

/**
 * Informe por PERIODO: el sistema sugiere cuál mirar hoy (lunes → semana
 * pasada; días 1-5 → cierre del mes; resto → mes en curso), con atajos, un
 * mes cualquiera o fechas libres. Compara contra el año pasado (mismas
 * tiendas) y contra el periodo anterior de igual largo.
 */

const chip = (activo: boolean) =>
  cn(
    "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
    activo ? "border-primary/50 bg-primary/15 text-fg" : "border-white/10 bg-white/[0.03] text-muted hover:text-fg",
  );

const signo = (v: number | null | undefined) => (v == null ? "—" : `${v > 0 ? "+" : ""}${v.toFixed(1)}%`);

export function PeriodoSection() {
  const periodos = useBIQuery<PeriodosDisponibles>({
    queryKey: informesQueryKeys.periodos(),
    queryFn: ({ signal }) => getPeriodos(signal),
  });
  const [elegido, setElegido] = useState<PeriodoItem | null>(null);
  const [rango, setRango] = useState({ desde: "", hasta: "" });
  // Sin elección del usuario, el periodo que recomienda el sistema.
  const sel = elegido ?? periodos.data?.sugerido ?? null;
  // Sucursal del selector global (menú del usuario): null = todas las tiendas.
  const { officeId } = useSucursal();
  const params = sel ? { desde: sel.desde, hasta: sel.hasta, nombre: sel.nombre, officeId } : null;

  const informe = useBIQuery<InformePeriodo>({
    queryKey: informesQueryKeys.periodo(sel?.desde ?? "", sel?.hasta ?? "", officeId),
    queryFn: ({ signal }) => getInformePeriodo(params!, signal),
    enabled: !!params,
  });
  const [abriendo, setAbriendo] = useState<"pdf" | "analisis" | null>(null);
  const verPdf = async (tipo: "pdf" | "analisis" = "pdf") => {
    if (!params) return;
    setAbriendo(tipo);
    try {
      await (tipo === "analisis" ? abrirAnalisisIlustrado(params) : abrirInformePeriodoPdf(params));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo abrir el informe");
    } finally {
      setAbriendo(null);
    }
  };

  const p = periodos.data;
  const esAuto = elegido === null;
  const mesElegido = p?.meses.find((m) => elegido && m.desde === elegido.desde && m.hasta === elegido.hasta);
  const d = informe.data;

  return (
    <div>
      {/* Selector: automático · atajos · mes · fechas */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {p && (
          <button onClick={() => setElegido(null)} className={chip(esAuto)} title={p.sugerido.motivo}>
            <Sparkles className="mr-1 inline h-3.5 w-3.5 text-primary" />
            Automático <span className="ml-1 text-xs text-faint">· {p.sugerido.nombre}</span>
          </button>
        )}
        {p?.atajos.map((a) => (
          <button key={a.clave} onClick={() => setElegido(a)}
                  className={chip(!esAuto && elegido?.clave === a.clave)}>
            {a.nombre}
          </button>
        ))}
        {p && (
          <select
            aria-label="Elegir mes"
            value={mesElegido?.clave ?? ""}
            onChange={(e) => {
              const m = p.meses.find((x) => x.clave === e.target.value);
              if (m) setElegido(m);
            }}
            className={cn(chip(!!mesElegido), "bg-transparent pr-2 [&>option]:bg-bg")}
          >
            <option value="" disabled>Elegir mes…</option>
            {p.meses.map((m) => <option key={m.clave} value={m.clave}>{m.nombre}</option>)}
          </select>
        )}
      </div>
      {p && (
        <form
          className="mb-5 flex flex-wrap items-center gap-2 text-sm text-muted"
          onSubmit={(e) => {
            e.preventDefault();
            if (!rango.desde || !rango.hasta) return;
            const [a, b] = rango.desde <= rango.hasta ? [rango.desde, rango.hasta] : [rango.hasta, rango.desde];
            setElegido({ clave: "rango", nombre: `${a} a ${b}`, desde: a, hasta: b });
          }}
        >
          <span>O fechas:</span>
          <input type="date" value={rango.desde} onChange={(e) => setRango((r) => ({ ...r, desde: e.target.value }))}
                 className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-fg [color-scheme:dark]" />
          <span>a</span>
          <input type="date" value={rango.hasta} onChange={(e) => setRango((r) => ({ ...r, hasta: e.target.value }))}
                 className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-fg [color-scheme:dark]" />
          <Button size="sm" variant="outline" type="submit" className="rounded-full"
                  disabled={!rango.desde || !rango.hasta}>
            Ver
          </Button>
          {esAuto && p.sugerido.motivo && (
            <span className="ml-auto text-xs text-faint">
              <Sparkles className="mr-1 inline h-3 w-3" />{p.sugerido.motivo}
            </span>
          )}
        </form>
      )}

      {periodos.isError ? (
        <ErrorState error={periodos.error} />
      ) : informe.isError ? (
        <ErrorState error={informe.error} />
      ) : !d || !params ? (
        <LoadingState label="Calculando el informe del periodo…" />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
            <Button size="sm" onClick={() => verPdf("analisis")} disabled={abriendo !== null}
              className="gap-1.5 rounded-full bg-yellow-400 text-gray-900 hover:bg-yellow-300"
              title="Portada, tiendas, clientes, temporada y las decisiones de la semana, con dibujos">
              <Sparkles className="h-4 w-4" /> {abriendo === "analisis" ? "Generando…" : "Análisis ilustrado"}
            </Button>
            <Button size="sm" onClick={() => verPdf("pdf")} disabled={abriendo !== null} className="gap-1.5 rounded-full">
              <FileText className="h-4 w-4" /> {abriendo === "pdf" ? "Generando…" : "PDF para gerencia"}
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 rounded-full"
              onClick={() => downloadExcelFile(informePeriodoExcelUrl(params),
                `Informe_${params.desde}_a_${params.hasta}${officeId != null ? `_suc${officeId}` : ""}.xlsx`).catch(() => { /* downloadExcelFile ya avisó */ })}>
              <Download className="h-4 w-4" /> Excel
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 rounded-full"
              onClick={() => descargarJson(d, `Informe_${params.desde}_a_${params.hasta}.json`)}>
              <FileJson className="h-4 w-4" /> JSON
            </Button>
          </div>
          <PeriodoPanel d={d} />
        </>
      )}
    </div>
  );
}

function PeriodoPanel({ d }: { d: InformePeriodo }) {
  const k = d.kpis;
  const per = d.meta.periodo;
  const [titular, ...resto] = d.resumen;
  const cats = d.categorias.filter((c) => c.ganancia > 0).slice(0, 8);
  const maxCat = Math.max(1, ...cats.map((c) => c.ganancia));
  const trafico = d.trafico.slice(0, 6);
  const maxTr = Math.max(1, ...trafico.flatMap((c) => [c.participacion_tickets_pct, c.participacion_ganancia_pct]));
  const tono = (v: number | null) => (v == null ? "neutral" : v < 0 ? "danger" : "success");

  return (
    <div className="space-y-5">
      <Card className="border-l-4 border-l-primary p-4">
        <p className="text-xs uppercase tracking-wider text-muted">
          <span className="mr-1.5 rounded bg-primary/15 px-1.5 py-0.5 font-semibold normal-case text-primary">
            {d.meta.sucursal ?? "Todas las tiendas"}
          </span>
          {per.nombre} · {per.desde} → {per.hasta} · {per.dias} días
        </p>
        <p className="mt-1 text-lg font-semibold text-fg">{titular}</p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiStat label="Ganancia" value={money(k.ganancia)}
          sub={`Markup ${pct(k.markup_pct)} · venta ${money(k.venta)}`} icon={Wallet} tone="success" />
        <KpiStat label="Vs. año pasado" value={signo(k.ganancia_vs_ano_pasado_pct)}
          sub={`Ganancia, mismas tiendas · markup antes ${pct(k.markup_ano_pasado_pct)}`}
          icon={TrendingUp} tone={tono(k.ganancia_vs_ano_pasado_pct)} />
        <KpiStat label="Vs. periodo anterior" value={signo(k.ganancia_vs_periodo_anterior_pct)}
          sub={`Ganancia vs los ${per.dias} días previos · markup antes ${pct(k.markup_periodo_anterior_pct)}`}
          icon={TrendingUp} tone={tono(k.ganancia_vs_periodo_anterior_pct)} />
        <KpiStat label="Clientes" value={k.tickets.toLocaleString("es-PE")}
          sub={`Ticket promedio ${money(k.ticket_promedio)}` +
            (k.tickets_vs_ano_pasado_pct != null ? ` · ${signo(k.tickets_vs_ano_pasado_pct)} vs año pasado` : "")}
          icon={Users} tone="primary" />
      </div>

      {d.serie.length > 1 && (
        <Card className="p-4">
          <p className="text-sm font-semibold text-fg">Venta por día</p>
          <p className="mb-2 text-xs text-muted">
            Azul: mismas tiendas que el año pasado · gris punteado: año pasado · celeste: todas las tiendas
          </p>
          <SerieChart serie={d.serie} />
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-4">
          <p className="text-sm font-semibold text-fg">¿Quién deja la ganancia?</p>
          <p className="mb-3 text-xs text-muted">Ganancia por categoría · markup · vs año pasado (mismas tiendas)</p>
          <div className="space-y-2">
            {cats.map((c) => (
              <div key={`${c.departamento}-${c.categoria}`} className="grid grid-cols-[8.5rem_1fr_auto] items-center gap-2 text-sm">
                <span className="truncate text-muted" title={`${c.departamento} › ${c.categoria}`}>{c.categoria}</span>
                <div className="h-4 rounded bg-white/[0.04]">
                  <div className="h-full rounded bg-primary" style={{ width: `${(100 * c.ganancia) / maxCat}%` }} />
                </div>
                <span className="whitespace-nowrap text-right font-mono text-xs text-fg">
                  {moneyCompact(c.ganancia)} <span className="text-faint">· {pct(c.markup_pct, 0)}</span>
                  <Delta v={c.ganancia_vs_ano_pasado_pct} />
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-sm font-semibold text-fg">¿Quién trae a los clientes?</p>
          <p className="mb-3 text-xs text-muted">
            Gris: % de boletas donde aparece · azul: % de la ganancia. Gris más largo = gancho: no dejarlo agotar.
          </p>
          <div className="space-y-2.5">
            {trafico.map((c) => (
              <div key={`${c.departamento}-${c.categoria}`} className="grid grid-cols-[8.5rem_1fr] items-center gap-2 text-sm">
                <span className="truncate text-muted" title={c.categoria}>{c.categoria}</span>
                <div className="space-y-1">
                  <Barra pct={c.participacion_tickets_pct} max={maxTr} cls="bg-white/25" />
                  <Barra pct={c.participacion_ganancia_pct} max={maxTr} cls="bg-primary" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-4">
          <p className="text-sm font-semibold text-fg">¿Qué se acelera y qué se frena?</p>
          <p className="mb-3 text-xs text-muted">Ganancia vs los {per.dias} días anteriores, mismas tiendas</p>
          <Movimientos filas={d.acelera.slice(0, 5)} sube />
          <div className="my-2 border-t border-white/5" />
          <Movimientos filas={d.frena.slice(0, 5)} />
        </Card>

        <Card className="p-4">
          <p className="text-sm font-semibold text-fg">Comprar más</p>
          <p className="mb-3 text-xs text-muted">Se venden más rápido y el stock no alcanza 3 semanas</p>
          {d.comprar_mas.length ? (
            <div className="divide-y divide-white/5">
              {d.comprar_mas.slice(0, 7).map((s) => (
                <div key={s.sku} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate text-fg" title={s.producto}>{s.producto}</p>
                    <p className="text-xs text-faint">
                      {s.sku} · vende {s.velocidad_dia.toFixed(1)}/día · stock {s.stock}
                      {s.stock_almacen > 0 ? ` (${s.stock_almacen} en almacén)` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={cn("rounded border px-1.5 py-0.5 text-[0.65rem] font-semibold",
                      s.cobertura_dias <= 0 ? "border-danger/30 bg-danger/15 text-danger"
                        : "border-warning/30 bg-warning/15 text-warning")}>
                      {s.cobertura_dias <= 0 ? "Agotado" : s.cobertura_dias < 1 ? "< 1 día" : `${Math.round(s.cobertura_dias)} días`}
                    </span>
                    <span className="font-mono text-xs text-fg" title="Unidades para cubrir 30 días">pedir {s.sugerido_30d}</span>
                  </div>
                </div>
              ))}
              {d.comprar_mas.length > 7 && (
                <p className="pt-2 text-xs text-faint">+{d.comprar_mas.length - 7} más en el Excel</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted">Ningún producto se acelera con poco stock.</p>
          )}
        </Card>
      </div>

      <Card className="p-4">
        <p className="text-sm font-semibold text-fg">En pocas palabras</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-muted">
          {resto.map((r) => <li key={r}>{r}</li>)}
          {d.meta.alertas.map((a) => <li key={a} className="text-warning">{a}</li>)}
        </ul>
      </Card>
    </div>
  );
}

function Delta({ v }: { v: number | null }) {
  if (v == null) return null;
  return (
    <span className={cn("ml-1.5", v >= 0 ? "text-success" : "text-danger")}>
      {v >= 0 ? "▲" : "▼"}{Math.abs(v).toFixed(0)}%
    </span>
  );
}

function Barra({ pct: v, max, cls }: { pct: number; max: number; cls: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 rounded bg-white/[0.04]">
        <div className={cn("h-full rounded", cls)} style={{ width: `${(100 * Math.max(0, v)) / max}%` }} />
      </div>
      <span className="w-9 text-right font-mono text-[0.7rem] text-muted">{v.toFixed(0)}%</span>
    </div>
  );
}

function Movimientos({ filas, sube }: { filas: CategoriaPeriodo[]; sube?: boolean }) {
  if (!filas.length) {
    return <p className="text-xs text-faint">{sube ? "Nada se acelera de forma marcada." : "Nada se frena de forma marcada."}</p>;
  }
  const Icon = sube ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="space-y-1.5">
      {filas.map((s) => (
        <div key={`${s.categoria}-${s.subcategoria}`} className="flex items-center justify-between gap-3 text-sm">
          <span className="flex min-w-0 items-center gap-1.5">
            <Icon className={cn("h-4 w-4 shrink-0", sube ? "text-success" : "text-danger")} />
            <span className="truncate text-fg" title={`${s.categoria} › ${s.subcategoria}`}>{s.subcategoria}</span>
          </span>
          <span className={cn("shrink-0 font-mono text-xs", sube ? "text-success" : "text-danger")}>
            {s.cambio_ganancia_soles >= 0 ? "+" : "−"}{money(Math.abs(s.cambio_ganancia_soles))}
            <span className="ml-1 text-faint">({signo(s.ganancia_vs_periodo_anterior_pct)})</span>
          </span>
        </div>
      ))}
    </div>
  );
}

function SerieChart({ serie }: { serie: InformePeriodo["serie"] }) {
  const mounted = useMounted();
  if (!mounted) return <div style={{ height: 240 }} />;
  const hayLy = serie.some((s) => s.venta_ano_pasado != null);
  const corta = (v: unknown) => {
    const [, m, dd] = String(v).split("-");
    return `${Number(dd)}/${Number(m)}`;
  };
  return (
    <div style={{ height: 240, width: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={serie} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis dataKey="fecha" {...AXIS_PROPS} tickFormatter={corta} minTickGap={24} />
          <YAxis {...AXIS_PROPS} width={64} tickFormatter={(v) => moneyCompact(v)} />
          <Tooltip
            content={(props: object) => <ChartTooltip {...props} formatter={(v) => money(v)} />}
            cursor={{ stroke: "#233044" }}
          />
          <Line type="monotone" dataKey="venta" name="Todas las tiendas" stroke="#7dd3fc" strokeWidth={1.5} dot={false} />
          {hayLy && (
            <>
              <Line type="monotone" dataKey="venta_mismas_tiendas" name="Mismas tiendas" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="venta_ano_pasado" name="Año pasado" stroke="#9ca3af" strokeWidth={2}
                    strokeDasharray="5 4" dot={false} />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
