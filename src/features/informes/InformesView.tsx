"use client";

import { useState } from "react";
import { Boxes, CalendarClock, CalendarRange, Download, FileJson, FileText, Gift, PackageX, ShoppingCart, Store, Sunrise, TrendingUp, Wallet } from "lucide-react";
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
  abrirCampanaJuguetesPdf,
  abrirSucursalesPdf,
  abrirMananasPdf,
  abrirCierreMesPdf,
  abrirComprasPdf,
  campanaJuguetesExcelUrl,
  abrirInformeTemporadaPdf,
  getTiendasCompras,
  trasladosExcelUrl,
  comprasExcelUrl,
  abrirComprasRapidoPdf,
  abrirEstancadosPdf,
  estancadosExcelUrl,
  type TiendaCompras,
  abrirMesCursoPdf,
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

export function InformesView() {
  const [modo, setModo] = useState<Modo>("periodo");
  return (
    <div>
      <PageHeader
        eyebrow="Informes"
        title="Informes para decidir"
        description="La conclusión primero y pocos números. Elige un periodo (o deja que el sistema elija) o una temporada; descarga el PDF con gráficos para gerencia o el Excel con todo el detalle."
      />
      <InformesGerente />
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
    </div>
  );
}

/** Los dos PDF mensuales para el gerente, siempre a mano arriba de la página. */
function InformesGerente() {
  const { officeId } = useSucursal();
  const [abriendo, setAbriendo] = useState<"cierre" | "curso" | null>(null);
  const abrir = async (cual: "cierre" | "curso") => {
    setAbriendo(cual);
    try {
      await (cual === "cierre" ? abrirCierreMesPdf(officeId) : abrirMesCursoPdf(officeId));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo generar el informe");
    } finally {
      setAbriendo(null);
    }
  };
  const items = [
    { cual: "cierre" as const, titulo: "Cierre del mes pasado", icon: FileText,
      desc: "Cómo nos fue, cómo se movió cada categoría y por qué bajó, quiebres, qué rebajar y qué rematar." },
    { cual: "curso" as const, titulo: "Mes en curso + compras", icon: ShoppingCart,
      desc: "Avance contra el año pasado, categorías que vienen bajando y cuánto comprar (temporada + reposición)." },
  ];
  return (
    <>
    <ComprasSemana />
    <Estancados />
    <CampanaJuguetes />
    <ComoFuncionaTiendas />
    <VentaManana />
    <div className="mb-5 grid gap-3 sm:grid-cols-2">
      {items.map(({ cual, titulo, desc, icon: Icon }) => (
        <button key={cual} onClick={() => abrir(cual)} disabled={abriendo !== null}
          className="flex items-start gap-3 rounded-2xl border border-yellow-400/30 bg-yellow-400/[0.06] p-4 text-left transition-colors hover:bg-yellow-400/[0.12] disabled:opacity-60">
          <Icon className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400" />
          <span>
            <span className="block text-sm font-semibold text-fg">
              {abriendo === cual ? "Generando PDF… (puede tardar ~40 s)" : `PDF · ${titulo}`}
            </span>
            <span className="block text-xs text-muted">{desc}</span>
          </span>
        </button>
      ))}
    </div>
    </>
  );
}

/** Campaña de juguetes (Navidad): PDF para gerencia y Excel con el detalle por producto. */
function CampanaJuguetes() {
  const [abriendo, setAbriendo] = useState(false);
  const [bajando, setBajando] = useState(false);
  const abrir = async () => {
    setAbriendo(true);
    try {
      await abrirCampanaJuguetesPdf();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo generar el informe");
    } finally {
      setAbriendo(false);
    }
  };
  const descargar = async () => {
    setBajando(true);
    try {
      await downloadExcelFile(campanaJuguetesExcelUrl(), "campana_juguetes.xlsx");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo descargar el Excel");
    } finally {
      setBajando(false);
    }
  };
  return (
    <div className="mb-3 rounded-2xl border border-yellow-400/30 bg-yellow-400/[0.06] p-4">
      <div className="flex flex-wrap items-start gap-3">
        <Gift className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-fg">PDF · Campaña de juguetes (Navidad)</p>
          <p className="text-xs text-muted">
            Cuánto capital poner en cada nivel de costo y qué juguetes comprar por categoría y subcategoría, en dos
            compras: ahora y la reserva de diciembre. Con el reparto por tienda.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={abrir} disabled={abriendo}>
            <FileText className="h-4 w-4" />
            {abriendo ? "Generando… (puede tardar ~1 min)" : "Generar PDF"}
          </Button>
          <Button variant="outline" onClick={descargar} disabled={bajando}
            title="El mismo informe con el detalle por producto y por tienda">
            <Download className="h-4 w-4" />
            {bajando ? "Preparando Excel…" : "Detalle (Excel)"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * "¿Cómo funciona cada tienda?": sigue al selector global de sucursal.
 * Todas = las tiendas comparadas lado a lado; una sucursal = solo esa, contra el promedio de las otras.
 */
const SEMANAS_OPC = [4, 5, 8, 13] as const;

function ComoFuncionaTiendas() {
  const { officeId, sucursalName } = useSucursal();
  const [semanas, setSemanas] = useState<number>(5);
  const [abriendo, setAbriendo] = useState(false);
  const todas = officeId == null;
  const abrir = async () => {
    setAbriendo(true);
    try {
      await abrirSucursalesPdf(officeId, semanas);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo generar el informe");
    } finally {
      setAbriendo(false);
    }
  };
  return (
    <div className="mb-3 rounded-2xl border border-yellow-400/30 bg-yellow-400/[0.06] p-4">
      <div className="flex flex-wrap items-start gap-3">
        <Store className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-fg">
            PDF · {todas ? "¿Cómo funciona cada tienda?" : `¿Cómo funciona ${sucursalName ?? "la sucursal"}?`}
          </p>
          <p className="text-xs text-muted">
            {todas
              ? "Las tiendas comparadas lado a lado: qué días y a qué hora venden, qué departamentos, qué se compra junto (familias y parejas), para cuántos días alcanza el stock, qué agotados se pueden trasladar y por qué bajan las ventas."
              : "Solo esta tienda, comparada con el promedio de las otras: su semana, sus horas fuertes, qué vende y qué se compra junto, su stock, de dónde traer sus agotados y por qué bajan sus ventas."}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted">
            <span>Últimas</span>
            {SEMANAS_OPC.map((s) => (
              <button key={s} onClick={() => setSemanas(s)}
                className={cn("rounded-full border px-2.5 py-0.5 transition-colors",
                  semanas === s ? "border-yellow-400/60 bg-yellow-400/20 text-fg" : "border-white/10 hover:text-fg")}>
                {s}
              </button>
            ))}
            <span>semanas · cambia de tienda con el selector de sucursal</span>
          </div>
        </div>
        <Button onClick={abrir} disabled={abriendo}>
          <FileText className="h-4 w-4" />
          {abriendo ? "Generando… (puede tardar ~30 s)" : "Generar PDF"}
        </Button>
      </div>
    </div>
  );
}

/**
 * "¿Cómo vendemos más en la mañana?": sigue al selector global de sucursal, igual que
 * "¿Cómo funciona cada tienda?". Mañana = hasta la 1 pm.
 */
const SEMANAS_MANANA = [4, 8, 13] as const;

function VentaManana() {
  const { officeId, sucursalName } = useSucursal();
  const [semanas, setSemanas] = useState<number>(8);
  const [abriendo, setAbriendo] = useState(false);
  const todas = officeId == null;
  const abrir = async () => {
    setAbriendo(true);
    try {
      await abrirMananasPdf(officeId, semanas);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo generar el informe");
    } finally {
      setAbriendo(false);
    }
  };
  return (
    <div className="mb-3 rounded-2xl border border-yellow-400/30 bg-yellow-400/[0.06] p-4">
      <div className="flex flex-wrap items-start gap-3">
        <Sunrise className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-fg">
            PDF · {todas ? "¿Cómo vendemos más en la mañana?" : `¿Cómo vende más ${sucursalName ?? "la sucursal"} en la mañana?`}
          </p>
          <p className="text-xs text-muted">
            Cuánto entra antes de la 1 pm, si falta gente o ticket, a qué hora llega el primer cliente, qué mañana es la
            más floja y cuánto se ganaría, qué se compra temprano, agotados de la mañana y un plan por tienda.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted">
            <span>Últimas</span>
            {SEMANAS_MANANA.map((s) => (
              <button key={s} onClick={() => setSemanas(s)}
                className={cn("rounded-full border px-2.5 py-0.5 transition-colors",
                  semanas === s ? "border-yellow-400/60 bg-yellow-400/20 text-fg" : "border-white/10 hover:text-fg")}>
                {s}
              </button>
            ))}
            <span>semanas · cambia de tienda con el selector de sucursal</span>
          </div>
        </div>
        <Button onClick={abrir} disabled={abriendo}>
          <FileText className="h-4 w-4" />
          {abriendo ? "Generando… (puede tardar ~20 s)" : "Generar PDF"}
        </Button>
      </div>
    </div>
  );
}

/**
 * Productos estancados: el gerente elige entre qué tiendas mirar. Lo que no se vende en una tienda
 * se traslada (o se prueba) solo hacia las tiendas marcadas; lo que no se vende en ninguna se remata.
 */
function Estancados() {
  const tiendas = useBIQuery<TiendaCompras[]>({
    queryKey: ["informes", "compras", "tiendas"],
    queryFn: ({ signal }) => getTiendasCompras(signal),
  });
  const [elegidas, setElegidas] = useState<number[] | null>(null);
  const [abriendo, setAbriendo] = useState(false);
  const [bajando, setBajando] = useState(false);
  const lista = tiendas.data ?? [];
  const sel = elegidas ?? lista.map((t) => t.id);
  const toggle = (id: number) => setElegidas(sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]);
  const abrir = async () => {
    if (!sel.length) return;
    setAbriendo(true);
    try {
      await abrirEstancadosPdf(sel);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo generar el informe");
    } finally {
      setAbriendo(false);
    }
  };
  const descargar = async () => {
    if (!sel.length) return;
    setBajando(true);
    try {
      await downloadExcelFile(estancadosExcelUrl(sel), "productos_estancados.xlsx");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo descargar el Excel");
    } finally {
      setBajando(false);
    }
  };
  return (
    <div className="mb-3 rounded-2xl border border-yellow-400/30 bg-yellow-400/[0.06] p-4">
      <div className="flex items-start gap-3">
        <PackageX className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-fg">PDF · Productos estancados</p>
          <p className="text-xs text-muted">
            Stock que no se vende en 90 días, que dura más de 6 meses o que se frenó (+45 días sin venderse), y lo lento que no conviene recomprar. Qué trasladar a otra tienda (allá sí se vende), qué
            probar donde nunca lo tuvieron, qué promocionar, qué rematar y qué guardar para su campaña. Solo entre las tiendas marcadas.
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-3">
            <fieldset className="min-w-0">
              <legend className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">Tiendas</legend>
              {tiendas.isLoading ? (
                <span className="text-xs text-muted">Cargando tiendas…</span>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {lista.map((t) => (
                    <label key={t.id} className={cn(
                      "flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
                      sel.includes(t.id) ? "border-yellow-400/60 bg-yellow-400/15 text-fg" : "border-white/10 text-muted")}>
                      <input id={`est-tienda-${t.id}`} type="checkbox" className="accent-yellow-400"
                        checked={sel.includes(t.id)} onChange={() => toggle(t.id)} />
                      {t.nombre}
                    </label>
                  ))}
                </div>
              )}
            </fieldset>
            <Button onClick={abrir} disabled={!sel.length || abriendo}>
              <FileText className="h-4 w-4" />
              {abriendo ? "Generando… (~20 s)" : "Generar PDF"}
            </Button>
            <Button variant="outline" onClick={descargar} disabled={!sel.length || bajando}>
              <Download className="h-4 w-4" />
              {bajando ? "Preparando Excel…" : "Detalle (Excel)"}
            </Button>
          </div>
          {sel.length === 1 && (
            <p className="mt-2 text-xs text-muted">Con una sola tienda no hay a dónde trasladar: marca dos o más para ver traslados.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/** "¿Qué compramos esta semana?": el gerente elige tiendas y presupuesto y abre el PDF. */
function ComprasSemana() {
  const tiendas = useBIQuery<TiendaCompras[]>({
    queryKey: ["informes", "compras", "tiendas"],
    queryFn: ({ signal }) => getTiendasCompras(signal),
  });
  const [elegidas, setElegidas] = useState<number[] | null>(null);
  const [presMin, setPresMin] = useState(20000);
  const [presMax, setPresMax] = useState(25000);
  const [abriendo, setAbriendo] = useState(false);
  const lista = tiendas.data ?? [];
  const sel = elegidas ?? lista.map((t) => t.id);
  const toggle = (id: number) =>
    setElegidas(sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]);
  const valido = sel.length > 0 && presMin >= 0 && presMax >= presMin;
  const [bajando, setBajando] = useState(false);
  const descargarTraslados = async () => {
    if (sel.length < 2) return;
    setBajando(true);
    try {
      await downloadExcelFile(trasladosExcelUrl(sel, presMin, presMax), "traslados_entre_tiendas.xlsx");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo descargar el Excel de traslados");
    } finally {
      setBajando(false);
    }
  };
  const [abriendoRapido, setAbriendoRapido] = useState(false);
  const abrirRapido = async () => {
    if (!valido) return;
    setAbriendoRapido(true);
    try {
      await abrirComprasRapidoPdf(sel, presMin, presMax);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo generar la lista de compra");
    } finally {
      setAbriendoRapido(false);
    }
  };
  const [bajandoCompras, setBajandoCompras] = useState(false);
  const descargarCompras = async () => {
    if (!valido) return;
    setBajandoCompras(true);
    try {
      await downloadExcelFile(comprasExcelUrl(sel, presMin, presMax), "compras_esta_semana.xlsx");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo descargar el Excel de compras");
    } finally {
      setBajandoCompras(false);
    }
  };

  const abrir = async () => {
    if (!valido) return;
    setAbriendo(true);
    try {
      await abrirComprasPdf(sel, presMin, presMax);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo generar el informe");
    } finally {
      setAbriendo(false);
    }
  };

  return (
    <div className="mb-3 rounded-2xl border border-yellow-400/30 bg-yellow-400/[0.06] p-4">
      <div className="flex items-start gap-3">
        <Wallet className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-fg">PDF · ¿Qué compramos esta semana?</p>
          <p className="text-xs text-muted">
            Qué productos se agotaron y cuánto pedir en las tiendas elegidas, dentro del presupuesto. Sin Navidad ni juguetes.
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-3">
            <fieldset className="min-w-0">
              <legend className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">Tiendas</legend>
              {tiendas.isLoading ? (
                <span className="text-xs text-muted">Cargando tiendas…</span>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {lista.map((t) => (
                    <label key={t.id} className={cn(
                      "flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
                      sel.includes(t.id) ? "border-yellow-400/60 bg-yellow-400/15 text-fg" : "border-white/10 text-muted")}>
                      <input id={`tienda-${t.id}`} type="checkbox" className="accent-yellow-400"
                        checked={sel.includes(t.id)} onChange={() => toggle(t.id)} />
                      {t.nombre}
                    </label>
                  ))}
                </div>
              )}
            </fieldset>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              Presupuesto mínimo (S/)
              <input id="pres-min" type="number" min={0} step={1000} value={presMin}
                onChange={(e) => setPresMin(Number(e.target.value))}
                className="mt-1 block w-32 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-sm text-fg" />
            </label>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              Presupuesto máximo (S/)
              <input id="pres-max" type="number" min={0} step={1000} value={presMax}
                onChange={(e) => setPresMax(Number(e.target.value))}
                className="mt-1 block w-32 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-sm text-fg" />
            </label>
            <Button onClick={abrir} disabled={!valido || abriendo}>
              <FileText className="h-4 w-4" />
              {abriendo ? "Generando… (puede tardar ~1 min)" : "Generar PDF"}
            </Button>
            <Button variant="outline" onClick={abrirRapido} disabled={!valido || abriendoRapido}
              title="Solo la lista para comprar: Urgente › Categoría › Subcategoría › SKU, sin gráficos">
              <FileText className="h-4 w-4" />
              {abriendoRapido ? "Generando… (~1 min)" : "Lista rápida (PDF)"}
            </Button>
            <Button variant="outline" onClick={descargarCompras} disabled={!valido || bajandoCompras}
              title="La misma compra en Excel: lista de productos para el proveedor, resumen por subcategoría y diagnóstico">
              <Download className="h-4 w-4" />
              {bajandoCompras ? "Preparando Excel… (~1 min)" : "Compras (Excel)"}
            </Button>
            <Button variant="outline" onClick={descargarTraslados} disabled={sel.length < 2 || bajando}
              title="Qué pasar de una tienda a otra antes de comprar (solo entre las tiendas marcadas)">
              <Download className="h-4 w-4" />
              {bajando ? "Preparando Excel…" : "Traslados (Excel)"}
            </Button>
          </div>
          {!valido && (
            <p className="mt-2 text-xs text-danger">
              {sel.length === 0 ? "Elige al menos una tienda." : "El máximo debe ser mayor o igual al mínimo."}
            </p>
          )}
        </div>
      </div>
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
