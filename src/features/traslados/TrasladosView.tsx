"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardPaste,
  FileText,
  RefreshCw,
  Scale,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { ApiError } from "@/lib/api";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
  emitirTraslados,
  getHistorialTraslados,
  getSucursalesTraslado,
  trasladosKeys,
  validarTraslado,
  type LineaTraslado,
  type ResultadoEmision,
  type ValidacionTraslado,
} from "@/lib/traslados-api";

/* ────────────────────────────────────────────────────────────
 * Traslados entre sucursales.
 *
 * 1. Origen (almacén o tienda) y, si se pega solo SKU + cantidad, destino.
 * 2. Pegar desde Excel → el backend calcula con el stock EN VIVO de BSale.
 * 3. Corregir en la tabla (cantidades, quitar filas, ajustar a lo disponible).
 * 4. Emitir → un "TRASLADO INTERNO" en BSale por cada tienda de destino.
 * La tienda lo recepciona en BSale como siempre; el historial lo muestra.
 * ──────────────────────────────────────────────────────────── */

type Cantidades = Record<string, Record<string, number>>; // sku → destino → unidades

const ESTADO_UI: Record<string, { label: string; tone: "success" | "warning" | "danger" | "neutral" }> = {
  ok: { label: "OK", tone: "success" },
  insuficiente: { label: "No alcanza", tone: "warning" },
  sin_stock: { label: "Sin stock", tone: "danger" },
  no_existe: { label: "No existe", tone: "danger" },
  sin_dato: { label: "Sin dato", tone: "danger" },
  omitido: { label: "En cero", tone: "neutral" },
};

/** Copia de las cantidades por destino con los destinos `omitir` en 0. */
function sinDestinos(c: Record<string, number>, omitir: number[]): Record<string, number> {
  const out = { ...c };
  for (const d of omitir) if (String(d) in out) out[String(d)] = 0;
  return out;
}

function nuevoRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function fechaBsale(unix: number): string {
  // BSale guarda el día como medianoche UTC.
  return new Date(unix * 1000).toLocaleDateString("es-PE", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function mensajeError(err: unknown): string {
  if (err instanceof ApiError) {
    const d = err.detail as { mensaje?: string } | string | undefined;
    if (d && typeof d === "object" && d.mensaje) return d.mensaje;
    return err.message;
  }
  return err instanceof Error ? err.message : "Error inesperado";
}

/** Estado de una línea con las cantidades ya corregidas en pantalla. */
function estadoLocal(ln: LineaTraslado, total: number): { estado: string; queda: number | null } {
  if (ln.variant_id === null) return { estado: "no_existe", queda: null };
  if (ln.stock_origen === null) return { estado: "sin_dato", queda: null };
  const queda = ln.stock_origen - total;
  if (total === 0) return { estado: "omitido", queda };
  if (ln.stock_origen <= 0) return { estado: "sin_stock", queda };
  if (queda < 0) return { estado: "insuficiente", queda };
  return { estado: "ok", queda };
}

export function TrasladosView() {
  const qc = useQueryClient();
  const [origenId, setOrigenId] = useState<number | null>(null);
  const [destinoId, setDestinoId] = useState<number | null>(null);
  const [texto, setTexto] = useState("");
  const [validacion, setValidacion] = useState<ValidacionTraslado | null>(null);
  const [firma, setFirma] = useState(""); // qué se validó (para saber si cambió)
  const [cant, setCant] = useState<Cantidades>({});
  const [quitados, setQuitados] = useState<Set<string>>(new Set());
  const [requestId, setRequestId] = useState("");
  const [confirmar, setConfirmar] = useState(false);
  const [resultado, setResultado] = useState<ResultadoEmision | null>(null);
  // Destinos que YA se emitieron desde este pegado (una emisión que se detuvo a medias).
  // Sus columnas quedan en 0 aunque se vuelva a revisar el stock: así no se duplican en BSale.
  const [yaEmitidos, setYaEmitidos] = useState<{ origen: number; destinos: number[] } | null>(null);

  const sucursalesQ = useQuery({
    queryKey: trasladosKeys.sucursales,
    queryFn: ({ signal }) => getSucursalesTraslado(signal),
    staleTime: 10 * 60_000,
  });
  const historialQ = useQuery({
    queryKey: trasladosKeys.historial,
    queryFn: ({ signal }) => getHistorialTraslados(signal),
    staleTime: 60_000,
  });

  const sucursales = sucursalesQ.data?.sucursales ?? [];
  const nombre = (id: number | string) =>
    sucursales.find((s) => s.office_id === Number(id))?.nombre ?? `Sucursal ${id}`;

  const firmaActual = `${origenId}|${destinoId}|${texto}`;
  const desactualizado = validacion !== null && firma !== firmaActual;
  const emitidosAqui = yaEmitidos && yaEmitidos.origen === origenId ? yaEmitidos.destinos : [];

  const validar = useMutation({
    mutationFn: () => validarTraslado({ origen_id: origenId!, destino_id: destinoId, texto }),
    onSuccess: (v) => {
      setValidacion(v);
      setFirma(firmaActual);
      const omitir = yaEmitidos && yaEmitidos.origen === origenId ? yaEmitidos.destinos : [];
      setCant(Object.fromEntries(v.lineas.map((l) => [l.sku, sinDestinos(l.cantidades, omitir)])));
      if (omitir.length) {
        toast.warning(`No se vuelve a enviar a ${omitir.map(nombre).join(", ")}: ya se emitió.`, {
          description: "Esas columnas quedan en 0. Si de verdad quieres otro traslado ahí, pulsa Limpiar y pega de nuevo.",
        });
      }
      setQuitados(new Set());
      setRequestId(nuevoRequestId());
      setResultado(null);
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  // Líneas con cantidades corregidas y estado recalculado en pantalla.
  const filas = useMemo(() => {
    if (!validacion) return [];
    return validacion.lineas
      .filter((l) => !quitados.has(l.sku))
      .map((l) => {
        const c = cant[l.sku] ?? l.cantidades;
        const total = Object.values(c).reduce((a, b) => a + (b || 0), 0);
        return { ...l, cantidades: c, total, ...estadoLocal(l, total) };
      });
  }, [validacion, cant, quitados]);

  const destinos = useMemo(() => {
    if (!validacion) return [] as number[];
    return validacion.destinos.map((d) => d.office_id);
  }, [validacion]);

  const resumen = useMemo(() => {
    const porDestino = destinos.map((d) => {
      const items = filas
        .filter((f) => f.variant_id !== null && (f.cantidades[String(d)] ?? 0) > 0)
        .map((f) => ({ variant_id: f.variant_id as number, cantidad: f.cantidades[String(d)] }));
      return { destino_id: d, items, unidades: items.reduce((a, i) => a + i.cantidad, 0) };
    }).filter((t) => t.items.length > 0);
    const problemas = filas.filter((f) => !["ok", "omitido"].includes(f.estado));
    return {
      porDestino,
      problemas,
      unidades: porDestino.reduce((a, t) => a + t.unidades, 0),
      lineas: filas.filter((f) => f.estado === "ok").length,
    };
  }, [filas, destinos]);

  const erroresBloqueantes = (validacion?.errores ?? []).filter((e) => e.linea === 0 && !e.sku);
  const puedeEmitir =
    !!validacion && !desactualizado && resumen.problemas.length === 0 &&
    resumen.porDestino.length > 0 && erroresBloqueantes.length === 0;

  const emitir = useMutation({
    mutationFn: () =>
      emitirTraslados({ origen_id: origenId!, request_id: requestId, traslados: resumen.porDestino }),
    onSuccess: (r) => {
      setConfirmar(false);
      setResultado(r);
      qc.invalidateQueries({ queryKey: trasladosKeys.historial });
      if (r.ok) {
        toast.success(`${r.emitidos.length} traslado(s) creados en BSale`);
        setValidacion(null);
        setTexto("");
        setYaEmitidos(null);
      } else {
        toast.error(`Se detuvo en ${r.error?.destino}: revisa el resultado.`);
        if (r.emitidos.length && origenId != null) {
          // Lo emitido sale de la tabla y el reintento va con otro request_id: con el mismo, el
          // backend devolvería este mismo resultado y nunca emitiría los pendientes.
          const hechos = r.emitidos.map((e) => e.destino_id);
          setYaEmitidos((prev) => ({
            origen: origenId,
            destinos: [...new Set([...(prev?.origen === origenId ? prev.destinos : []), ...hechos])],
          }));
          setCant((prev) => Object.fromEntries(Object.entries(prev).map(([sku, c]) => [sku, sinDestinos(c, hechos)])));
          setRequestId(nuevoRequestId());
        }
      }
    },
    onError: (e) => {
      setConfirmar(false);
      toast.error(mensajeError(e));
    },
  });

  const setCantidad = (sku: string, destino: string, valor: string) => {
    const n = Math.max(0, Math.floor(Number(valor) || 0));
    setCant((prev) => ({ ...prev, [sku]: { ...(prev[sku] ?? {}), [destino]: n } }));
  };

  /** Baja lo pedido al stock disponible, empezando por el destino con más unidades. */
  const ajustarADisponible = () => {
    setCant((prev) => {
      const next = { ...prev };
      for (const f of filas) {
        if (f.estado !== "insuficiente" && f.estado !== "sin_stock") continue;
        let sobra = f.total - Math.max(0, f.stock_origen ?? 0);
        const c = { ...f.cantidades };
        const orden = Object.keys(c).sort((a, b) => c[b] - c[a]);
        for (const d of orden) {
          if (sobra <= 0) break;
          const baja = Math.min(c[d], sobra);
          c[d] -= baja;
          sobra -= baja;
        }
        next[f.sku] = c;
      }
      return next;
    });
  };

  const quitarConProblema = () =>
    setQuitados((prev) => {
      const s = new Set(prev);
      filas.filter((f) => ["no_existe", "sin_dato", "sin_stock"].includes(f.estado)).forEach((f) => s.add(f.sku));
      return s;
    });

  if (sucursalesQ.isLoading) return <LoadingState label="Cargando sucursales…" />;
  if (sucursalesQ.error) return <ErrorState error={sucursalesQ.error} />;

  const origenes = sucursales.filter((s) => s.puede_origen);
  const hayProblemas = resumen.problemas.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catálogo & Stock"
        title="Traslados entre sucursales"
        description="Pega desde Excel el SKU y la cantidad (o una columna por tienda). El sistema revisa el stock en BSale y crea el traslado interno, sin digitar SKU por SKU."
      />

      {/* 1 · Origen, destino y pegado */}
      <Card>
        <CardHeader eyebrow="Paso 1" title="¿Desde dónde y qué envías?" />
        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Desde" hint="Almacén o tienda. El stock se revisa en vivo en BSale.">
              <Select
                value={origenId ?? ""}
                onChange={(e) => {
                  const v = e.target.value ? Number(e.target.value) : null;
                  setOrigenId(v);
                  if (v !== null && v === destinoId) setDestinoId(null);
                }}
              >
                <option value="">Elige el origen…</option>
                {origenes.map((s) => (
                  <option key={s.office_id} value={s.office_id}>
                    {s.nombre} (#{s.office_id}){s.tiene_stock ? "" : " · sin stock en el último sync"}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Hacia" hint="Si pegas una columna por tienda, se usan esas tiendas.">
              <Select
                value={destinoId ?? ""}
                onChange={(e) => setDestinoId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Una sola tienda… (o reparto por columnas)</option>
                {sucursales
                  .filter((s) => s.office_id !== origenId)
                  .map((s) => (
                    <option key={s.office_id} value={s.office_id}>
                      {s.nombre} (#{s.office_id})
                    </option>
                  ))}
              </Select>
            </Field>
          </div>

          <Field
            label="Pega aquí desde Excel"
            hint="Formato 1: SKU | Cantidad. Formato 2: con la fila de títulos SKU | Asamblea | Magdalena… (una columna por tienda)."
          >
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={8}
              spellCheck={false}
              placeholder={"SKU\tCantidad\n9202403307163\t5\nH-TS-011\t12"}
              className="min-h-40 w-full rounded-xl border border-border/40 bg-surface-2/40 px-3.5 py-3 font-mono text-caption text-fg placeholder:text-faint focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/20"
            />
          </Field>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => validar.mutate()}
              loading={validar.isPending}
              disabled={!origenId || !texto.trim()}
            >
              <ClipboardPaste className="h-4 w-4" />
              {validar.isPending ? "Consultando stock en BSale…" : "Revisar stock"}
            </Button>
            {(texto || validacion) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setTexto("");
                  setValidacion(null);
                  setResultado(null);
                  setYaEmitidos(null);
                }}
              >
                <X className="h-4 w-4" /> Limpiar
              </Button>
            )}
            {validar.isPending && (
              <span className="text-caption text-muted">Con muchos SKU puede tardar unos 10 segundos.</span>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Resultado de la emisión */}
      {resultado && (
        <Card>
          <CardHeader
            eyebrow="Resultado"
            title={resultado.ok ? "Traslados creados en BSale" : "La emisión se detuvo"}
            subtitle="Ahora cada tienda debe recepcionar su traslado en BSale."
          />
          <CardBody className="space-y-3">
            {resultado.emitidos.map((e) => (
              <div key={e.shipping_id} className="flex flex-wrap items-center gap-3 rounded-xl bg-surface-2/50 px-4 py-3">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span className="font-semibold text-fg">N.º {e.numero ?? "—"}</span>
                <span className="text-muted">→ {e.destino}</span>
                <span className="text-muted">{e.lineas} líneas · {e.unidades} unidades</span>
                {e.url_pdf && (
                  <a href={e.url_pdf} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 text-primary hover:underline">
                    <FileText className="h-4 w-4" /> PDF
                  </a>
                )}
              </div>
            ))}
            {resultado.error && (
              <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-body text-fg">
                No se pudo crear el traslado a <b>{resultado.error.destino}</b>: {resultado.error.mensaje}
                {resultado.pendientes.length > 1 && (
                  <p className="mt-1 text-caption text-muted">
                    Tampoco se crearon: {resultado.pendientes.filter((p) => p !== resultado.error?.destino_id).map(nombre).join(", ")}.
                  </p>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* 2 · Tabla calculada */}
      {validacion && (
        <Card>
          <CardHeader
            eyebrow="Paso 2"
            title={`Desde ${nombre(validacion.origen_id ?? origenId ?? 0)}`}
            subtitle={
              desactualizado
                ? "Cambiaste el origen, el destino o lo pegado: vuelve a presionar «Revisar stock»."
                : yaEmitidos && yaEmitidos.origen === origenId
                  ? `Ya se emitió a ${yaEmitidos.destinos.map(nombre).join(", ")}: esas columnas quedan en 0 para no duplicar. Emite lo que falta.`
                  : "Stock leído de BSale en este momento. Puedes corregir cantidades antes de emitir."
            }
            action={
              <div className="flex flex-wrap gap-2">
                {resumen.problemas.some((p) => p.estado === "insuficiente" || p.estado === "sin_stock") && (
                  <Button size="sm" variant="secondary" onClick={ajustarADisponible}>
                    <Scale className="h-4 w-4" /> Ajustar a lo disponible
                  </Button>
                )}
                {resumen.problemas.some((p) => ["no_existe", "sin_dato", "sin_stock"].includes(p.estado)) && (
                  <Button size="sm" variant="secondary" onClick={quitarConProblema}>
                    <Trash2 className="h-4 w-4" /> Quitar filas con error
                  </Button>
                )}
              </div>
            }
          />
          <CardBody className="space-y-4">
            {(validacion.errores.length > 0 || validacion.avisos.length > 0) && (
              <div className="space-y-2">
                {validacion.errores.map((e, i) => (
                  <p key={`e${i}`} className="rounded-lg bg-danger/10 px-3 py-2 text-caption text-danger">
                    {e.linea > 0 && <b>Fila {e.linea}: </b>}
                    {e.sku && <b>{e.sku} — </b>}
                    {e.mensaje}
                  </p>
                ))}
                {validacion.avisos.map((a, i) => (
                  <p key={`a${i}`} className="rounded-lg bg-warning/10 px-3 py-2 text-caption text-warning">{a}</p>
                ))}
              </div>
            )}

            {filas.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-border-soft">
                <table className="w-full min-w-[640px] text-body">
                  <thead className="bg-surface-2/60 text-caption uppercase tracking-[0.06em] text-muted">
                    <tr>
                      <th className="px-3 py-2 text-left">SKU</th>
                      <th className="px-3 py-2 text-left">Producto</th>
                      {destinos.map((d) => (
                        <th key={d} className="px-3 py-2 text-right">{destinos.length > 1 ? nombre(d) : "Envía"}</th>
                      ))}
                      <th className="px-3 py-2 text-right">Stock origen</th>
                      <th className="px-3 py-2 text-right">Queda</th>
                      <th className="px-3 py-2 text-left">Estado</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {filas.map((f) => {
                      const ui = ESTADO_UI[f.estado] ?? ESTADO_UI.ok;
                      return (
                        <tr key={f.sku} className={cn("border-t border-border-soft", f.estado !== "ok" && f.estado !== "omitido" && "bg-danger/5")}>
                          <td className="px-3 py-2 font-mono text-caption text-fg">{f.sku}</td>
                          <td className="max-w-xs truncate px-3 py-2 text-muted" title={f.producto ?? ""}>{f.producto ?? "—"}</td>
                          {destinos.map((d) => (
                            <td key={d} className="px-3 py-1.5 text-right">
                              <input
                                type="number"
                                min={0}
                                inputMode="numeric"
                                aria-label={`Cantidad de ${f.sku} para ${nombre(d)}`}
                                value={f.cantidades[String(d)] ?? 0}
                                onChange={(e) => setCantidad(f.sku, String(d), e.target.value)}
                                disabled={f.variant_id === null || emitidosAqui.includes(d)}
                                title={emitidosAqui.includes(d) ? "Ya se emitió a esta tienda" : undefined}
                                className="h-8 w-20 rounded-lg border border-border/40 bg-surface-2/40 px-2 text-right text-body text-fg focus:border-primary/50 focus:outline-none"
                              />
                            </td>
                          ))}
                          <td className="px-3 py-2 text-right tabular-nums text-fg">{f.stock_origen ?? "—"}</td>
                          <td className={cn("px-3 py-2 text-right tabular-nums", (f.queda ?? 0) < 0 ? "text-danger" : "text-fg")}>
                            {f.queda ?? "—"}
                          </td>
                          <td className="px-3 py-2">
                            <Badge tone={ui.tone}>{ui.label}</Badge>
                            {f.estado === "insuficiente" && (
                              <span className="ml-2 text-caption text-warning">faltan {-(f.queda ?? 0)}</span>
                            )}
                          </td>
                          <td className="px-2">
                            <button
                              type="button"
                              aria-label={`Quitar ${f.sku}`}
                              onClick={() => setQuitados((s) => new Set(s).add(f.sku))}
                              className="rounded-lg p-1 text-faint hover:bg-surface-2 hover:text-danger"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 border-t border-border-soft pt-4">
              <div className="flex flex-wrap gap-2">
                {resumen.porDestino.map((t) => (
                  <Badge key={t.destino_id} tone="primary">
                    {nombre(t.destino_id)}: {t.items.length} líneas · {t.unidades} u.
                  </Badge>
                ))}
                {hayProblemas && (
                  <Badge tone="danger">{resumen.problemas.length} fila(s) por corregir</Badge>
                )}
              </div>
              <Button className="ml-auto" disabled={!puedeEmitir} onClick={() => setConfirmar(true)}>
                <Truck className="h-4 w-4" /> Emitir {resumen.porDestino.length > 1 ? `${resumen.porDestino.length} traslados` : "traslado"}
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* 3 · Historial */}
      <Card>
        <CardHeader
          eyebrow="Historial"
          title="Últimos traslados"
          subtitle="Incluye los hechos a mano en BSale. «Falta recepcionar» = la tienda aún no lo recibe en BSale."
          action={
            <Button size="sm" variant="ghost" onClick={() => historialQ.refetch()} loading={historialQ.isFetching}>
              <RefreshCw className="h-4 w-4" /> Actualizar
            </Button>
          }
        />
        <CardBody>
          {historialQ.isLoading ? (
            <LoadingState label="Leyendo traslados en BSale…" />
          ) : historialQ.error ? (
            <ErrorState error={historialQ.error} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-body">
                <thead className="text-caption uppercase tracking-[0.06em] text-muted">
                  <tr>
                    <th className="px-3 py-2 text-left">N.º</th>
                    <th className="px-3 py-2 text-left">Fecha</th>
                    <th className="px-3 py-2 text-left">Ruta</th>
                    <th className="px-3 py-2 text-right">Líneas</th>
                    <th className="px-3 py-2 text-right">Unidades</th>
                    <th className="px-3 py-2 text-left">Estado</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {(historialQ.data?.traslados ?? []).map((h) => (
                    <tr key={h.shipping_id} className="border-t border-border-soft">
                      <td className="px-3 py-2 font-semibold text-fg">{h.numero ?? "—"}</td>
                      <td className="px-3 py-2 text-muted">{fechaBsale(h.fecha)}</td>
                      <td className="px-3 py-2 text-fg">
                        <span className="inline-flex items-center gap-1.5">
                          {h.origen} <ArrowRight className="h-3.5 w-3.5 text-faint" /> {h.destino}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{h.lineas}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{h.unidades ?? "—"}</td>
                      <td className="px-3 py-2">
                        <Badge tone={h.recibido ? "success" : "warning"} dot>
                          {h.recibido ? "Recibido" : "Falta recepcionar"}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-right">
                        {h.url_pdf && (
                          <a href={h.url_pdf} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                            <FileText className="h-4 w-4" /> PDF
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <Dialog
        open={confirmar}
        onClose={() => !emitir.isPending && setConfirmar(false)}
        title="¿Crear los traslados en BSale?"
        description={`Desde ${nombre(origenId ?? 0)}. El stock se descuenta del origen al emitir; cada tienda lo suma al recepcionar.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmar(false)} disabled={emitir.isPending}>
              Cancelar
            </Button>
            <Button onClick={() => emitir.mutate()} loading={emitir.isPending}>
              <Truck className="h-4 w-4" /> Sí, emitir
            </Button>
          </>
        }
      >
        <ul className="space-y-2 text-body">
          {resumen.porDestino.map((t) => (
            <li key={t.destino_id} className="flex justify-between gap-4">
              <span className="text-fg">{nombre(t.destino_id)}</span>
              <span className="text-muted">{t.items.length} líneas · {t.unidades} unidades</span>
            </li>
          ))}
        </ul>
      </Dialog>
    </div>
  );
}
