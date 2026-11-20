"use client";

import { useState } from "react";
import { Boxes, CalendarClock, CalendarRange, Download, FileJson, FileText, LineChart, PackageX, ShoppingCart, TrendingUp, Wallet } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KpiStat } from "@/components/ui/kpi-stat";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { downloadExcelFile } from "@/lib/api";
import { money, pct } from "@/lib/format";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useBIQuery } from "@/features/bi/shared";
import { PeriodoSection } from "./PeriodoView";
import { SurtidoSection } from "./SurtidoView";
import { useSucursal } from "@/components/sucursal-context";
import {
  abrirInformeTemporadaPdf,
  descargarJson,
  getInformeTemporada,
  getTemporadas,
  informeTemporadaExcelUrl,
  informesQueryKeys,
  type InformeTemporada,
  type Riesgo,
  type SkuTemporada,
  type TemporadaItem,
} from "@/lib/informes-api";
import { DescargasSection, PanelReporte, RecomendadoHoy, REPORTES } from "./DescargasView";

/**
 * Centro de Informes — pocos números, la decisión arriba y las tres salidas:
 * PDF para el jefe (HTML A4 con gráficos), Excel para el analista y JSON.
 * Todo sale del mismo cálculo del backend (`/informes/*`).
 */

const RIESGO_UI: Record<Riesgo, { label: string; cls: string }> = {
  agotado: { label: "Agotado", cls: "bg-danger/15 text-danger border-danger/30" },
  alto: { label: "Pedir hoy", cls: "bg-warning/15 text-warning border-warning/30" },
  medio: { label: "Si vende más", cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  temporada: { label: "Para la temporada", cls: "bg-primary/15 text-primary border-primary/30" },
  bajo: { label: "Cubierto", cls: "bg-success/15 text-success border-success/30" },
  sin_venta: { label: "Sin venta", cls: "bg-white/5 text-muted border-white/10" },
  recompra: { label: "¿Recomprar?", cls: "bg-violet/15 text-violet border-violet/30" },
};

type Modo = "periodo" | "surtido" | "temporada";
type Pestana = "analisis" | "descargas";

export function InformesView() {
  const [pestana, setPestana] = useState<Pestana>("analisis");
  const [modo, setModo] = useState<Modo>("periodo");
  const [abierto, setAbierto] = useState<string | null>(null);
  const reporte = REPORTES.find((r) => r.id === abierto) ?? null;
  return (
    <div>
      <PageHeader
        eyebrow="Informes"
        title="Informes para decidir"
        description="Análisis en vivo para mirar cómo vamos, y Descargas con los PDF para gerencia y los Excel con el detalle."
      />
      <RecomendadoHoy onAbrir={setAbierto} />
      <div className="mb-5 flex gap-1 border-b border-white/10">
        {([
          ["analisis", "Análisis", LineChart],
          ["descargas", "Descargas", Download],
        ] as const).map(([p, label, Icon]) => (
          <button key={p} onClick={() => setPestana(p)}
            className={cn("-mb-px flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              pestana === p ? "border-primary text-fg" : "border-transparent text-muted hover:text-fg")}>
            <Icon className="h-4 w-4" /> {label}
            {p === "descargas" && <span className="rounded-full bg-white/10 px-1.5 text-[10px] text-muted">{REPORTES.length}</span>}
          </button>
        ))}
      </div>
      {pestana === "analisis" ? (
        <>
          <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1">
            {([
              ["periodo", "Por periodo", CalendarRange],
              ["surtido", "Surtido", Boxes],
              ["temporada", "Por temporada", CalendarClock],
            ] as const).map(([m, label, Icon]) => (
              <button key={m} onClick={() => setModo(m)}
                className={cn("flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm transition-colors",
                  modo === m ? "bg-primary text-white" : "text-muted hover:text-fg")}>
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
          {modo === "periodo" ? <PeriodoSection /> : modo === "surtido" ? <SurtidoSection /> : <TemporadaSection />}
        </>
      ) : (
        <DescargasSection onAbrir={setAbierto} />
      )}
      <PanelReporte reporte={reporte} onClose={() => setAbierto(null)} />
    </div>
  );
}

function TemporadaSection() {
  const temporadas = useBIQuery<TemporadaItem[]>({
    queryKey: informesQueryKeys.temporadas(),
    queryFn: ({ signal }) => getTemporadas(signal),
  });
  const [elegida, setClave] = useState<string | null>(null);
  // Sin elección del usuario, la temporada vigente (el backend la manda primero).
  const clave = elegida ?? temporadas.data?.[0]?.clave ?? null;

  const { officeId } = useSucursal(); // sucursal del selector global (null = todas)
  const informe = useBIQuery<InformeTemporada>({
    queryKey: informesQueryKeys.temporada(clave ?? "", officeId),
    queryFn: ({ signal }) => getInformeTemporada(clave as string, officeId, signal),
    enabled: !!clave,
  });
  const [abriendo, setAbriendo] = useState(false);

  const verPdf = async () => {
    if (!clave) return;
    setAbriendo(true);
    try {
      await abrirInformeTemporadaPdf(clave, officeId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo abrir el informe");
    } finally {
      setAbriendo(false);
    }
  };

  const d = informe.data;
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {temporadas.data?.map((t) => (
          <button
            key={t.clave}
            onClick={() => setClave(t.clave)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
              clave === t.clave
                ? "border-primary/50 bg-primary/15 text-fg"
                : "border-white/10 bg-white/[0.03] text-muted hover:text-fg",
            )}
          >
            {t.nombre}
            <span className="ml-1.5 text-xs text-faint">
              {t.vigente ? "· en curso" : `· en ${t.dias_para_inicio} días`}
            </span>
          </button>
        ))}
        {d && clave && (
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={verPdf} disabled={abriendo} className="gap-1.5 rounded-full">
              <FileText className="h-4 w-4" /> {abriendo ? "Generando…" : "PDF para gerencia"}
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 rounded-full"
              onClick={() => downloadExcelFile(informeTemporadaExcelUrl(clave, officeId), `Informe_${clave}${officeId != null ? `_suc${officeId}` : ""}.xlsx`).catch(console.error)}>
              <Download className="h-4 w-4" /> Excel
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 rounded-full"
              onClick={() => descargarJson(d, `Informe_${clave}_${d.meta.generado_at.slice(0, 10)}.json`)}>
              <FileJson className="h-4 w-4" /> JSON
            </Button>
          </div>
        )}
      </div>

      {temporadas.isError ? (
        <ErrorState error={temporadas.error} />
      ) : informe.isError ? (
        <ErrorState error={informe.error} />
      ) : !d ? (
        <LoadingState label="Calculando el informe (pronóstico, plan de compra y año pasado)…" />
      ) : (
        <InformeTemporadaPanel d={d} />
      )}
    </div>
  );
}

function InformeTemporadaPanel({ d }: { d: InformeTemporada }) {
  const k = d.kpis;
  const t = d.meta.temporada;
  const titular = d.resumen[1] ?? d.resumen[0];
  const delta = k.delta_vs_ano_pasado_pct;
  const subcats = d.subcategorias.filter((s) => s.compra_probable_soles > 0).slice(0, 8);
  const maxSub = Math.max(1, ...subcats.map((s) => s.compra_pesimista_soles));
  const porAgotarse = (d.por_agotarse ?? []).slice(0, 8);
  const agotados = d.skus_riesgo.filter((s) => s.riesgo === "agotado").slice(0, 8);

  return (
    <div className="space-y-5">
      <Card className="border-l-4 border-l-primary p-4">
        <p className="text-xs uppercase tracking-wider text-muted">
          <span className="mr-1.5 rounded bg-primary/15 px-1.5 py-0.5 font-semibold normal-case text-primary">
            {d.meta.sucursal ?? "Todas las tiendas"}
          </span>
          {t.nombre} · {t.inicio} → {t.fin} · quedan {t.dias_restantes} días
        </p>
        <p className="mt-1 text-lg font-semibold text-fg">{titular}</p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiStat
          label="Ganancia de la temporada"
          value={money(k.ganancia)}
          sub={`Markup ${pct(k.markup_pct)} · venta ${money(k.venta)}`}
          icon={Wallet}
          tone="success"
        />
        <KpiStat
          label="Vs. año pasado"
          value={delta == null ? "—" : `${delta > 0 ? "+" : ""}${delta.toFixed(1)}%`}
          sub={`Mismas tiendas · primeros ${k.dias_comparados ?? "?"} días`}
          icon={TrendingUp}
          tone={(delta ?? 0) < 0 ? "danger" : "success"}
        />
        <KpiStat
          label="Comprar (lo más probable)"
          value={money(k.presupuesto_compra_probable)}
          sub={`Hasta ${money(k.presupuesto_compra_pesimista)} si la venta sube`}
          icon={ShoppingCart}
          tone="primary"
        />
        <KpiStat
          label="Ganancia que se pierde"
          value={`${money(k.ganancia_en_riesgo_dia)}/día`}
          sub={`${k.skus_agotados + k.skus_riesgo_alto} productos agotados o por agotarse`}
          icon={PackageX}
          tone="danger"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-4">
          <p className="text-sm font-semibold text-fg">¿Dónde comprar?</p>
          <p className="mb-3 text-xs text-muted">S/ a costo · oscuro: lo probable · claro: si la venta sube</p>
          <div className="space-y-2">
            {subcats.map((s) => (
              <div key={`${s.categoria}-${s.subcategoria}`} className="grid grid-cols-[9rem_1fr_6.5rem] items-center gap-2 text-sm">
                <span className="truncate text-muted" title={`${s.departamento} › ${s.categoria} › ${s.subcategoria}`}>
                  {s.subcategoria}
                </span>
                <div className="relative h-4 rounded bg-white/[0.04]">
                  <div className="absolute inset-y-0 left-0 rounded bg-primary/30"
                       style={{ width: `${(100 * s.compra_pesimista_soles) / maxSub}%` }} />
                  <div className="absolute inset-y-0 left-0 rounded bg-primary"
                       style={{ width: `${(100 * s.compra_probable_soles) / maxSub}%` }} />
                </div>
                <span className="text-right font-mono text-fg">{money(s.compra_probable_soles)}</span>
              </div>
            ))}
            {!subcats.length && <p className="text-sm text-muted">No hace falta comprar más para la temporada.</p>}
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-sm font-semibold text-fg">Se agotan antes de reponer</p>
          <p className="mb-3 text-xs text-muted">
            Con stock hoy, pero se acaban antes de que llegue un pedido ({d.meta.supuestos.lead_time_dias} días)
          </p>
          <ListaSkus filas={porAgotarse} vacio="Ningún producto con stock se agota antes de reponer." conFecha />
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-4">
          <p className="text-sm font-semibold text-fg">Ya agotados: reponer primero</p>
          <p className="mb-3 text-xs text-muted">Ordenados por la ganancia que se deja de ganar cada día</p>
          <ListaSkus filas={agotados} vacio="No hay productos agotados con demanda." />
        </Card>
        <Card className="p-4">
          <p className="text-sm font-semibold text-fg">En pocas palabras</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-muted">
            {d.resumen.filter((r) => r !== titular).map((r) => <li key={r}>{r}</li>)}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function ListaSkus({ filas, vacio, conFecha }: { filas: SkuTemporada[]; vacio: string; conFecha?: boolean }) {
  if (!filas.length) return <p className="text-sm text-muted">{vacio}</p>;
  return (
    <div className="divide-y divide-white/5">
      {filas.map((s) => {
        const r = RIESGO_UI[s.riesgo];
        return (
          <div key={s.sku} className="flex items-center justify-between gap-3 py-2 text-sm">
            <div className="min-w-0">
              <p className="truncate text-fg" title={s.producto}>{s.producto}</p>
              <p className="text-xs text-faint">
                {s.sku} · stock {s.stock_total}
                {conFecha && s.quiebre_probable ? ` · se agota ${s.quiebre_probable}` : ""}
                {s.trasladar_desde_almacen > 0 ? ` · trasladar ${s.trasladar_desde_almacen} del almacén` : ""}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="font-mono text-xs text-muted" title="Ganancia que se pierde por día">
                {money(s.ganancia_en_riesgo_dia)}/día
              </span>
              <span className="font-mono text-xs text-fg" title="Unidades a comprar (escenario probable)">
                pedir {s.compra_probable}
              </span>
              <span className={cn("rounded border px-1.5 py-0.5 text-[0.65rem] font-semibold", r.cls)}>{r.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
