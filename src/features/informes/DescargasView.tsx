"use client";

import { useState, type ComponentType, type ReactNode } from "react";
import {
  BookImage, ChevronRight, Download, FileText, Gift, PackageX, Repeat, ShoppingCart, Sparkles, Store, Sunrise,
  CalendarCheck, Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { useSucursal } from "@/components/sucursal-context";
import { downloadExcelFile } from "@/lib/api";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useBIQuery } from "@/features/bi/shared";
import {
  abrirCampanaJuguetesPdf,
  abrirCatalogoPdf,
  abrirCierreMesPdf,
  abrirComprasPdf,
  abrirComprasRapidoPdf,
  abrirEstancadosPdf,
  abrirMananasPdf,
  abrirMesCursoPdf,
  abrirSucursalesPdf,
  campanaJuguetesExcelUrl,
  comprasExcelUrl,
  estancadosExcelUrl,
  getCatalogoOpciones,
  getTiendasCompras,
  trasladosExcelUrl,
  type CatalogoOpciones,
  type TiendaCompras,
} from "@/lib/informes-api";

/**
 * Descargas: todos los PDF y Excel de Informes en tarjetas chicas, agrupadas por para qué
 * sirven. Las opciones de cada informe (tiendas, presupuesto, semanas, filtros) viven en un
 * panel lateral que se abre al hacer clic, así la página no muestra 30 controles a la vez.
 */

// ── piezas compartidas ──────────────────────────────────────────────────────

/** Corre una acción (abrir PDF / bajar Excel) con estado "ocupado" y aviso si falla. */
function useAccion() {
  const [busy, setBusy] = useState<string | null>(null);
  const run = async (key: string, fn: () => Promise<unknown>, error = "No se pudo generar el informe") => {
    setBusy(key);
    try {
      await fn();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : error);
    } finally {
      setBusy(null);
    }
  };
  return { busy, run };
}

/** Tiendas del informe. Por defecto, la del selector de sucursal de arriba (o todas si está en "todas"). */
function useTiendas() {
  const { officeId } = useSucursal();
  const q = useBIQuery<TiendaCompras[]>({
    queryKey: ["informes", "compras", "tiendas"],
    queryFn: ({ signal }) => getTiendasCompras(signal),
  });
  const lista = q.data ?? [];
  const porDefecto = officeId != null && lista.some((t) => t.id === officeId) ? [officeId] : lista.map((t) => t.id);
  const [elegidas, setElegidas] = useState<number[] | null>(null);
  const sel = elegidas ?? porDefecto;
  const toggle = (id: number) => setElegidas(sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]);
  return { lista, sel, toggle, cargando: q.isLoading };
}

function Seccion({ titulo, children, nota }: { titulo: string; children: ReactNode; nota?: ReactNode }) {
  return (
    <div className="mb-5">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">{titulo}</p>
      {children}
      {nota && <p className="mt-2 text-xs text-muted">{nota}</p>}
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={cn("rounded-full border px-3 py-1 text-xs transition-colors",
        on ? "border-primary/60 bg-primary/15 text-fg" : "border-white/10 text-muted hover:text-fg")}>
      {children}
    </button>
  );
}

function TiendasPicker({ t, nota }: { t: ReturnType<typeof useTiendas>; nota?: ReactNode }) {
  return (
    <Seccion titulo="Tiendas" nota={nota}>
      {t.cargando ? <span className="text-xs text-muted">Cargando tiendas…</span> : (
        <div className="flex flex-wrap gap-2">
          {t.lista.map((x) => <Chip key={x.id} on={t.sel.includes(x.id)} onClick={() => t.toggle(x.id)}>{x.nombre}</Chip>)}
        </div>
      )}
    </Seccion>
  );
}

function Presupuesto({ min, max, setMin, setMax }: { min: number; max: number; setMin: (n: number) => void; setMax: (n: number) => void }) {
  const input = "mt-1 block w-full rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 text-sm text-fg";
  return (
    <Seccion titulo="Presupuesto (S/)" nota={max < min ? <span className="text-danger">El máximo debe ser mayor o igual al mínimo.</span> : undefined}>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs text-muted">Mínimo
          <input type="number" min={0} step={1000} value={min} onChange={(e) => setMin(Number(e.target.value))} className={input} />
        </label>
        <label className="text-xs text-muted">Máximo
          <input type="number" min={0} step={1000} value={max} onChange={(e) => setMax(Number(e.target.value))} className={input} />
        </label>
      </div>
    </Seccion>
  );
}

function Semanas({ opciones, valor, set }: { opciones: readonly number[]; valor: number; set: (n: number) => void }) {
  return (
    <Seccion titulo="Semanas a mirar">
      <div className="flex flex-wrap gap-2">
        {opciones.map((s) => <Chip key={s} on={valor === s} onClick={() => set(s)}>Últimas {s}</Chip>)}
      </div>
    </Seccion>
  );
}

/** Botones de salida, apilados: el primero es el principal. */
function Acciones({ children }: { children: ReactNode }) {
  return <div className="mt-6 flex flex-col gap-2 border-t border-white/10 pt-4 [&>button]:w-full [&>button]:justify-center">{children}</div>;
}

function Pdf({ onClick, busy, disabled, children = "Generar PDF", tarda }: {
  onClick: () => void; busy: boolean; disabled?: boolean; children?: ReactNode; tarda?: string;
}) {
  return (
    <Button onClick={onClick} disabled={busy || disabled}>
      <FileText className="h-4 w-4" /> {busy ? `Generando…${tarda ? ` (${tarda})` : ""}` : children}
    </Button>
  );
}

function Excel({ onClick, busy, disabled, children }: { onClick: () => void; busy: boolean; disabled?: boolean; children: ReactNode }) {
  return (
    <Button variant="outline" onClick={onClick} disabled={busy || disabled}>
      <Download className="h-4 w-4" /> {busy ? "Preparando Excel…" : children}
    </Button>
  );
}

function SucursalNota() {
  const { officeId, sucursalName } = useSucursal();
  return (
    <p className="mb-5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-muted">
      Tienda: <b className="text-fg">{officeId == null ? "todas" : sucursalName ?? "la sucursal elegida"}</b> · se cambia con el selector de sucursal de arriba.
    </p>
  );
}

// ── paneles (las opciones de cada informe) ──────────────────────────────────

function PanelCompras() {
  const t = useTiendas();
  const [min, setMin] = useState(20000);
  const [max, setMax] = useState(25000);
  const { busy, run } = useAccion();
  const ok = t.sel.length > 0 && min >= 0 && max >= min;
  return (
    <>
      <TiendasPicker t={t} nota={t.sel.length === 0 ? <span className="text-danger">Elige al menos una tienda.</span> : undefined} />
      <Presupuesto min={min} max={max} setMin={setMin} setMax={setMax} />
      <Acciones>
        <Pdf busy={busy === "pdf"} disabled={!ok} tarda="~1 min" onClick={() => run("pdf", () => abrirComprasPdf(t.sel, min, max))} />
        <Button variant="outline" disabled={!ok || busy === "rapido"} onClick={() => run("rapido", () => abrirComprasRapidoPdf(t.sel, min, max))}>
          <FileText className="h-4 w-4" /> {busy === "rapido" ? "Generando… (~1 min)" : "Lista rápida (PDF, sin gráficos)"}
        </Button>
        <Excel busy={busy === "xls"} disabled={!ok}
          onClick={() => run("xls", () => downloadExcelFile(comprasExcelUrl(t.sel, min, max), "compras_esta_semana.xlsx"), "No se pudo descargar el Excel")}>
          Compras para el proveedor (Excel)
        </Excel>
      </Acciones>
    </>
  );
}

function PanelTraslados() {
  const t = useTiendas();
  const [min, setMin] = useState(20000);
  const [max, setMax] = useState(25000);
  const { busy, run } = useAccion();
  const ok = t.sel.length >= 2 && max >= min;
  return (
    <>
      <TiendasPicker t={t} nota={t.sel.length < 2 ? "Marca dos o más tiendas: los traslados son entre las tiendas marcadas." : undefined} />
      <Presupuesto min={min} max={max} setMin={setMin} setMax={setMax} />
      <Acciones>
        <Excel busy={busy === "xls"} disabled={!ok}
          onClick={() => run("xls", () => downloadExcelFile(trasladosExcelUrl(t.sel, min, max), "traslados_entre_tiendas.xlsx"), "No se pudo descargar el Excel")}>
          Traslados (Excel)
        </Excel>
      </Acciones>
    </>
  );
}

function PanelEstancados() {
  const t = useTiendas();
  const { busy, run } = useAccion();
  const ok = t.sel.length > 0;
  return (
    <>
      <TiendasPicker t={t} nota={t.sel.length === 1 ? "Con una sola tienda no hay a dónde trasladar: marca dos o más para ver traslados." : undefined} />
      <Acciones>
        <Pdf busy={busy === "pdf"} disabled={!ok} tarda="~20 s" onClick={() => run("pdf", () => abrirEstancadosPdf(t.sel))} />
        <Excel busy={busy === "xls"} disabled={!ok}
          onClick={() => run("xls", () => downloadExcelFile(estancadosExcelUrl(t.sel), "productos_estancados.xlsx"), "No se pudo descargar el Excel")}>
          Detalle (Excel)
        </Excel>
      </Acciones>
    </>
  );
}

function PanelCampana() {
  const { busy, run } = useAccion();
  return (
    <Acciones>
      <Pdf busy={busy === "pdf"} tarda="~1 min" onClick={() => run("pdf", abrirCampanaJuguetesPdf)} />
      <Excel busy={busy === "xls"}
        onClick={() => run("xls", () => downloadExcelFile(campanaJuguetesExcelUrl(), "campana_juguetes.xlsx"), "No se pudo descargar el Excel")}>
        Detalle por producto y tienda (Excel)
      </Excel>
    </Acciones>
  );
}

function PanelCierreMes() {
  const { officeId } = useSucursal();
  const { busy, run } = useAccion();
  return (
    <>
      <SucursalNota />
      <Acciones><Pdf busy={busy === "pdf"} tarda="~40 s" onClick={() => run("pdf", () => abrirCierreMesPdf(officeId))} /></Acciones>
    </>
  );
}

function PanelMesCurso() {
  const { officeId } = useSucursal();
  const { busy, run } = useAccion();
  return (
    <>
      <SucursalNota />
      <Acciones><Pdf busy={busy === "pdf"} tarda="~40 s" onClick={() => run("pdf", () => abrirMesCursoPdf(officeId))} /></Acciones>
    </>
  );
}

function PanelTiendas() {
  const { officeId } = useSucursal();
  const [semanas, setSemanas] = useState(5);
  const { busy, run } = useAccion();
  return (
    <>
      <SucursalNota />
      <Semanas opciones={[4, 5, 8, 13]} valor={semanas} set={setSemanas} />
      <Acciones><Pdf busy={busy === "pdf"} tarda="~30 s" onClick={() => run("pdf", () => abrirSucursalesPdf(officeId, semanas))} /></Acciones>
    </>
  );
}

function PanelMananas() {
  const { officeId } = useSucursal();
  const [semanas, setSemanas] = useState(8);
  const { busy, run } = useAccion();
  return (
    <>
      <SucursalNota />
      <Semanas opciones={[4, 8, 13]} valor={semanas} set={setSemanas} />
      <Acciones><Pdf busy={busy === "pdf"} tarda="~20 s" onClick={() => run("pdf", () => abrirMananasPdf(officeId, semanas))} /></Acciones>
    </>
  );
}

function PanelCatalogo() {
  const { officeId } = useSucursal();
  const opciones = useBIQuery<CatalogoOpciones>({
    queryKey: ["informes", "catalogo", "opciones"],
    queryFn: ({ signal }) => getCatalogoOpciones(signal),
  });
  const [dep, setDep] = useState("");
  const [cat, setCat] = useState("");
  const [soloStock, setSoloStock] = useState(true);
  const [soloFoto, setSoloFoto] = useState(false);
  const { busy, run } = useAccion();
  const deps = opciones.data?.departamentos ?? [];
  const cats = deps.find((d) => d.departamento === dep)?.categorias ?? [];
  const sel = "block w-full rounded-lg border border-white/10 bg-bg px-2 py-1.5 text-sm text-fg";
  return (
    <>
      <SucursalNota />
      {opciones.data && (
        <p className="mb-5 text-xs text-muted">{opciones.data.con_foto} de {opciones.data.productos} productos activos tienen foto.</p>
      )}
      <Seccion titulo="Qué productos">
        <div className="grid gap-2">
          <select aria-label="Departamento" className={sel} value={dep} onChange={(e) => { setDep(e.target.value); setCat(""); }}>
            <option value="">Todos los departamentos</option>
            {deps.map((d) => <option key={d.departamento} value={d.departamento}>{d.departamento} ({d.productos})</option>)}
          </select>
          {dep && (
            <select aria-label="Categoría" className={sel} value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="">Todas las categorías</option>
              {cats.map((c) => <option key={c.categoria} value={c.categoria}>{c.categoria} ({c.productos})</option>)}
            </select>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Chip on={soloStock} onClick={() => setSoloStock(!soloStock)}>Solo con stock</Chip>
          <Chip on={soloFoto} onClick={() => setSoloFoto(!soloFoto)}>Solo con foto</Chip>
        </div>
      </Seccion>
      <Acciones>
        <Pdf busy={busy === "pdf"} tarda="las fotos tardan unos segundos" onClick={() => run("pdf", () =>
          abrirCatalogoPdf({ departamento: dep || null, categoria: cat || null, soloConStock: soloStock, soloConFoto: soloFoto, officeId }))} />
      </Acciones>
    </>
  );
}

// ── el catálogo de informes ─────────────────────────────────────────────────

type Grupo = "Comprar" | "Stock" | "Ventas y tiendas" | "Catálogo";

export interface Reporte {
  id: string;
  grupo: Grupo;
  titulo: string;
  /** Una línea para la tarjeta. */
  resumen: string;
  /** El detalle, solo dentro del panel. */
  detalle: string;
  icon: ComponentType<{ className?: string }>;
  salidas: ("PDF" | "Excel")[];
  Panel: ComponentType;
}

export const REPORTES: Reporte[] = [
  { id: "compras", grupo: "Comprar", titulo: "¿Qué compramos esta semana?", icon: Wallet, salidas: ["PDF", "Excel"], Panel: PanelCompras,
    resumen: "Qué se agotó y cuánto pedir, dentro del presupuesto.",
    detalle: "Qué productos se agotaron y cuánto pedir en las tiendas elegidas, dentro del presupuesto. Sin Navidad ni juguetes." },
  { id: "campana", grupo: "Comprar", titulo: "Campaña de juguetes", icon: Gift, salidas: ["PDF", "Excel"], Panel: PanelCampana,
    resumen: "Cuánto capital y qué juguetes comprar para Navidad.",
    detalle: "Cuánto capital poner en cada nivel de costo y qué juguetes comprar por categoría y subcategoría, en dos compras: ahora y la reserva de diciembre. Con el reparto por tienda." },
  { id: "estancados", grupo: "Stock", titulo: "Productos estancados", icon: PackageX, salidas: ["PDF", "Excel"], Panel: PanelEstancados,
    resumen: "Lo que no se vende: trasladar, promocionar o rematar.",
    detalle: "Stock que no se vende en 90 días, que dura más de 6 meses o que se frenó (+45 días sin venderse), y lo lento que no conviene recomprar. Qué trasladar a otra tienda (allá sí se vende), qué probar donde nunca lo tuvieron, qué promocionar, qué rematar y qué guardar para su campaña." },
  { id: "traslados", grupo: "Stock", titulo: "Traslados entre tiendas", icon: Repeat, salidas: ["Excel"], Panel: PanelTraslados,
    resumen: "Qué pasar de una tienda a otra antes de comprar.",
    detalle: "Qué productos mover entre las tiendas marcadas antes de comprar: lo que sobra en una y falta en otra." },
  { id: "cierre", grupo: "Ventas y tiendas", titulo: "Cierre del mes pasado", icon: CalendarCheck, salidas: ["PDF"], Panel: PanelCierreMes,
    resumen: "Cómo nos fue, qué bajó, qué rebajar y qué rematar.",
    detalle: "Cómo nos fue, cómo se movió cada categoría y por qué bajó, quiebres, qué rebajar y qué rematar." },
  { id: "curso", grupo: "Ventas y tiendas", titulo: "Mes en curso + compras", icon: ShoppingCart, salidas: ["PDF"], Panel: PanelMesCurso,
    resumen: "Avance contra el año pasado y cuánto comprar.",
    detalle: "Avance contra el año pasado, categorías que vienen bajando y cuánto comprar (temporada + reposición)." },
  { id: "tiendas", grupo: "Ventas y tiendas", titulo: "¿Cómo funciona cada tienda?", icon: Store, salidas: ["PDF"], Panel: PanelTiendas,
    resumen: "Días, horas, departamentos y stock de cada tienda.",
    detalle: "Con todas las tiendas: comparadas lado a lado (qué días y a qué hora venden, qué departamentos, qué se compra junto, para cuántos días alcanza el stock, qué agotados se pueden trasladar y por qué bajan las ventas). Con una sucursal: solo esa, contra el promedio de las otras." },
  { id: "mananas", grupo: "Ventas y tiendas", titulo: "¿Cómo vendemos más en la mañana?", icon: Sunrise, salidas: ["PDF"], Panel: PanelMananas,
    resumen: "Qué pasa antes de la 1 pm y cómo vender más.",
    detalle: "Cuánto entra antes de la 1 pm, si falta gente o ticket, a qué hora llega el primer cliente, qué mañana es la más floja y cuánto se ganaría, qué se compra temprano, agotados de la mañana y un plan por tienda." },
  { id: "catalogo", grupo: "Catálogo", titulo: "Catálogo de productos", icon: BookImage, salidas: ["PDF"], Panel: PanelCatalogo,
    resumen: "Foto, precio y disponibilidad, 12 por página.",
    detalle: "Foto, precio con IGV y si está disponible, 12 productos por página y agrupados por categoría. Siempre con los precios y el stock de hoy." },
];

const GRUPOS: { grupo: Grupo; desc: string }[] = [
  { grupo: "Comprar", desc: "Qué pedir y con cuánto" },
  { grupo: "Stock", desc: "Mover o liquidar lo que no rota" },
  { grupo: "Ventas y tiendas", desc: "Cómo vamos y dónde mejorar" },
  { grupo: "Catálogo", desc: "Para clientes y vendedores" },
];

/** El informe que conviene hoy: 1-5 del mes → cierre; lunes → compras; nov-dic → campaña; si no, mes en curso. */
export function recomendadoHoy(hoy = new Date()): { id: string; motivo: string } {
  const dia = hoy.getDate();
  const mes = hoy.getMonth(); // 0 = enero
  if (dia <= 5) return { id: "cierre", motivo: "es inicio de mes" };
  if (hoy.getDay() === 1) return { id: "compras", motivo: "es lunes, día de compras" };
  if (mes === 10 || (mes === 11 && dia <= 24)) return { id: "campana", motivo: "estamos en campaña de Navidad" };
  return { id: "curso", motivo: "para ver cómo va el mes" };
}

/** Panel lateral de un informe: descripción completa + sus opciones + sus botones. */
export function PanelReporte({ reporte, onClose }: { reporte: Reporte | null; onClose: () => void }) {
  return (
    <Drawer open={!!reporte} onClose={onClose} title={reporte?.titulo} subtitle={reporte?.salidas.join(" · ")} width="max-w-md">
      {reporte && (
        <>
          <p className="mb-5 text-sm text-muted">{reporte.detalle}</p>
          <reporte.Panel key={reporte.id} />
        </>
      )}
    </Drawer>
  );
}

/** Franja "Recomendado hoy" (va arriba de la página, en las dos pestañas). */
export function RecomendadoHoy({ onAbrir }: { onAbrir: (id: string) => void }) {
  const { id, motivo } = recomendadoHoy();
  const r = REPORTES.find((x) => x.id === id);
  if (!r) return null;
  return (
    <button type="button" onClick={() => onAbrir(r.id)}
      className="mb-4 flex w-full items-center gap-3 rounded-2xl border border-yellow-400/30 bg-yellow-400/[0.06] px-4 py-3 text-left transition-colors hover:bg-yellow-400/[0.1]">
      <Sparkles className="h-5 w-5 shrink-0 text-yellow-400" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-fg">Recomendado hoy: {r.titulo}</span>
        <span className="block truncate text-xs text-muted">Porque {motivo}. {r.resumen}</span>
      </span>
      <span className="hidden items-center gap-1 text-sm font-medium text-primary sm:flex">Abrir <ChevronRight className="h-4 w-4" /></span>
    </button>
  );
}

/** Pestaña "Descargas": tarjetas chicas por grupo; el clic abre el panel con las opciones. */
export function DescargasSection({ onAbrir }: { onAbrir: (id: string) => void }) {
  return (
    <div className="space-y-6">
      {GRUPOS.map(({ grupo, desc }) => (
        <section key={grupo}>
          <div className="mb-2 flex items-baseline gap-2">
            <h3 className="text-sm font-semibold text-fg">{grupo}</h3>
            <span className="text-xs text-muted">{desc}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {REPORTES.filter((r) => r.grupo === grupo).map((r) => (
              <button key={r.id} type="button" onClick={() => onAbrir(r.id)}
                className="group flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition-colors hover:border-primary/40 hover:bg-white/[0.06]">
                <r.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-fg">{r.titulo}</span>
                  <span className="mt-0.5 block text-xs text-muted">{r.resumen}</span>
                  <span className="mt-2 flex gap-1.5">
                    {r.salidas.map((s) => (
                      <span key={s} className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-semibold text-muted">{s}</span>
                    ))}
                  </span>
                </span>
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
